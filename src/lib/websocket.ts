import { useAuthStore } from '../stores/auth-store';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';

export type SparkWebSocketMessage =
  | { type: 'spark_progress'; sparkId: string; tacticId?: string; status: string; progress?: number; message?: string }
  | { type: 'spark_status'; sparkId: string; status: string; message?: string }
  | { type: 'spark_completed'; sparkId: string; result: unknown }
  | { type: 'spark_failed'; sparkId: string; error: string }
  | { type: 'spark_checkpoint'; sparkId: string; checkpointId: string; message?: string }
  | { type: 'pong' };

export interface WebSocketClientOptions {
  onMessage: (msg: SparkWebSocketMessage) => void;
  onStatusChange: (status: WebSocketStatus) => void;
}

// Derive WebSocket URL from env or current page location.
// VITE_WS_URL takes precedence; otherwise derive from the API base or window.location.
const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ||
  import.meta.env.VITE_WS_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL?.replace(/^http/, 'ws') ||
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

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
    // Token in URL is a known limitation of the browser WebSocket API which
    // does not support custom headers on the initial handshake request.
    // Mitigations:
    //   - WSS is used in production (encrypted transport).
    //   - Tokens are short-lived and rotated.
    //   - Server-side log scrubbing removes token query parameters.
    // Alternative: Sending the token as a WebSocket subprotocol, but this
    // complicates server-side validation and is non-standard.
    const url = `${WS_BASE_URL}/ws/user${token ? `?token=${encodeURIComponent(token)}` : ''}`;

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
