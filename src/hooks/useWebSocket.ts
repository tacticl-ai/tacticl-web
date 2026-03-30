import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  WebSocketClient,
  type WebSocketStatus,
  type SparkWebSocketMessage,
} from '../lib/websocket';
import { useAuthStore } from '../stores/auth-store';
import { useSparkProgressStore } from './useSparkProgress';

export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const clientRef = useRef<WebSocketClient | null>(null);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleMessage = useCallback(
    (msg: SparkWebSocketMessage) => {
      const { addProgress, clearProgress } = useSparkProgressStore.getState();

      switch (msg.type) {
        case 'spark_progress':
          addProgress(msg.sparkId, {
            sparkId: msg.sparkId,
            tacticId: msg.tacticId,
            message: msg.message || msg.status,
            percent: msg.progress,
            type: 'progress',
          });
          queryClient.invalidateQueries({ queryKey: ['sparks'] });
          queryClient.invalidateQueries({
            queryKey: ['sparks', msg.sparkId],
          });
          break;
        case 'spark_status':
          addProgress(msg.sparkId, {
            sparkId: msg.sparkId,
            message: msg.message || msg.status,
            type: 'status',
          });
          queryClient.invalidateQueries({ queryKey: ['sparks'] });
          queryClient.invalidateQueries({
            queryKey: ['sparks', msg.sparkId],
          });
          break;
        case 'spark_checkpoint':
          addProgress(msg.sparkId, {
            sparkId: msg.sparkId,
            message: msg.message || 'Checkpoint requires approval',
            type: 'checkpoint',
          });
          queryClient.invalidateQueries({ queryKey: ['checkpoints'] });
          queryClient.invalidateQueries({
            queryKey: ['sparks', msg.sparkId],
          });
          break;
        case 'spark_completed':
          addProgress(msg.sparkId, {
            sparkId: msg.sparkId,
            message: 'Spark completed',
            type: 'completed',
            result: msg.result,
          });
          queryClient.invalidateQueries({ queryKey: ['sparks'] });
          queryClient.invalidateQueries({
            queryKey: ['sparks', msg.sparkId],
          });
          // Clear progress after a short delay so the completed message is visible
          setTimeout(() => clearProgress(msg.sparkId), 5000);
          break;
        case 'spark_failed':
          addProgress(msg.sparkId, {
            sparkId: msg.sparkId,
            message: msg.error || 'Spark failed',
            type: 'failed',
            result: { error: msg.error },
          });
          queryClient.invalidateQueries({ queryKey: ['sparks'] });
          queryClient.invalidateQueries({
            queryKey: ['sparks', msg.sparkId],
          });
          // Clear progress after a short delay so the failed message is visible
          setTimeout(() => clearProgress(msg.sparkId), 5000);
          break;
        case 'pipeline_event': {
          const { sparkId, eventType, role } = msg;
          addProgress(sparkId, {
            sparkId,
            message: `[${role ?? 'pipeline'}] ${eventType}`,
            type: 'progress',
          });
          const terminalEvents = ['PIPELINE_COMPLETED', 'PIPELINE_FAILED', 'PIPELINE_CANCELLED'];
          if (terminalEvents.includes(eventType)) {
            queryClient.invalidateQueries({ queryKey: ['pipeline-run', sparkId] });
            queryClient.invalidateQueries({ queryKey: ['pipeline-events', sparkId] });
            queryClient.invalidateQueries({ queryKey: ['sparks'] });
          }
          break;
        }
        case 'pong':
          break;
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!isAuthenticated) {
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
  }, [isAuthenticated, handleMessage]);

  return { status };
}
