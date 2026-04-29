#!/bin/bash
# build-and-save.sh - Build and save Docker images on server

set -e

echo "Building Docker images..."

# Build API
echo "[1/2] Building API..."
docker build -t charcrith-api:latest ./api

# Build Web
echo "[2/2] Building Web..."
docker build -t charcrith-web:latest ./web

# Save to tar
echo "Saving to tar files..."
docker save -o charcrith-api.tar charcrith-api:latest
docker save -o charcrith-web.tar charcrith-web.tar

echo "Done! Files:"
ls -lh charcrith-*.tar
