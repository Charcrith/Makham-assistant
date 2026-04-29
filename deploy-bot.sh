#!/bin/bash
# deploy-bot.sh - Deploy makham-assistant bot to server

set -e

IMAGE_NAME="makham-assistant:latest"
IMAGE_FILE="/Christ-web/makham-assistant.tar"
CONTAINER_NAME="makham-assistant"

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
    echo "Please upload makham-assistant.tar to /Christ-web/ first"
    exit 1
fi

# Stop and remove existing container
echo -e "${YELLOW}[1/4] Stopping existing container...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Load Docker image
echo -e "${YELLOW}[2/4] Loading Docker image...${NC}"
docker load -i $IMAGE_FILE

# Run container
echo -e "${YELLOW}[3/4] Starting container...${NC}"
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e TELEGRAM_BOT_TOKEN=8619384368:AAEUv1Z8vktGn_DBJwZ6_M14I6X6IF_Qn-w \
  -e MINIMAX_API_KEY=sk-cp-0isz8kH3b1mlGIw4qX6gn1Bl4_vhlafHfLGaos2r6ElA9TfYZbJV_WBd7eCeB-iRvn6FRwScoitoHTO9CX-8t4GQp0HnvpZl534kjTWkvjioLVYD_puBk0A \
  -e MINIMAX_BASE_URL=https://api.minimax.chat/v1 \
  -e ALLOWED_USER_IDS=7506269784 \
  -e PROJECT_PATH=/Christ-web \
  -e DOCKER_COMPOSE_FILE=docker-compose-prod.yml \
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
