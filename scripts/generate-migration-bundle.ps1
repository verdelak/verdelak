param(
    [string]$Project = "Verdelak.Api/Verdelak.Api.csproj",
    [string]$StartupProject = "Verdelak.Api/Verdelak.Api.csproj",
    [string]$Context = "VerdelakDbContext",
    [string]$Output = "artifacts/migrations/verdelak-migrate.exe",
    [string]$Runtime = "win-x64",
    [switch]$SelfContained
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $repoRoot $Output
$outputDir = Split-Path -Parent $outputPath

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$bundleArgs = @(
    "ef",
    "migrations",
    "bundle",
    "--project",
    $Project,
    "--startup-project",
    $StartupProject,
    "--context",
    $Context,
    "--output",
    $outputPath,
    "--runtime",
    $Runtime,
    "--force"
)

if ($SelfContained) {
    $bundleArgs += "--self-contained"
}
else {
    $bundleArgs += "--no-self-contained"
}

Push-Location $repoRoot
try {
    dotnet @bundleArgs
    Write-Host "Wrote migration bundle to $outputPath"
}
finally {
    Pop-Location
}
