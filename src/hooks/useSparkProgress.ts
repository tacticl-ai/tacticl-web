import { create } from 'zustand';

export interface ProgressMessage {
  id: string;
  sparkId: string;
  tacticId?: string;
  message: string;
  percent?: number;
  timestamp: number;
  type: 'progress' | 'checkpoint' | 'status' | 'completed' | 'failed';
}

interface SparkProgressStore {
  messages: Map<string, ProgressMessage[]>;
  addProgress: (sparkId: string, msg: Omit<ProgressMessage, 'id' | 'timestamp'>) => void;
  getProgress: (sparkId: string) => ProgressMessage[];
  clearProgress: (sparkId: string) => void;
}

export const useSparkProgressStore = create<SparkProgressStore>((set, get) => ({
  messages: new Map(),
  addProgress: (sparkId, msg) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      const existing = newMessages.get(sparkId) || [];
      newMessages.set(sparkId, [
        ...existing,
        {
          ...msg,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        },
      ]);
      return { messages: newMessages };
    });
  },
  getProgress: (sparkId) => get().messages.get(sparkId) || [],
  clearProgress: (sparkId) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.delete(sparkId);
      return { messages: newMessages };
    });
  },
}));
