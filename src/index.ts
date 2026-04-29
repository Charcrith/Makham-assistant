import 'dotenv/config';
import { TelegramBot } from './telegram';
import { MiniMaxAI } from './minimax';
import { CommandExecutor } from './executor';
import type { TelegramUpdate } from './types';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY!;
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';
const ALLOWED_USER_IDS = (process.env.ALLOWED_USER_IDS || '').split(',').filter(Boolean);
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize services
const telegram = new TelegramBot(TELEGRAM_TOKEN);
const ai = new MiniMaxAI(MINIMAX_API_KEY, MINIMAX_BASE_URL);
const executor = new CommandExecutor();

const COMMAND_DESCRIPTIONS = `
**Available Commands:**

🔄 *deploy* - โหลด images และ deploy ทั้งหมด
📊 *status* - ดูสถานะ services
📜 *logs* - ดู logs ของ services
🛑 *stop* - หยุด services
▶️ *start* - รัน services
🔁 *restart* - restart services

💡 พิมพ์คำสั่งเป็นภาษาก็ได้ เช่น "deploy หน่อย" หรือ "ดู status"
`;

async function handleUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const userId = String(message.from?.id);
  const text = message.text.trim();
  const username = message.from?.username || message.from?.first_name || 'User';

  // Check if user is allowed
  if (ALLOWED_USER_IDS.length > 0 && !ALLOWED_USER_IDS.includes(userId)) {
    await telegram.sendMarkdown(chatId, `❌ คุณไม่มีสิทธิ์ใช้งาน bot นี้`);
    return;
  }

  console.log(`[${username}] ${text}`);

  // Handle confirmation
  const pendingCommand = executor.getPendingCommand(userId);
  if (pendingCommand) {
    if (text.toLowerCase() === 'yes' || text.toLowerCase() === 'y' || text === 'ยืนยัน') {
      executor.clearPendingCommand(userId);
      await telegram.sendMarkdown(chatId, `⏳ กำลังรันคำสั่ง...`);

      try {
        if (pendingCommand === 'deploy') {
          const result = await executor.deploy();
          await telegram.sendMarkdown(chatId, executor.formatResult(result));
        } else if (pendingCommand === 'stop') {
          const result = await executor.stop();
          await telegram.sendMarkdown(chatId, executor.formatResult(result));
        } else if (pendingCommand === 'restart') {
          const result = await executor.restart();
          await telegram.sendMarkdown(chatId, executor.formatResult(result));
        } else {
          await telegram.sendMarkdown(chatId, `❌ Unknown pending command`);
        }
      } catch (error) {
        await telegram.sendMarkdown(chatId, `❌ Error: ${error}`);
      }
      return;
    } else if (text.toLowerCase() === 'no' || text.toLowerCase() === 'n' || text === 'ยกเลิก') {
      executor.clearPendingCommand(userId);
      await telegram.sendMarkdown(chatId, `❌ ยกเลิกคำสั่งแล้ว`);
      return;
    }
  }

  // Check for exact commands first
  const command = text.toLowerCase();

  if (command === '/start' || command === '/help') {
    await telegram.sendMarkdown(chatId, `
🤖 **AI Secretary Bot**

สวัสดี ${username}! ฉันคือ AI assistant สำหรับจัดการ VPS

${COMMAND_DESCRIPTIONS}
    `);
    return;
  }

  if (command === 'status') {
    const result = await executor.status();
    await telegram.sendMarkdown(chatId, executor.formatResult(result));
    return;
  }

  if (command === 'logs') {
    const result = await executor.logs();
    await telegram.sendMarkdown(chatId, executor.formatResult(result));
    return;
  }

  if (command === 'stop') {
    executor.storePendingCommand(userId, 'stop');
    await telegram.sendMarkdown(chatId, `⚠️ ยืนยันการ stop services?\n\nพิมพ์ *yes* เพื่อยืนยัน หรือ *no* เพื่อยกเลิก`);
    return;
  }

  if (command === 'start') {
    executor.storePendingCommand(userId, 'start');
    await telegram.sendMarkdown(chatId, `⚠️ ยืนยันการ start services?\n\nพิมพ์ *yes* เพื่อยืนยัน หรือ *no* เพื่อยกเลิก`);
    return;
  }

  if (command === 'restart') {
    executor.storePendingCommand(userId, 'restart');
    await telegram.sendMarkdown(chatId, `⚠️ ยืนยันการ restart services?\n\nพิมพ์ *yes* เพื่อยืนยัน หรือ *no* เพื่อยกเลิก`);
    return;
  }

  if (command === 'deploy') {
    executor.storePendingCommand(userId, 'deploy');
    await telegram.sendMarkdown(chatId, `⚠️ ยืนยันการ deploy?\n\nจะรัน:\n1. docker load -i charcrith-api.tar\n2. docker load -i charcrith-web.tar\n3. docker compose down\n4. docker compose up -d\n\nพิมพ์ *yes* เพื่อยืนยัน หรือ *no* เพื่อยกเลิก`);
    return;
  }

  // Use AI to interpret natural language
  try {
    await telegram.sendMarkdown(chatId, `🤔 กำลังประมวลผล...`);

    const interpretation = await ai.interpretCommand(text);

    console.log(`[AI] Intent: ${interpretation.intent}, Reasoning: ${interpretation.reasoning}`);

    if (interpretation.intent === 'help' || interpretation.intent === 'unknown') {
      await telegram.sendMarkdown(chatId, `
🤖 **AI Secretary Bot**

${COMMAND_DESCRIPTIONS}
      `);
      return;
    }

    if (interpretation.needsConfirmation) {
      executor.storePendingCommand(userId, interpretation.intent);
      await telegram.sendMarkdown(chatId, `⚠️ ยืนยันการ ${interpretation.intent}?\n\n${interpretation.reasoning}\n\nพิมพ์ *yes* เพื่อยืนยัน หรือ *no* เพื่อยกเลิก`);
      return;
    }

    // Execute directly
    let result;
    switch (interpretation.intent) {
      case 'deploy':
        result = await executor.deploy();
        break;
      case 'status':
        result = await executor.status();
        break;
      case 'logs':
        result = await executor.logs(interpretation.args[0]);
        break;
      case 'stop':
        result = await executor.stop();
        break;
      case 'start':
        result = await executor.start();
        break;
      case 'restart':
        result = await executor.restart();
        break;
      default:
        await telegram.sendMarkdown(chatId, `❌ ไม่เข้าใจคำสั่ง: ${text}\n\n${COMMAND_DESCRIPTIONS}`);
        return;
    }

    await telegram.sendMarkdown(chatId, executor.formatResult(result));
  } catch (error) {
    console.error('[AI Error]', error);
    await telegram.sendMarkdown(chatId, `❌ เกิดข้อผิดพลาดในการประมวลผล AI: ${error}`);
  }
}

async function main(): Promise<void> {
  console.log('🤖 Starting AI Secretary Bot...');

  // Verify bot token
  try {
    const me = await telegram.getMe();
    console.log(`✅ Bot verified: @${me.username}`);
  } catch (error) {
    console.error('❌ Failed to verify bot token:', error);
    process.exit(1);
  }

  console.log(`👤 Allowed users: ${ALLOWED_USER_IDS.length > 0 ? ALLOWED_USER_IDS.join(', ') : 'ALL'}`);
  console.log(`📁 Project path: ${process.env.PROJECT_PATH}`);
  console.log('🔄 Starting polling for updates...\n');

  // Main loop
  while (true) {
    try {
      const updates = await telegram.getUpdates();
      for (const update of updates) {
        await handleUpdate(update);
      }
    } catch (error) {
      console.error('[Polling Error]', error);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }
}

main().catch(console.error);
