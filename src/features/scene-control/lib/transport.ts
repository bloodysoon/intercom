import { MqttSyncClient } from "./mqtt-client";
import { resolveSyncUrl, type ClientMessage, type ClientRole, type ConnectionStatus, type ServerMessage } from "./protocol";
import { SyncClient } from "./sync-client";

/**
 * Two interchangeable ways for the console and the tablet to talk:
 *
 * - "relay": our own WebSocket relay (server/relay.mjs). Used on set when a
 *   laptop runs `npm start` — works on the local Wi-Fi without internet.
 * - "mqtt":  a public MQTT broker over secure WebSockets. Used when the app is
 *   hosted on a serverless platform (Vercel) that cannot hold WebSockets.
 *   No account or server to maintain; devices meet in a "room" (topic).
 *
 * Both expose the same interface and speak the same protocol messages.
 */
export interface SyncTransport {
  start(): void;
  stop(): void;
  send(message: ClientMessage): boolean;
  readonly isOpen: boolean;
}

export type SyncMode = "relay" | "mqtt";

export interface TransportInfo {
  mode: SyncMode;
  room: string;
}

/** Public brokers, tried in order (failover). Override with NEXT_PUBLIC_MQTT_URLS (comma separated). */
export const DEFAULT_BROKERS = ["wss://broker.hivemq.com:8884/mqtt", "wss://broker.emqx.io:8084/mqtt"];

/** Shared by every device that doesn't specify `?sala=`. */
export const DEFAULT_ROOM = "palatul-regal-dochita-k7q3";
const ROOM_KEY = "dochita.room";

type Loc = Pick<Location, "protocol" | "host" | "hostname" | "search">;

/** localhost, LAN addresses and *.local → a laptop on set running our server. */
export function isLocalHost(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "");
  return (
    h === "localhost" ||
    h === "::1" ||
    h.endsWith(".local") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

export function resolveSyncMode(location: Loc, env: { mode?: string; url?: string } = readEnv()): SyncMode {
  const fromUrl = new URLSearchParams(location.search).get("sync");
  if (fromUrl === "relay" || fromUrl === "mqtt") return fromUrl;
  if (env.mode === "relay" || env.mode === "mqtt") return env.mode;
  if (env.url) return "relay";
  return isLocalHost(location.hostname) ? "relay" : "mqtt";
}

/** Room: `?sala=` in the URL (remembered on this device) → saved → env → default. */
export function resolveRoom(location: Loc): string {
  const clean = (v: string | null | undefined) => (v ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 48);
  const fromUrl = clean(new URLSearchParams(location.search).get("sala"));
  try {
    if (fromUrl) {
      localStorage.setItem(ROOM_KEY, fromUrl);
      return fromUrl;
    }
    const saved = clean(localStorage.getItem(ROOM_KEY));
    if (saved) return saved;
  } catch {
    if (fromUrl) return fromUrl;
  }
  return clean(process.env.NEXT_PUBLIC_SYNC_ROOM) || DEFAULT_ROOM;
}

function readEnv() {
  return { mode: process.env.NEXT_PUBLIC_SYNC_MODE, url: process.env.NEXT_PUBLIC_SYNC_URL };
}

export function createSyncTransport(opts: {
  role: ClientRole;
  onMessage: (m: ServerMessage) => void;
  onStatus: (s: ConnectionStatus) => void;
}): { transport: SyncTransport; info: TransportInfo } {
  const mode = resolveSyncMode(window.location);
  const room = resolveRoom(window.location);
  if (mode === "mqtt") {
    const brokers = process.env.NEXT_PUBLIC_MQTT_URLS?.split(",").map((s) => s.trim()).filter(Boolean);
    return {
      transport: new MqttSyncClient({ ...opts, room, brokers: brokers?.length ? brokers : DEFAULT_BROKERS }),
      info: { mode, room },
    };
  }
  return { transport: new SyncClient({ ...opts, url: resolveSyncUrl(window.location) }), info: { mode, room } };
}
