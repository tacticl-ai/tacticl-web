import { api } from './client';
import { getAccessToken } from '../stores/auth-store';
import type { AuditLogEntry, ActivityResponse, TranscribeResponse, AgentCommandRequest, AgentCommandResponse, AgentAsk } from './types';

export const agentApi = {
  command: (data: AgentCommandRequest) =>
    api.post<AgentCommandResponse>('/v1/agent/command', data),

  getHistory: () =>
    api.get<AuditLogEntry[]>('/v1/agent/history'),

  getActivity: () =>
    api.get<ActivityResponse>('/v1/agent/activity'),

  getModels: () =>
    api.get<string[]>('/v1/agent/models'),

  confirmAction: (confirmationId: string, approved: boolean) =>
    api.post<string>(`/v1/agent/confirm/${confirmationId}`, { approved }),

  getAsk: (askId: string) =>
    api.get<Record<string, unknown>>(`/v1/agent/asks/${askId}`),

  cancelAsk: (askId: string) =>
    api.post<void>(`/v1/agent/asks/${askId}/cancel`),

  getPendingAsks: () =>
    api.get<AgentAsk[]>('/v1/agent/asks/pending'),

  transcribe: async (file: File): Promise<TranscribeResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.tacticl.ai';
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}/v1/agent/transcribe`, {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Transcription failed');
    return res.json();
  },
};
