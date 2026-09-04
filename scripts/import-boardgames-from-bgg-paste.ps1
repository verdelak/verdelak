param(
    [Parameter(Mandatory = $true)]
    [string]$PastePath,

    [string]$ConnectionString = "Server=localhost;Database=Verdelak;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;",

    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Normalize-Text([string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ""
    }

    return ($Value -replace [char]0x00A0, " " -replace [char]0x00C2, "" -replace "\s+", " ").Trim()
}

function Parse-Title([string]$Value) {
    $clean = Normalize-Text $Value
    if ($clean -match "^(?<title>.*?)[\s]*\((?<year>\d{4})\)\s*$") {
        return [pscustomobject]@{
            Title = (Normalize-Text $Matches.title)
            Year = [int]$Matches.year
        }
    }

    return [pscustomobject]@{
        Title = $clean
        Year = $null
    }
}

function Parse-DecimalOrNull([string]$Value) {
    $clean = Normalize-Text $Value
    if ([string]::IsNullOrWhiteSpace($clean)) {
        return $null
    }

    $parsed = [decimal]0
    if ([decimal]::TryParse($clean, [System.Globalization.NumberStyles]::Number, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$parsed)) {
        return $parsed
    }

    return $null
}

function Title-Key([string]$Title) {
    return (Normalize-Text $Title).ToLowerInvariant()
}

function Add-Param($Command, [string]$Name, $Value, [System.Data.SqlDbType]$Type) {
    $parameter = $Command.Parameters.Add($Name, $Type)
    $parameter.Value = if ($null -eq $Value) { [DBNull]::Value } else { $Value }
    return $parameter
}

function Execute-ScalarSql($Connection, [string]$Sql, [hashtable]$Params) {
    $command = $Connection.CreateCommand()
    $command.CommandText = $Sql
    foreach ($key in $Params.Keys) {
        $definition = $Params[$key]
        [void](Add-Param $command $key $definition.Value $definition.Type)
    }

    return $command.ExecuteScalar()
}

function Execute-NonQuerySql($Connection, [string]$Sql, [hashtable]$Params) {
    $command = $Connection.CreateCommand()
    $command.CommandText = $Sql
    foreach ($key in $Params.Keys) {
        $definition = $Params[$key]
        [void](Add-Param $command $key $definition.Value $definition.Type)
    }

    return $command.ExecuteNonQuery()
}

if (-not (Test-Path -LiteralPath $PastePath)) {
    throw "Paste file not found: $PastePath"
}

$rows = New-Object System.Collections.Generic.List[object]
$isWishlistSection = $false

foreach ($line in Get-Content -LiteralPath $PastePath -Encoding UTF8) {
    $cleanLine = Normalize-Text $line
    if ([string]::IsNullOrWhiteSpace($cleanLine)) {
        continue
    }

    if ($cleanLine -eq "Wishlist") {
        $isWishlistSection = $true
        continue
    }

    $columns = $line -split "`t", -1
    if ($columns.Count -eq 0) {
        continue
    }

    $firstColumn = Normalize-Text $columns[0]
    if ($firstColumn -in @("Title", "Titleascending sort")) {
        continue
    }

    $titleParts = Parse-Title $firstColumn
    if ([string]::IsNullOrWhiteSpace($titleParts.Title)) {
        continue
    }

    $parent = if ($columns.Count -gt 1) { (Parse-Title $columns[1]).Title } else { "" }
    if ($titleParts.Title -eq "Five Tribes: The Djinns of Naqala" -and $parent -eq "Five Tribes") {
        $parent = ""
    }

    $personalRating = if ($columns.Count -gt 2) { Parse-DecimalOrNull $columns[2] } else { $null }
    $bggRating = if ($columns.Count -gt 3) { Parse-DecimalOrNull $columns[3] } else { $null }

    $rows.Add([pscustomobject]@{
        Title = $titleParts.Title
        Year = $titleParts.Year
        ParentTitle = $parent
        PersonalRating = $personalRating
        BggRating = $bggRating
        Owns = -not $isWishlistSection
        Wishlist = $isWishlistSection
    })
}

$mergedRows = $rows |
    Group-Object { Title-Key $_.Title } |
    ForEach-Object {
        $groupRows = $_.Group
        $first = $groupRows | Select-Object -First 1
        [pscustomobject]@{
            Title = $first.Title
            Year = ($groupRows | Where-Object { $null -ne $_.Year } | Select-Object -First 1).Year
            ParentTitle = (($groupRows | Where-Object { -not [string]::IsNullOrWhiteSpace($_.ParentTitle) } | Select-Object -First 1).ParentTitle)
            PersonalRating = (($groupRows | Where-Object { $null -ne $_.PersonalRating } | Select-Object -First 1).PersonalRating)
            BggRating = (($groupRows | Where-Object { $null -ne $_.BggRating } | Select-Object -First 1).BggRating)
            Owns = [bool]($groupRows | Where-Object { $_.Owns } | Select-Object -First 1)
            Wishlist = [bool]($groupRows | Where-Object { $_.Wishlist } | Select-Object -First 1)
            DuplicateSourceRows = $groupRows.Count
        }
    }

$baseRows = @($mergedRows | Where-Object { [string]::IsNullOrWhiteSpace($_.ParentTitle) } | Sort-Object Title)
$expansionRows = @($mergedRows | Where-Object { -not [string]::IsNullOrWhiteSpace($_.ParentTitle) } | Sort-Object ParentTitle, Title)
$duplicateRows = @($mergedRows | Where-Object { $_.DuplicateSourceRows -gt 1 })

Write-Host "Parsed source rows: $($rows.Count)"
Write-Host "Distinct title rows: $($mergedRows.Count)"
Write-Host "Non-expansion rows: $($baseRows.Count)"
Write-Host "Expansion rows: $($expansionRows.Count)"
Write-Host "Wishlist rows: $(@($mergedRows | Where-Object { $_.Wishlist }).Count)"
Write-Host "Merged duplicate source rows: $($duplicateRows.Count)"

if ($DryRun) {
    Write-Host "Dry run requested; no SQL changes were made."
    if ($duplicateRows.Count -gt 0) {
        Write-Host "Merged duplicate titles:"
        $duplicateRows | Select-Object Title, DuplicateSourceRows | Format-Table -AutoSize
    }
    exit 0
}

$connection = New-Object System.Data.SqlClient.SqlConnection $ConnectionString
$connection.Open()
$beforeCount = Execute-ScalarSql $connection "SELECT COUNT(*) FROM dbo.Games;" @{}
$transaction = $connection.BeginTransaction()

try {
    $upsertSql = @"
DECLARE @ExistingId int;
SELECT @ExistingId = GameID
FROM dbo.Games WITH (UPDLOCK, HOLDLOCK)
WHERE LOWER(LTRIM(RTRIM(Title))) = LOWER(LTRIM(RTRIM(@Title)));

IF @ExistingId IS NULL
BEGIN
    INSERT INTO dbo.Games (Title, IsExpansion, BaseGameID, BGG_Rating, PersonalRating, Owns, Wishlist, Notes)
    OUTPUT INSERTED.GameID
    VALUES (@Title, @IsExpansion, NULL, @BggRating, @PersonalRating, @Owns, @Wishlist, @Notes);
END
ELSE
BEGIN
    UPDATE dbo.Games
    SET IsExpansion = CASE WHEN @IsExpansion = 1 THEN 1 ELSE IsExpansion END,
        BGG_Rating = COALESCE(@BggRating, BGG_Rating),
        PersonalRating = COALESCE(@PersonalRating, PersonalRating),
        Owns = CASE WHEN @Owns = 1 THEN 1 ELSE Owns END,
        Wishlist = CASE WHEN @Wishlist = 1 THEN 1 ELSE Wishlist END,
        Notes = CASE
            WHEN NULLIF(LTRIM(RTRIM(Notes)), '') IS NULL THEN @Notes
            WHEN Notes LIKE '%Imported from BGG pasted export.%' THEN Notes
            ELSE CONCAT(Notes, CHAR(13), CHAR(10), @Notes)
        END
    WHERE GameID = @ExistingId;

    SELECT @ExistingId;
END
"@

    $titleToId = @{}
    $insertedOrUpdated = 0

    foreach ($row in @($baseRows + $expansionRows)) {
        $notes = New-Object System.Collections.Generic.List[string]
        $notes.Add("Imported from BGG pasted export.")
        if ($null -ne $row.Year) {
            $notes.Add("Published: $($row.Year)")
        }
        if (-not [string]::IsNullOrWhiteSpace($row.ParentTitle)) {
            $notes.Add("Expands: $($row.ParentTitle)")
        }
        if ($row.Owns) {
            $notes.Add("Source section: Collection")
        }
        if ($row.Wishlist) {
            $notes.Add("Source section: Wishlist")
        }

        $command = $connection.CreateCommand()
        $command.Transaction = $transaction
        $command.CommandText = $upsertSql
        [void](Add-Param $command "@Title" $row.Title ([System.Data.SqlDbType]::NVarChar))
        [void](Add-Param $command "@IsExpansion" ([bool](-not [string]::IsNullOrWhiteSpace($row.ParentTitle))) ([System.Data.SqlDbType]::Bit))
        [void](Add-Param $command "@BggRating" $row.BggRating ([System.Data.SqlDbType]::Decimal))
        $command.Parameters["@BggRating"].Precision = 8
        $command.Parameters["@BggRating"].Scale = 3
        [void](Add-Param $command "@PersonalRating" $row.PersonalRating ([System.Data.SqlDbType]::Decimal))
        $command.Parameters["@PersonalRating"].Precision = 8
        $command.Parameters["@PersonalRating"].Scale = 3
        [void](Add-Param $command "@Owns" $row.Owns ([System.Data.SqlDbType]::Bit))
        [void](Add-Param $command "@Wishlist" $row.Wishlist ([System.Data.SqlDbType]::Bit))
        [void](Add-Param $command "@Notes" ($notes -join [Environment]::NewLine) ([System.Data.SqlDbType]::NVarChar))

        $gameId = [int]$command.ExecuteScalar()
        $titleToId[(Title-Key $row.Title)] = $gameId
        $insertedOrUpdated++
    }

    $parentAliases = @{
        "7 wonder" = "7 Wonders"
        "five tribes" = "Five Tribes: The Djinns of Naqala"
    }

    $unmatchedParents = New-Object System.Collections.Generic.List[object]
    foreach ($row in $expansionRows) {
        $parentTitle = $row.ParentTitle
        $parentKey = Title-Key $parentTitle
        if ($parentAliases.ContainsKey($parentKey)) {
            $parentTitle = $parentAliases[$parentKey]
            $parentKey = Title-Key $parentTitle
        }

        $childId = $titleToId[(Title-Key $row.Title)]
        $parentId = $titleToId[$parentKey]

        if ($null -eq $parentId) {
            $command = $connection.CreateCommand()
            $command.Transaction = $transaction
            $command.CommandText = "SELECT TOP (1) GameID FROM dbo.Games WHERE LOWER(LTRIM(RTRIM(Title))) = LOWER(LTRIM(RTRIM(@Title))) ORDER BY GameID;"
            [void](Add-Param $command "@Title" $parentTitle ([System.Data.SqlDbType]::NVarChar))
            $result = $command.ExecuteScalar()
            if ($null -ne $result -and $result -ne [DBNull]::Value) {
                $parentId = [int]$result
                $titleToId[$parentKey] = $parentId
            }
        }

        if ($null -eq $parentId) {
            $unmatchedParents.Add([pscustomobject]@{
                Expansion = $row.Title
                Parent = $row.ParentTitle
            })
            continue
        }

        $updateCommand = $connection.CreateCommand()
        $updateCommand.Transaction = $transaction
        $updateCommand.CommandText = "UPDATE dbo.Games SET BaseGameID = @ParentId WHERE GameID = @ChildId;"
        [void](Add-Param $updateCommand "@ParentId" $parentId ([System.Data.SqlDbType]::Int))
        [void](Add-Param $updateCommand "@ChildId" $childId ([System.Data.SqlDbType]::Int))
        [void]$updateCommand.ExecuteNonQuery()
    }

    $transaction.Commit()

    $afterCount = Execute-ScalarSql $connection "SELECT COUNT(*) FROM dbo.Games;" @{}
    $expansionCount = Execute-ScalarSql $connection "SELECT COUNT(*) FROM dbo.Games WHERE IsExpansion = 1;" @{}
    $linkedExpansionCount = Execute-ScalarSql $connection "SELECT COUNT(*) FROM dbo.Games WHERE IsExpansion = 1 AND BaseGameID IS NOT NULL;" @{}
    $wishlistCount = Execute-ScalarSql $connection "SELECT COUNT(*) FROM dbo.Games WHERE Wishlist = 1;" @{}
    $ownedCount = Execute-ScalarSql $connection "SELECT COUNT(*) FROM dbo.Games WHERE Owns = 1;" @{}

    Write-Host "Before count: $beforeCount"
    Write-Host "After count: $afterCount"
    Write-Host "Inserted/updated title rows: $insertedOrUpdated"
    Write-Host "Owned rows now: $ownedCount"
    Write-Host "Wishlist rows now: $wishlistCount"
    Write-Host "Expansion rows now: $expansionCount"
    Write-Host "Linked expansion rows now: $linkedExpansionCount"
    Write-Host "Unmatched expansion parents: $($unmatchedParents.Count)"

    if ($unmatchedParents.Count -gt 0) {
        $unmatchedPath = Join-Path (Split-Path -Parent $PastePath) "boardgame-unmatched-expansion-parents.csv"
        $unmatchedParents | Sort-Object Parent, Expansion | Export-Csv -LiteralPath $unmatchedPath -NoTypeInformation
        Write-Host "Unmatched parent report: $unmatchedPath"
    }
}
catch {
    $transaction.Rollback()
    throw
}
finally {
    $connection.Close()
}
