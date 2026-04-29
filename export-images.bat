@echo off
echo ========================================
echo   Export Docker Images to Tar Files
echo ========================================
echo.

set BUILD_DATE=%date:~10,4%-%date:~4,2%-%date:~7,2%
set TIME2=%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%BUILD_DATE%_%TIME2%

echo Building Docker images...
echo.

:: Build API image
echo [1/4] Building API image...
docker build -t charcrith-api:latest ./api
if errorlevel 1 (
    echo FAILED: API build failed
    pause
    exit /b 1
)

:: Build Web image
echo [2/4] Building Web image...
docker build -t charcrith-web:latest ./web
if errorlevel 1 (
    echo FAILED: Web build failed
    pause
    exit /b 1
)

:: Save API image
echo [3/4] Saving API image to tar...
docker save -o charcrith-api.tar charcrith-api:latest
if errorlevel 1 (
    echo FAILED: API save failed
    pause
    exit /b 1
)

:: Save Web image
echo [4/4] Saving Web image to tar...
docker save -o charcrith-web.tar charcrith-web:latest
if errorlevel 1 (
    echo FAILED: Web save failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Export Complete!
echo ========================================
echo.
echo Files created:
dir charcrith-*.tar
echo.
echo Next steps:
echo   1. Upload to server:
echo      scp charcrith-api.tar user@vps:/Christ-web/
echo      scp charcrith-web.tar user@vps:/Christ-web/
echo.
echo   2. On server, run:
echo      docker load -i /Christ-web/charcrith-api.tar
echo      docker load -i /Christ-web/charcrith-web.tar
echo      docker compose -f /Christ-web/docker-compose-prod.yml up -d
echo.
pause
