param([string]$Symbol)
if (-not $Symbol) {
    Write-Host "Uso: .\scripts\verify-impact.ps1 -Symbol <NombreDeSimboloOFuncion>" -ForegroundColor Yellow
    exit 1
}
Write-Host "Ejecutando analisis de impacto con GitNexus para: $Symbol..." -ForegroundColor Cyan
$runner = Join-Path $PSScriptRoot "..\..\..\.gitnexus\run.cjs"
if (Test-Path $runner) {
    node $runner impact --target $Symbol --direction upstream
} else {
    npx gitnexus impact --target $Symbol --direction upstream
}
