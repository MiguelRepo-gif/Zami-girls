@echo off
title Zami AI Studio
cd /d "%~dp0"

echo.
echo  Zami AI Studio — Generador de Influencers
echo.

:: kill any existing node process on port 3333
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

:: check node is available
where node >nul 2>&1
if errorlevel 1 (
  echo  ERROR: Node.js no encontrado. Instala Node.js desde https://nodejs.org
  pause
  exit /b 1
)

:: start server in background, give it 2 seconds to boot, then open browser
start "Zami Server" cmd /k "node server.cjs"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:3333"
