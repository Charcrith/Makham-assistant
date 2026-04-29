# Makham Assistant

AI Secretary Bot สำหรับจัดการ VPS ผ่าน Telegram

## Features

- 🤖 AI-powered command interpretation (ภาษาไทย/อังกฤษ)
- 🔄 Deploy with confirmation
- 📊 Status monitoring
- 📜 Logs viewer
- 🔁 Restart/Stop/Start services

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp .env.example .env
```

แก้ไข `.env`:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
MINIMAX_API_KEY=your_minimax_api_key
MINIMAX_BASE_URL=https://api.minimax.chat/v1
ALLOWED_USER_IDS=your_telegram_user_id
PROJECT_PATH=/Christ-web
DOCKER_COMPOSE_FILE=docker-compose-prod.yml
```

### 3. Run

```bash
# Development
bun run dev

# Production (with PM2)
bun run pm2:start
```

## Commands

| Command | Description |
|---------|-------------|
| `deploy` | โหลด images และ deploy |
| `status` | ดูสถานะ services |
| `logs` | ดู logs |
| `stop` | หยุด services |
| `start` | รัน services |
| `restart` | restart services |

## Production Deployment

### บน Server

```bash
# Clone repo
cd ~
git clone https://github.com/Charcrith/Makham-assistant.git
cd Makham-assistant

# Install dependencies
bun install

# Setup PM2
bun add pm2 -g

# Configure
cp .env.example .env
nano .env  # ใส่ credentials

# Start
bun run pm2:start
```

### Auto-start on reboot

```bash
pm2 startup
pm2 save
```

## Troubleshooting

### Bot ไม่ตอบ

1. เช็คว่า `.env` ถูกต้อง
2. เช็คว่า `ALLOWED_USER_IDS` ตรงกับ Telegram user ID
3. ดู logs: `bun run pm2:logs`

### Deploy ไม่ได้

1. เช็ค path ของ tar files: `ls -la /Christ-web/`
2. เช็ค docker-compose file: `cat /Christ-web/docker-compose-prod.yml`
