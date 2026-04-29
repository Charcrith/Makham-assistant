import OpenAI from 'openai';
import type { AIMessage } from './types';

export class MiniMaxAI {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, baseURL: string = 'https://api.minimax.chat/v1') {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
    this.model = 'MiniMax-Text-01'; // or whatever model MiniMax uses
  }

  async chat(messages: AIMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || 'ไม่ได้รับคำตอบจาก AI';
  }

  async interpretCommand(userMessage: string): Promise<{
    intent: string;
    command: string | null;
    args: string[];
    needsConfirmation: boolean;
    reasoning: string;
  }> {
    const systemPrompt = `คุณคือ AI assistant ที่ช่วยจัดการ VPS server สำหรับ portfolio project

คุณต้องตอบเป็น JSON format ที่มี fields:
- intent: (deploy|status|logs|stop|start|restart|help|unknown)
- command: command ที่จะรัน หรือ null
- args: arguments สำหรับ command
- needsConfirmation: true/false
- reasoning: คำอธิบายว่าทำไมเลือก intent นี้

Available commands:
1. docker load -i {path}/charcrith-api.tar && docker load -i {path}/charcrith-web.tar && docker compose -f {path}/docker-compose-prod.yml up -d
   - deploy: โหลด images และ deploy ทั้งหมด

2. docker compose -f {path}/docker-compose-prod.yml logs -f
   - logs: ดู logs ของ services

3. docker compose -f {path}/docker-compose-prod.yml ps
   - status: ดูสถานะ services

4. docker compose -f {path}/docker-compose-prod.yml down
   - stop: หยุด services

5. docker compose -f {path}/docker-compose-prod.yml up -d
   - start: รัน services

6. docker compose -f {path}/docker-compose-prod.yml restart
   - restart: restart services

หาก user พูดถึงการ build, deploy, upload, refresh, หรือ active ควรเป็น intent "deploy"
หาก user พูดถึง logs, log, output, ควรเป็น intent "logs"

ตอบเป็น JSON เท่านั้น อย่ามีอธิบายเพิ่มเติม`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]);

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      // If parsing fails, try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Fall through to default
        }
      }
      return {
        intent: 'unknown',
        command: null,
        args: [],
        needsConfirmation: false,
        reasoning: 'ไม่สามารถตีความคำสั่งได้',
      };
    }
  }
}
