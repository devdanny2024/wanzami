param(
  [switch]$SkipLint,
  [switch]$SkipTypecheck,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

function Run-Step([string]$Name, [string]$Command) {
  Write-Host "`n==> $Name" -ForegroundColor Cyan
  npm run $Command
}

Write-Host "Running Admin quality gate..." -ForegroundColor Green

if (-not $SkipTypecheck) { Run-Step "Typecheck" "typecheck" }
if (-not $SkipLint) { Run-Step "Lint" "lint" }
if (-not $SkipBuild) { Run-Step "Build" "build" }

Write-Host "`nQuality gate completed successfully." -ForegroundColor Green
