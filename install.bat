@echo off
setlocal
cd /d "%~dp0"

title Antigravity-CN Installer

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/ and run this script again.
    pause
    exit /b 1
)

if not exist "%~dp0node_modules\@electron\asar" (
    echo [INFO] Installing required dependencies...
    call npm install --no-audit --no-fund
)

node "%~dp0bin\cli.js" install %*
pause
