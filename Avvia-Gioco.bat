@echo off
title Scopa & Briscola Suite
cd /d "%~dp0"

if exist "Scopa-Suite.exe" (
    echo Avvio applicazione desktop Scopa Suite...
    start "" "Scopa-Suite.exe"
    exit
)

echo Avvio server locale Scopa & Briscola...
start /b cmd /c "npm run preview" >nul 2>&1
timeout /t 2 /nobreak >nul

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:8135"
) else (
    start "" "http://localhost:8135"
)
exit
