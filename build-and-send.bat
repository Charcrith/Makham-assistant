@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Build & Deploy Makham-assistant Bot
echo ========================================
echo.

set VPS_IP=YOUR_VPS_IP_HERE
set VPS_USER=root
set IMAGE_FILE=makham-assistant.tar

:: Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not found!
    pause
    exit /b 1
)

:: Build
echo [1/4] Building Docker image...
docker build -t makham-assistant:latest .
if errorlevel 1 (
    echo FAILED: Build failed
    pause
    exit /b 1
)

:: Save
echo [2/4] Saving to tar...
docker save -o %IMAGE_FILE% makham-assistant:latest
if errorlevel 1 (
    echo FAILED: Save failed
    pause
    exit /b 1
)

:: Upload
echo [3/4] Uploading to server...
set /p VPS_IP="VPS IP: "

if not "%VPS_IP%"=="" (
    echo Uploading to %VPS_USER%@%VPS_IP%:/Makham-Assistant/
    scp %IMAGE_FILE% %VPS_USER%@%VPS_IP%:/Makham-Assistant/
    scp docker-compose.yml %VPS_USER%@%VPS_IP%:/Makham-Assistant/
    if errorlevel 1 (
        echo FAILED: Upload failed
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo Image file: %IMAGE_FILE%
echo.
if not "%VPS_IP%"=="" (
    echo Uploaded to server!
    echo.
    echo On server, run:
    echo   cd /Makham-Assistant
    echo   docker-compose up -d
) else (
    echo Next steps:
    echo   1. Upload to server:
    echo      scp %IMAGE_FILE% %VPS_USER%@YOUR_VPS_IP:/Makham-Assistant/
    echo      scp docker-compose.yml %VPS_USER%@YOUR_VPS_IP:/Makham-Assistant/
)
echo.
pause
