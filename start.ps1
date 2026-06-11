$Host.UI.RawUI.WindowTitle = "Munish Perfum - Go Live!"
$ErrorActionPreference = "Stop"

$ROOT_DIR   = Split-Path -Parent $MyInvocation.MyCommand.Path
$FRONT_PORT = 3000
$ADMIN_PORT = 8000

function Test-Cmd($cmd) {
    try { Get-Command $cmd -ErrorAction Stop | Out-Null; return $true }
    catch { return $false }
}

Clear-Host
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "    MUNISH PERFUM - GO LIVE!" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Kill leftovers
foreach ($p in @(3000, 8000)) {
    Get-Process -Name "node","python","php" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match ":$p" } |
        Stop-Process -Force -ErrorAction SilentlyContinue
}

# Frontend
$frontOk = $false
if (Test-Cmd "python") {
    $frontOk = $true
    $j = Start-Job -Name "front" -ScriptBlock { param($d,$p) Set-Location $d; python -m http.server $p 2>&1 } -ArgumentList $ROOT_DIR, $FRONT_PORT
    Write-Host " [1/2] Tienda  ----  http://localhost:$FRONT_PORT" -ForegroundColor Green
}
elseif (Test-Cmd "npx") {
    $frontOk = $true
    $j = Start-Job -Name "front" -ScriptBlock { param($d,$p) Set-Location $d; npx -y http-server -p $p -c-1 --silent 2>&1 } -ArgumentList $ROOT_DIR, $FRONT_PORT
    Write-Host " [1/2] Tienda  ----  http://localhost:$FRONT_PORT" -ForegroundColor Green
}
elseif (Test-Cmd "php") {
    $frontOk = $true
    $j = Start-Job -Name "front" -ScriptBlock { param($d,$p) Set-Location $d; php -S "0.0.0.0:$p" -t "$d" 2>&1 } -ArgumentList $ROOT_DIR, $FRONT_PORT
    Write-Host " [1/2] Tienda  ----  http://localhost:$FRONT_PORT" -ForegroundColor Green
}
else { Write-Host " [1/2] ERROR: Necesita Python o Node.js" -ForegroundColor Red }
$script:frontJob = $j

# Admin
$adminOk = $false
$adminDir = Join-Path $ROOT_DIR "admin-server"
$serverJs = Join-Path $adminDir "server.js"
if (Test-Path $serverJs) {
    if (Test-Cmd "node") {
        $adminOk = $true
        $modDir = Join-Path $adminDir "node_modules"
        if (-not (Test-Path $modDir)) {
            Write-Host "       Instalando dependencias..." -ForegroundColor Yellow
            Push-Location $adminDir; npm install 2>&1 | Out-Null; Pop-Location
        }
        $aj = Start-Job -Name "admin" -ScriptBlock { param($d) Set-Location $d; node server.js 2>&1 } -ArgumentList $adminDir
        Write-Host " [2/2] Admin  ----  http://localhost:$ADMIN_PORT" -ForegroundColor Green
        Write-Host "       Usuario: admin@admin.com / admin123" -ForegroundColor Gray
    }
    else { Write-Host " [2/2] WARN: Node.js no instalado" -ForegroundColor Yellow }
}
else { Write-Host " [2/2] WARN: No se encuentra admin-server" -ForegroundColor Yellow }
$script:adminJob = $aj

Start-Sleep -Seconds 2
if ($frontOk) { try { Start-Process "http://localhost:$FRONT_PORT" } catch {} }
if ($adminOk) { Start-Sleep 1; try { Start-Process "http://localhost:$ADMIN_PORT" } catch {} }

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host " Presiona CTRL+C para detener" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

try {
    while ($true) {
        $script:frontJob | Receive-Job -ErrorAction SilentlyContinue | Out-Null
        $script:adminJob | Receive-Job -ErrorAction SilentlyContinue | Out-Null
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`nDeteniendo..." -ForegroundColor Yellow
    foreach ($jb in @($script:frontJob, $script:adminJob)) {
        if ($jb) { Stop-Job $jb -ErrorAction SilentlyContinue; Remove-Job $jb -ErrorAction SilentlyContinue }
    }
    foreach ($p in @(3000, 8000)) {
        Get-Process -Name "node","python","php" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -match ":$p" } |
            Stop-Process -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Listo." -ForegroundColor Green
}
