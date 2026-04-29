import type { TelegramUpdate, TelegramSendMessageParams } from './types';

const TELEGRAM_API = 'https://api.telegram.org';

export class TelegramBot {
  private token: string;
  private offset: number = 0;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(method: string, body?: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${TELEGRAM_API}/bot${this.token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async getUpdates(): Promise<TelegramUpdate[]> {
    const result = await this.request<{ ok: boolean; result: TelegramUpdate[] }>('getUpdates', {
      offset: this.offset,
      timeout: 30,
    });

    if (result.result.length > 0) {
      this.offset = result.result[result.result.length - 1].update_id + 1;
    }

    return result.result;
  }

  async sendMessage(params: TelegramSendMessageParams): Promise<void> {
    await this.request('sendMessage', params);
  }

  async sendMarkdown(chatId: number, text: string): Promise<void> {
    await this.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    });
  }

  async sendHTML(chatId: number, text: string): Promise<void> {
    await this.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    await this.request('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
    });
  }

  getMe(): Promise<{ id: number; is_bot: boolean; first_name: string; username: string }> {
    return this.request('getMe');
  }
}
