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
echo [1/3] Building Docker image...
docker build -t makham-assistant:latest .
if errorlevel 1 (
    echo FAILED: Build failed
    pause
    exit /b 1
)

:: Save
echo [2/3] Saving to tar...
docker save -o %IMAGE_FILE% makham-assistant:latest
if errorlevel 1 (
    echo FAILED: Save failed
    pause
    exit /b 1
)

:: Upload
echo [3/3] Uploading to server...
echo VPS IP คืออะไรครับ? (กด Enter ถ้าไม่ต้อง upload)
set /p VPS_IP="VPS IP: "

if not "%VPS_IP%"=="" (
    scp %IMAGE_FILE% %VPS_USER%@%VPS_IP%:/Christ-web/
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
echo Size:
for %%A in (%IMAGE_FILE%) do echo   %%~zA bytes
echo.
if not "%VPS_IP%"=="" (
    echo Already uploaded to server!
    echo.
    echo On server, run:
    echo   cd /Christ-web
    echo   ./deploy-bot.sh
) else (
    echo Next steps:
    echo   1. Upload to server:
    echo      scp %IMAGE_FILE% %VPS_USER%@YOUR_VPS_IP:/Christ-web/
    echo.
    echo   2. Upload deploy-bot.sh:
    echo      scp deploy-bot.sh %VPS_USER%@YOUR_VPS_IP:/Christ-web/
    echo.
    echo   3. On server, run:
    echo      cd /Christ-web
    echo      chmod +x deploy-bot.sh
    echo      ./deploy-bot.sh
)
echo.
pause
