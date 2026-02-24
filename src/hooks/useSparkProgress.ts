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

/** Maximum number of progress messages retained per spark to prevent unbounded memory growth. */
const MAX_MESSAGES_PER_SPARK = 200;

interface SparkProgressStore {
  sparkProgress: Record<string, ProgressMessage[]>;
  addProgress: (sparkId: string, msg: Omit<ProgressMessage, 'id' | 'timestamp'>) => void;
  getProgress: (sparkId: string) => ProgressMessage[];
  clearProgress: (sparkId: string) => void;
}

export const useSparkProgressStore = create<SparkProgressStore>((set, get) => ({
  sparkProgress: {},
  addProgress: (sparkId, msg) => {
    set((state) => {
      const existing = state.sparkProgress[sparkId] || [];
      const updated = [
        ...existing,
        {
          ...msg,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        },
      ];
      // Trim to MAX_MESSAGES_PER_SPARK to prevent unbounded memory growth
      const trimmed =
        updated.length > MAX_MESSAGES_PER_SPARK
          ? updated.slice(updated.length - MAX_MESSAGES_PER_SPARK)
          : updated;
      return {
        sparkProgress: { ...state.sparkProgress, [sparkId]: trimmed },
      };
    });
  },
  getProgress: (sparkId) => get().sparkProgress[sparkId] || [],
  clearProgress: (sparkId) => {
    set((state) => {
      const { [sparkId]: _, ...rest } = state.sparkProgress;
      return { sparkProgress: rest };
    });
  },
}));
