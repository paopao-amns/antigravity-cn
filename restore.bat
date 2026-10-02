@echo off
setlocal
cd /d "%~dp0"

title Antigravity-CN Restorer

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

node "%~dp0bin\cli.js" restore %*
pause
