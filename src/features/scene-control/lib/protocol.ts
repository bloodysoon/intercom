import type { CameraStatus } from "@/features/camera/types";
import type { IntercomCommand, IntercomState } from "@/features/intercom/types";

/**
 * Wire protocol between the intercom tablet, the operator console and the
 * relay (`server/relay.mjs`). The relay is deliberately dumb: it forwards
 * commands to intercoms and state snapshots to consoles.
 *
 * The **intercom is the source of truth.** It applies commands with the same
 * reducer used for local keypad input and publishes the resulting state.
 * The relay only caches the latest snapshot so a console that (re)joins can
 * render immediately; losing the relay never changes what the tablet shows.
 */

export type ClientRole = "intercom" | "control";

export interface Presence {
  intercoms: number;
  controls: number;
}

/** Health of the tablet, shown on the operator console. */
export interface DeviceInfo {
  camera: CameraStatus;
  cameraDetail: string | null;
  demo: boolean;
  audioReady: boolean;
  fullscreen: boolean;
  wakeLock: boolean;
}

export type ClientMessage =
  | { type: "hello"; role: ClientRole }
  | { type: "command"; id: string; command: IntercomCommand }
  | { type: "state"; state: IntercomState; device: DeviceInfo }
  | { type: "ping"; t: number };

export type ServerMessage =
  | { type: "welcome"; presence: Presence; lastState: IntercomState | null; lastDevice: DeviceInfo | null }
  | { type: "command"; id: string; command: IntercomCommand }
  | { type: "state"; state: IntercomState; device: DeviceInfo | null }
  | { type: "presence"; presence: Presence }
  | { type: "requestState" }
  | { type: "pong"; t: number };

export type ConnectionStatus = "connecting" | "open" | "reconnecting" | "offline";

export const SYNC_PATH = "/ws";

/** Resolves the relay URL: env override first, then same host as the page. */
export function resolveSyncUrl(location: Pick<Location, "protocol" | "host">): string {
  const configured = process.env.NEXT_PUBLIC_SYNC_URL;
  if (configured) return configured;
  const scheme = location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${location.host}${SYNC_PATH}`;
}

export function parseServerMessage(raw: unknown): ServerMessage | null {
  if (typeof raw !== "string") return null;
  try {
    const msg: unknown = JSON.parse(raw);
    if (typeof msg !== "object" || msg === null || !("type" in msg)) return null;
    return msg as ServerMessage;
  } catch {
    return null;
  }
}
