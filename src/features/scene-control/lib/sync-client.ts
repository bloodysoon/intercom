import {
  parseServerMessage,
  type ClientMessage,
  type ClientRole,
  type ConnectionStatus,
  type ServerMessage,
} from "./protocol";

export interface SyncClientOptions {
  url: string;
  role: ClientRole;
  onMessage: (message: ServerMessage) => void;
  onStatus: (status: ConnectionStatus) => void;
  /** Injected for tests. */
  WebSocketImpl?: typeof WebSocket;
}

const HEARTBEAT_MS = 4_000;
/** No traffic for this long ⇒ assume a half-open socket (tablet Wi-Fi sleep) and reconnect. */
const STALE_MS = 11_000;
const BACKOFF_MS = [300, 800, 1_500, 3_000, 5_000];

/**
 * Self-healing WebSocket client: exponential back-off reconnects, an
 * application-level heartbeat to detect dead connections, and immediate
 * reconnect when the page becomes visible or the network comes back.
 */
export class SyncClient {
  private socket: WebSocket | null = null;
  private attempt = 0;
  private lastSeen = 0;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private readonly opts: SyncClientOptions;
  private readonly WS: typeof WebSocket;

  constructor(opts: SyncClientOptions) {
    this.opts = opts;
    this.WS = opts.WebSocketImpl ?? WebSocket;
  }

  start(): void {
    this.stopped = false;
    this.connect();
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.reconnectNow);
      document.addEventListener("visibilitychange", this.onVisibility);
    }
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.reconnectNow);
      document.removeEventListener("visibilitychange", this.onVisibility);
    }
    const s = this.socket;
    this.socket = null;
    if (s) {
      s.onclose = null;
      s.close();
    }
    this.opts.onStatus("offline");
  }

  send(message: ClientMessage): boolean {
    const s = this.socket;
    if (!s || s.readyState !== this.WS.OPEN) return false;
    try {
      s.send(JSON.stringify(message));
      return true;
    } catch {
      return false;
    }
  }

  get isOpen(): boolean {
    return this.socket?.readyState === this.WS.OPEN;
  }

  private connect(): void {
    if (this.stopped) return;
    this.opts.onStatus(this.attempt === 0 ? "connecting" : "reconnecting");

    let socket: WebSocket;
    try {
      socket = new this.WS(this.opts.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.lastSeen = Date.now();
      this.send({ type: "hello", role: this.opts.role });
      this.opts.onStatus("open");
      this.startHeartbeat();
    };
    socket.onmessage = (event: MessageEvent) => {
      this.lastSeen = Date.now();
      const msg = parseServerMessage(event.data);
      if (msg && msg.type !== "pong") this.opts.onMessage(msg);
    };
    socket.onerror = () => {
      // onclose follows; handled there.
    };
    socket.onclose = () => {
      if (this.socket === socket) this.socket = null;
      this.clearTimers();
      this.scheduleReconnect();
    };
  }

  private startHeartbeat(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = setInterval(() => {
      if (Date.now() - this.lastSeen > STALE_MS) {
        this.socket?.close();
        return;
      }
      this.send({ type: "ping", t: Date.now() });
    }, HEARTBEAT_MS);
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.opts.onStatus("reconnecting");
    const delay = BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)];
    this.attempt += 1;
    if (this.retry) clearTimeout(this.retry);
    this.retry = setTimeout(() => this.connect(), delay);
  }

  private clearTimers(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.retry) clearTimeout(this.retry);
    this.heartbeat = null;
    this.retry = null;
  }

  private reconnectNow = (): void => {
    if (this.stopped || this.isOpen) return;
    const s = this.socket;
    this.socket = null;
    if (s) {
      s.onclose = null;
      s.close();
    }
    this.clearTimers();
    this.attempt = 0;
    this.connect();
  };

  private onVisibility = (): void => {
    if (document.visibilityState === "visible") this.reconnectNow();
  };
}
