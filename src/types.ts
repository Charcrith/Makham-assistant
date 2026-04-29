export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: TelegramEntity[];
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramSendMessageParams {
  chat_id: number | string;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: TelegramReplyMarkup;
}

export interface TelegramReplyMarkup {
  inline_keyboard?: TelegramInlineKeyboardButton[][];
}

export interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  command?: string;
}

export interface WhitelistedCommand {
  name: string;
  description: string;
  command: string;
  args: string[];
  requiresConfirmation: boolean;
}
