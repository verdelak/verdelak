param(
    [string]$DistRoot = "Verdelak.Angular/dist",
    [string]$Output = "artifacts/bundle/angular-bundle-report.md",
    [int]$Top = 25,
    [int]$InitialBudgetKb = 550,
    [int]$LazyReviewKb = 125,
    [string]$StatsFileName = "stats.json",
    [switch]$FailOnThreshold
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$distPath = Join-Path $repoRoot $DistRoot
$outputPath = Join-Path $repoRoot $Output
$outputDir = Split-Path -Parent $outputPath

if (-not (Test-Path $distPath)) {
    throw "Angular dist folder was not found at $distPath. Run npm run build in Verdelak.Angular first."
}

$indexFile = Get-ChildItem -Path $distPath -Recurse -Filter "index.html" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $indexFile) {
    throw "No index.html was found below $distPath."
}

$browserRoot = Split-Path -Parent $indexFile.FullName
$indexHtml = Get-Content -Path $indexFile.FullName -Raw
$initialAssets = New-Object 'System.Collections.Generic.HashSet[string]'
$statsFile = Get-ChildItem -Path $distPath -Recurse -Filter $StatsFileName |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
$statsPath = if ($statsFile) { $statsFile.FullName } else { Join-Path $distPath $StatsFileName }
$statsOutputs = @{}

if (Test-Path $statsPath) {
    $stats = Get-Content -Path $statsPath -Raw | ConvertFrom-Json
    foreach ($statsOutput in $stats.outputs.PSObject.Properties) {
        $entryPoint = $statsOutput.Value.entryPoint
        if ($entryPoint) {
            $statsOutputs[$statsOutput.Name] = $entryPoint -replace "\\", "/"
        }
    }
}

foreach ($match in [regex]::Matches($indexHtml, '(?:src|href)="([^"]+\.(?:js|css))"')) {
    $assetName = [System.IO.Path]::GetFileName($match.Groups[1].Value)
    [void]$initialAssets.Add($assetName)
}

$assets = Get-ChildItem -Path $browserRoot -Recurse -File |
    Where-Object { $_.Extension -in ".js", ".css" } |
    ForEach-Object {
        $source = if ($statsOutputs.ContainsKey($_.Name)) { $statsOutputs[$_.Name] } else { "-" }
        [pscustomobject]@{
            Name = $_.Name
            RelativePath = $_.FullName.Substring($browserRoot.Length + 1)
            Type = $_.Extension.TrimStart(".")
            SizeBytes = $_.Length
            SizeKb = [math]::Round($_.Length / 1KB, 2)
            Initial = $initialAssets.Contains($_.Name)
            Source = $source
        }
    } |
    Sort-Object SizeBytes -Descending

$initialBytes = ($assets | Where-Object Initial | Measure-Object -Property SizeBytes -Sum).Sum
$lazyBytes = ($assets | Where-Object { -not $_.Initial } | Measure-Object -Property SizeBytes -Sum).Sum
$totalBytes = ($assets | Measure-Object -Property SizeBytes -Sum).Sum
$largestInitialBytes = ($assets | Where-Object Initial | Select-Object -First 1).SizeBytes
$lazyReviewBytes = $LazyReviewKb * 1KB

if ($null -eq $initialBytes) { $initialBytes = 0 }
if ($null -eq $lazyBytes) { $lazyBytes = 0 }
if ($null -eq $totalBytes) { $totalBytes = 0 }
if ($null -eq $largestInitialBytes) { $largestInitialBytes = 0 }

$initialStatus = if ($initialBytes -le ($InitialBudgetKb * 1KB)) { "OK" } else { "Over budget" }
$largeLazyAssets = @($assets | Where-Object { -not $_.Initial -and $_.SizeBytes -ge $lazyReviewBytes })
$lazyStatus = if ($largeLazyAssets.Count -eq 0) { "OK" } else { "$($largeLazyAssets.Count) asset(s) over $LazyReviewKb kB" }
$statsMetadata = if (Test-Path $statsPath) {
    "``$statsPath``"
} else {
    "not found; run ``npm run bundle:report`` to include route source labels"
}

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$lines = @(
    "# Angular Bundle Report",
    "",
    "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')",
    "",
    "Dist root: ``$browserRoot``",
    "",
    "Stats metadata: $statsMetadata",
    "",
    "Initial budget: $InitialBudgetKb kB",
    "",
    "Lazy review threshold: $LazyReviewKb kB",
    "",
    "## Summary",
    "",
    "| Scope | Size | Status |",
    "| --- | ---: | --- |",
    "| Initial JS/CSS | $([math]::Round($initialBytes / 1KB, 2)) kB | $initialStatus |",
    "| Lazy JS/CSS | $([math]::Round($lazyBytes / 1KB, 2)) kB | $lazyStatus |",
    "| Total JS/CSS | $([math]::Round($totalBytes / 1KB, 2)) kB | Informational |",
    "| Largest initial asset | $([math]::Round($largestInitialBytes / 1KB, 2)) kB | Informational |",
    "",
    "## Largest Assets",
    "",
    "| Asset | Source | Type | Initial | Size |",
    "| --- | --- | --- | --- | ---: |"
)

foreach ($asset in ($assets | Select-Object -First $Top)) {
    $lines += "| ``$($asset.RelativePath)`` | $($asset.Source) | $($asset.Type) | $($asset.Initial) | $($asset.SizeKb) kB |"
}

$lines += @(
    "",
    "## Lazy Split Candidates",
    "",
    "| Asset | Source | Type | Size |",
    "| --- | --- | --- | ---: |"
)

if ($largeLazyAssets.Count -eq 0) {
    $lines += "| None | - | - | - |"
} else {
    foreach ($asset in $largeLazyAssets) {
        $lines += "| ``$($asset.RelativePath)`` | $($asset.Source) | $($asset.Type) | $($asset.SizeKb) kB |"
    }
}

$lines += @(
    "",
    "## Review Notes",
    "",
    "- Initial assets should stay below the configured budget above.",
    "- Lazy assets above the review threshold are candidates for deferred panels or child routes when they become hard to maintain.",
    "- Source labels come from Angular stats metadata when available; shared chunks may remain unlabeled.",
    "- Re-run after several feature additions or before release branches."
)

Set-Content -Path $outputPath -Value $lines
Write-Host "Wrote Angular bundle report to $outputPath"

if ($FailOnThreshold -and ($initialStatus -ne "OK" -or $largeLazyAssets.Count -gt 0)) {
    throw "Angular bundle thresholds failed. Initial JS/CSS: $([math]::Round($initialBytes / 1KB, 2)) kB ($initialStatus). Lazy split candidates: $($largeLazyAssets.Count)."
}
