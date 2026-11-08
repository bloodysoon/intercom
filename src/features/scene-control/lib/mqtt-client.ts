import type { MqttClient } from "mqtt";
import type { ClientMessage, ClientRole, ConnectionStatus, Presence, ServerMessage } from "./protocol";

export interface MqttSyncOptions {
  role: ClientRole;
  room: string;
  brokers: string[];
  onMessage: (message: ServerMessage) => void;
  onStatus: (status: ConnectionStatus) => void;
}

const BACKOFF_MS = [500, 1_000, 2_000, 4_000, 6_000];

/**
 * The relay protocol mapped onto MQTT topics, for serverless hosting:
 *
 *   dochita/v1/<room>/cmd                 console → intercom commands
 *   dochita/v1/<room>/state   (retained)  intercom state; retained = cache for late joiners
 *   dochita/v1/<room>/req                 console asks the intercom to republish
 *   dochita/v1/<room>/presence/<role>/<id> (retained, cleared by Last Will)
 *
 * Reconnects with back-off and fails over to the next broker after repeated failures.
 */
export class MqttSyncClient {
  private client: MqttClient | null = null;
  private connected = false;
  private stopped = true;
  private attempt = 0;
  private brokerIndex = 0;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private readonly presence = new Map<string, "intercom" | "control">();
  private readonly id = Math.random().toString(36).slice(2, 10);
  private readonly base: string;
  private readonly opts: MqttSyncOptions;

  constructor(opts: MqttSyncOptions) {
    this.opts = opts;
    this.base = `dochita/v1/${opts.room}`;
  }

  get isOpen(): boolean {
    return this.connected;
  }

  private get presenceTopic() {
    return `${this.base}/presence/${this.opts.role}/${this.id}`;
  }

  start(): void {
    this.stopped = false;
    this.opts.onStatus("connecting");
    void this.connect();
    window.addEventListener("online", this.reconnectNow);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  stop(): void {
    this.stopped = true;
    if (this.retry) clearTimeout(this.retry);
    window.removeEventListener("online", this.reconnectNow);
    document.removeEventListener("visibilitychange", this.onVisibility);
    const c = this.client;
    this.client = null;
    this.connected = false;
    if (c) {
      try {
        c.publish(this.presenceTopic, "", { retain: true, qos: 0 });
      } catch {
        // ignore
      }
      c.end(false);
    }
    this.opts.onStatus("offline");
  }

  send(message: ClientMessage): boolean {
    const c = this.client;
    if (!c || !this.connected) return false;
    try {
      switch (message.type) {
        case "command":
          c.publish(`${this.base}/cmd`, JSON.stringify({ id: message.id, command: message.command }), { qos: 1 });
          return true;
        case "state":
          c.publish(`${this.base}/state`, JSON.stringify({ state: message.state, device: message.device }), {
            qos: 1,
            retain: true,
          });
          return true;
        default:
          return true; // hello / ping are handled by MQTT itself
      }
    } catch {
      return false;
    }
  }

  private async connect(): Promise<void> {
    if (this.stopped) return;
    const { default: mqtt } = await import("mqtt");
    if (this.stopped) return;

    const url = this.opts.brokers[this.brokerIndex % this.opts.brokers.length];
    const client = mqtt.connect(url, {
      clientId: `dochita-${this.opts.role}-${this.id}`,
      clean: true,
      keepalive: 10,
      connectTimeout: 7_000,
      reconnectPeriod: 0, // we handle reconnects + failover ourselves
      will: { topic: this.presenceTopic, payload: "", retain: true, qos: 0 },
    });
    this.client = client;

    client.on("connect", () => {
      if (this.client !== client) return;
      this.connected = true;
      this.attempt = 0;
      this.presence.clear();
      const topics = [`${this.base}/presence/+/+`];
      if (this.opts.role === "intercom") topics.push(`${this.base}/cmd`, `${this.base}/req`);
      else topics.push(`${this.base}/state`);
      client.subscribe(topics, { qos: 1 }, () => {
        client.publish(this.presenceTopic, "1", { retain: true, qos: 1 });
        this.opts.onStatus("open");
        this.opts.onMessage({ type: "welcome", presence: this.countPresence(), lastState: null, lastDevice: null });
        if (this.opts.role === "control") client.publish(`${this.base}/req`, "1", { qos: 0 });
      });
    });

    client.on("message", (topic, payload) => this.onMqttMessage(topic, payload.toString()));

    const lost = () => {
      if (this.client !== client) return;
      this.connected = false;
      this.client = null;
      client.removeAllListeners();
      client.end(true);
      this.scheduleReconnect();
    };
    client.on("close", lost);
    client.on("error", lost);
    client.on("offline", lost);
  }

  private onMqttMessage(topic: string, text: string): void {
    const rest = topic.slice(this.base.length + 1);
    if (rest.startsWith("presence/")) {
      const [, role, id] = rest.split("/");
      if (role !== "intercom" && role !== "control") return;
      if (text) this.presence.set(id, role);
      else this.presence.delete(id);
      this.opts.onMessage({ type: "presence", presence: this.countPresence() });
      return;
    }
    if (rest === "req") {
      this.opts.onMessage({ type: "requestState" });
      return;
    }
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return;
    }
    if (rest === "cmd" && typeof data.id === "string") {
      this.opts.onMessage({ type: "command", id: data.id, command: data.command as never });
    } else if (rest === "state" && data.state) {
      this.opts.onMessage({ type: "state", state: data.state as never, device: (data.device as never) ?? null });
    }
  }

  private countPresence(): Presence {
    let intercoms = 0;
    let controls = 0;
    for (const role of this.presence.values()) {
      if (role === "intercom") intercoms++;
      else controls++;
    }
    return { intercoms, controls };
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.opts.onStatus("reconnecting");
    this.attempt += 1;
    // After two failures on a broker, try the next one.
    if (this.attempt % 2 === 0) this.brokerIndex += 1;
    const delay = BACKOFF_MS[Math.min(this.attempt - 1, BACKOFF_MS.length - 1)];
    if (this.retry) clearTimeout(this.retry);
    this.retry = setTimeout(() => void this.connect(), delay);
  }

  private reconnectNow = (): void => {
    if (this.stopped || this.connected) return;
    if (this.retry) clearTimeout(this.retry);
    const c = this.client;
    this.client = null;
    if (c) {
      c.removeAllListeners();
      c.end(true);
    }
    void this.connect();
  };

  private onVisibility = (): void => {
    if (document.visibilityState === "visible") this.reconnectNow();
  };
}
