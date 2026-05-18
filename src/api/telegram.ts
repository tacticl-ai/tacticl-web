import { api } from './client';

export interface TelegramLinkToken {
  token: string;
  botUrl: string;
}

export interface LinkedChat {
  chatId: number;
  username: string | null;
  linkedAt: string | null;
}

export interface TelegramStatus {
  linked: LinkedChat[];
}

export const telegramApi = {
  /** Mint a one-time link token. Valid 15 minutes. DM the bot with /start <token> to redeem. */
  issueLink: () => api.post<TelegramLinkToken>('/v1/telegram/link'),

  /** Currently linked Telegram chats for the signed-in user. */
  status: () => api.get<TelegramStatus>('/v1/telegram/status'),

  /** Revoke the link for a specific chatId. */
  unlink: (chatId: number) => api.delete<void>(`/v1/telegram/link/${chatId}`),
};
