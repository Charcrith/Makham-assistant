@echo off
echo ========================================
echo   Build & Export Makham-assistant
echo ========================================
echo.

:: Build Docker image
echo Building Docker image...
docker build -t makham-assistant:latest .

:: Save to tar
echo Saving to tar...
docker save -o makham-assistant.tar makham-assistant:latest

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Files created:
dir makham-assistant.tar
echo.
echo Next steps:
echo   1. Upload to server:
echo      scp makham-assistant.tar root@YOUR_VPS_IP:/Christ-web/
echo.
echo   2. On server:
echo      cd /Christ-web
echo      docker load -i makham-assistant.tar
echo      docker compose -f makham-assistant/docker-compose.yml up -d
echo.
pause
