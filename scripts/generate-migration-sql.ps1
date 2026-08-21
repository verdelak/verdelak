param(
    [string]$Project = "Verdelak.Api/Verdelak.Api.csproj",
    [string]$StartupProject = "Verdelak.Api/Verdelak.Api.csproj",
    [string]$Context = "VerdelakDbContext",
    [string]$Output = "artifacts/sql/verdelak-migrations.sql"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $repoRoot $Output
$outputDir = Split-Path -Parent $outputPath

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

Push-Location $repoRoot
try {
    dotnet ef migrations script `
        --idempotent `
        --project $Project `
        --startup-project $StartupProject `
        --context $Context `
        --output $outputPath

    Write-Host "Wrote idempotent migration script to $outputPath"
}
finally {
    Pop-Location
}
