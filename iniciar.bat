@echo off
title Zami AI Studio
cd /d "%~dp0"

echo.
echo  Zami AI Studio - Generador de Influencers
echo.

:: kill only the process listening on port 3333
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3333 .*LISTENING"') do (
  echo  Cerrando proceso en puerto 3333 ^(PID %%P^)...
  taskkill /F /PID %%P /T >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: check node is available
where node >nul 2>&1
if errorlevel 1 (
  echo  ERROR: Node.js no encontrado. Instala Node.js desde https://nodejs.org
  pause
  exit /b 1
)

:: start server in background, wait until it responds, then open browser
start "Zami Server" cmd /k "node server.cjs"
for /l %%I in (1,1,20) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3333' -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1" >nul 2>&1
  if not errorlevel 1 (
    start "" "http://127.0.0.1:3333"
    exit /b 0
  )
  timeout /t 1 /nobreak >nul
)

echo  ERROR: El servidor no respondio en http://127.0.0.1:3333
echo  Revisa la ventana "Zami Server" para ver el error.
pause
exit /b 1
