#!/bin/bash
# deploy-bot.sh - Deploy makham-assistant bot to server

set -e

IMAGE_NAME="makham-assistant:latest"
IMAGE_FILE="/Makham-Assistant/makham-assistant.tar"
CONTAINER_NAME="makham-assistant"
ENV_FILE="/Makham-Assistant/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   Makham-assistant Bot Deploy Script   ${NC}"
echo -e "${YELLOW}========================================${NC}"
echo.

# Check if image file exists
if [ ! -f "$IMAGE_FILE" ]; then
    echo -e "${RED}Error: $IMAGE_FILE not found!${NC}"
    echo "Please upload makham-assistant.tar to /Makham-Assistant/ first"
    exit 1
fi

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found!${NC}"
    echo "Please create $ENV_FILE with your credentials"
    exit 1
fi

# Stop and remove existing container
echo -e "${YELLOW}[1/4] Stopping existing container...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Load Docker image
echo -e "${YELLOW}[2/4] Loading Docker image...${NC}"
docker load -i $IMAGE_FILE

# Run container with env file
echo -e "${YELLOW}[3/4] Starting container...${NC}"
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  --env-file $ENV_FILE \
  -v /var/run/docker.sock:/var/run/docker.sock \
  $IMAGE_NAME

# Show status
echo -e "${YELLOW}[4/4] Checking status...${NC}"
echo.
sleep 2
docker ps | grep $CONTAINER_NAME || true

echo.
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Deploy Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo.
echo -e "View logs: ${YELLOW}docker logs -f $CONTAINER_NAME${NC}"
echo -e "Stop bot:  ${YELLOW}docker stop $CONTAINER_NAME${NC}"
echo.
