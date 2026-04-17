import { api } from './client';
import type { ConversationResponse, MessageResponse } from './types';

export const conversationsApi = {
  create: (message: string) =>
    api.post<ConversationResponse>('/v1/conversations', { message }),

  sendMessage: (sessionId: string, message: string) =>
    api.post<MessageResponse>(`/v1/conversations/${sessionId}/messages`, { message }),

  list: () =>
    api.get<ConversationResponse[]>('/v1/conversations'),

  get: (sessionId: string) =>
    api.get<ConversationResponse>(`/v1/conversations/${sessionId}`),
};
