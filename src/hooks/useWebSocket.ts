import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  WebSocketClient,
  type WebSocketStatus,
  type SparkWebSocketMessage,
} from '../lib/websocket';
import { useAuthStore } from '../stores/auth-store';

export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const clientRef = useRef<WebSocketClient | null>(null);
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const handleMessage = useCallback(
    (msg: SparkWebSocketMessage) => {
      switch (msg.type) {
        case 'spark_progress':
        case 'spark_completed':
        case 'spark_failed':
          queryClient.invalidateQueries({ queryKey: ['sparks'] });
          queryClient.invalidateQueries({
            queryKey: ['sparks', msg.sparkId],
          });
          break;
        case 'spark_checkpoint':
          queryClient.invalidateQueries({ queryKey: ['checkpoints'] });
          queryClient.invalidateQueries({
            queryKey: ['sparks', msg.sparkId],
          });
          break;
        case 'pong':
          break;
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!token) {
      setStatus('disconnected');
      return;
    }

    const client = new WebSocketClient({
      onMessage: handleMessage,
      onStatusChange: setStatus,
    });
    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [token, handleMessage]);

  return { status };
}
