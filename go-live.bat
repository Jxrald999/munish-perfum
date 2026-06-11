@echo off
title Munish Perfum - Go Live!
cd /d "%~dp0"
mode con cols=65 lines=24
color 0F
cls

echo =======================================
echo    MUNISH PERFUM - GO LIVE!
echo =======================================
echo.

:: Kill leftover processes
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1

:: ----- FRONTEND (port 3000) -----
set FRONT_CMD=
where node >nul 2>nul
if %errorlevel% equ 0 set FRONT_CMD=node "%~dp0admin-server\serve-frontend.js"

if "%FRONT_CMD%"=="" (
    where python >nul 2>nul
    if %errorlevel% equ 0 set FRONT_CMD=python -m http.server 3000
)

if "%FRONT_CMD%"=="" (
    where npx >nul 2>nul
    if %errorlevel% equ 0 set FRONT_CMD=npx -y http-server -p 3000 -c-1 --silent
)

if not "%FRONT_CMD%"=="" (
    start "" "http://localhost:3000"
    start /B cmd /c "%FRONT_CMD%" > NUL 2>&1
    timeout /t 2 /nobreak > NUL
    echo  [1/2] Tienda  ----  http://localhost:3000
) else (
    echo  [1/2] ERROR: Necesitas Node.js o Python
    echo         Descarga: https://nodejs.org
)

:: ----- ADMIN (port 8000) -----
if exist "admin-server\server.js" (
    where node >nul 2>nul
    if %errorlevel% equ 0 (
        start "" "http://localhost:8000"
        pushd admin-server
        start /B cmd /c "node server.js" > NUL 2>&1
        popd
        timeout /t 3 /nobreak > NUL
        echo  [2/2] Admin  ----  http://localhost:8000
        echo         Usuario: admin / 00207DylanRamirezLopez
    ) else (
        echo  [2/2] WARN: Node.js no instalado
    )
) else (
    echo  [2/2] WARN: No se encuentra admin-server
)

echo.
echo =======================================
echo  Presiona cualquier tecla para detener
echo =======================================
pause > NUL

:: Cleanup
echo.
echo Deteniendo servidores...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Listo.
timeout /t 1 /nobreak > NUL
