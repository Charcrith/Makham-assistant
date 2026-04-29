@echo off
echo Saving Docker images to tar files...
docker save -o charcrith-api.tar charcrith-api:latest
docker save -o charcrith-web.tar charcrith-web:latest
echo Done!
dir charcrith-*.tar
pause
