import { useAuthStore } from '../stores/auth-store';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';

export type SparkWebSocketMessage =
  | { type: 'spark_progress'; sparkId: string; status: string; progress?: number }
  | { type: 'spark_completed'; sparkId: string; result: unknown }
  | { type: 'spark_failed'; sparkId: string; error: string }
  | { type: 'spark_checkpoint'; sparkId: string; checkpointId: string }
  | { type: 'pong' };

export interface WebSocketClientOptions {
  onMessage: (msg: SparkWebSocketMessage) => void;
  onStatusChange: (status: WebSocketStatus) => void;
}

const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL?.replace(/^http/, 'ws') ||
  'wss://tacticl-core-1085580127767.us-east1.run.app';

const HEARTBEAT_INTERVAL = 30_000;
const MAX_RECONNECT_DELAY = 30_000;
const BASE_RECONNECT_DELAY = 1_000;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private disposed = false;
  private options: WebSocketClientOptions;

  constructor(options: WebSocketClientOptions) {
    this.options = options;
  }

  connect(): void {
    if (this.disposed) return;
    this.cleanup();

    const token = useAuthStore.getState().token;
    const url = `${WS_BASE_URL}/ws/device${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    this.options.onStatusChange('connecting');

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.options.onStatusChange('connected');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as SparkWebSocketMessage;
        this.options.onMessage(msg);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.options.onStatusChange('disconnected');
      this.stopHeartbeat();
      if (!this.disposed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, reconnect handled there
    };
  }

  disconnect(): void {
    this.disposed = true;
    this.cleanup();
    this.options.onStatusChange('disconnected');
  }

  private cleanup(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY,
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}
