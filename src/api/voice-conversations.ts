import { api } from './client';

/** A row in the voice conversation picker. */
export interface VoiceConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

/** One rendered transcript turn returned for an opened conversation. */
export interface VoiceConversationTurn {
  role: 'user' | 'assistant';
  text: string;
  personaId?: string | null;
  timestamp: string;
}

/** Full transcript of one conversation. */
export interface VoiceConversationDetail {
  id: string;
  title: string;
  turns: VoiceConversationTurn[];
}

/**
 * Read API for durable voice conversations (server: tacticl-core
 * {@code /v1/voice/conversations}). Writes happen on the voice WebSocket turn
 * loop, not here — this is list + open only, for the conversation picker.
 */
export const voiceConversationsApi = {
  list: () => api.get<VoiceConversationSummary[]>('/v1/voice/conversations'),
  get: (conversationId: string) =>
    api.get<VoiceConversationDetail>(`/v1/voice/conversations/${conversationId}`),
};
