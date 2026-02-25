import { api } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { AuditLogEntry, ActivityResponse, TranscribeResponse, AgentCommandRequest, AgentCommandResponse, AgentAsk } from './types';

export const agentApi = {
  command: (data: AgentCommandRequest) =>
    api.post<AgentCommandResponse>('/api/agent/command', data),

  getHistory: () =>
    api.get<AuditLogEntry[]>('/api/agent/history'),

  getActivity: () =>
    api.get<ActivityResponse>('/api/agent/activity'),

  getModels: () =>
    api.get<string[]>('/api/agent/models'),

  confirmAction: (confirmationId: string, approved: boolean) =>
    api.post<string>(`/api/agent/confirm/${confirmationId}`, { approved }),

  getAsk: (askId: string) =>
    api.get<Record<string, unknown>>(`/api/agent/asks/${askId}`),

  cancelAsk: (askId: string) =>
    api.post<void>(`/api/agent/asks/${askId}/cancel`),

  getPendingAsks: () =>
    api.get<AgentAsk[]>('/api/agent/asks/pending'),

  transcribe: async (file: File): Promise<TranscribeResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = useAuthStore.getState().token;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://tacticl-core-254aoetxaa-ue.a.run.app';
    const res = await fetch(`${baseUrl}/api/agent/transcribe`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Transcription failed');
    return res.json();
  },
};
