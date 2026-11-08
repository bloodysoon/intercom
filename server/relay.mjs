// @ts-check
/**
 * Dochița real-time relay.
 *
 * Forwards operator commands to every connected intercom and intercom state
 * snapshots to every operator console. It keeps only the latest snapshot as a
 * cache so a console that (re)connects can render immediately. The tablet is
 * the source of truth; if this process restarts nothing on the tablet changes.
 *
 * Protocol: see src/features/scene-control/lib/protocol.ts
 */
import { WebSocketServer } from "ws";

const MAX_PAYLOAD = 64 * 1024;
const PING_INTERVAL_MS = 15_000;

/**
 * @param {{ log?: (msg: string) => void }} [options]
 */
export function createRelay(options = {}) {
  const log = options.log ?? (() => {});
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

  /** @type {Map<import("ws").WebSocket, { role: "intercom" | "control" | null, alive: boolean }>} */
  const clients = new Map();
  /** @type {unknown} */
  let lastState = null;
  /** @type {unknown} */
  let lastDevice = null;

  const presence = () => {
    let intercoms = 0;
    let controls = 0;
    for (const c of clients.values()) {
      if (c.role === "intercom") intercoms++;
      else if (c.role === "control") controls++;
    }
    return { intercoms, controls };
  };

  /** @param {import("ws").WebSocket} ws @param {unknown} msg */
  const send = (ws, msg) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  };

  /** @param {"intercom" | "control" | null} role @param {unknown} msg */
  const broadcast = (role, msg) => {
    const data = JSON.stringify(msg);
    for (const [ws, c] of clients) {
      if ((role === null || c.role === role) && ws.readyState === ws.OPEN) ws.send(data);
    }
  };

  const announcePresence = () => broadcast(null, { type: "presence", presence: presence() });

  wss.on("connection", (ws) => {
    clients.set(ws, { role: null, alive: true });

    ws.on("pong", () => {
      const c = clients.get(ws);
      if (c) c.alive = true;
    });

    ws.on("message", (data) => {
      const c = clients.get(ws);
      if (!c) return;
      c.alive = true;

      /** @type {any} */
      let msg;
      try {
        msg = JSON.parse(String(data));
      } catch {
        return;
      }
      if (!msg || typeof msg.type !== "string") return;

      switch (msg.type) {
        case "hello":
          if (msg.role !== "intercom" && msg.role !== "control") return;
          c.role = msg.role;
          send(ws, { type: "welcome", presence: presence(), lastState, lastDevice });
          if (msg.role === "control") broadcast("intercom", { type: "requestState" });
          announcePresence();
          log(`${msg.role} connected (${JSON.stringify(presence())})`);
          break;
        case "ping":
          send(ws, { type: "pong", t: msg.t });
          break;
        case "command":
          if (c.role !== "control" || typeof msg.id !== "string" || !msg.command) return;
          broadcast("intercom", { type: "command", id: msg.id, command: msg.command });
          break;
        case "state":
          if (c.role !== "intercom" || !msg.state) return;
          lastState = msg.state;
          lastDevice = msg.device ?? null;
          broadcast("control", { type: "state", state: msg.state, device: lastDevice });
          break;
        default:
          break;
      }
    });

    ws.on("close", () => {
      const c = clients.get(ws);
      clients.delete(ws);
      if (c?.role) {
        announcePresence();
        log(`${c.role} disconnected (${JSON.stringify(presence())})`);
      }
    });

    ws.on("error", () => ws.terminate());
  });

  // Drop dead connections (e.g. a tablet that lost Wi-Fi without closing).
  const pinger = setInterval(() => {
    for (const [ws, c] of clients) {
      if (!c.alive) {
        ws.terminate();
        continue;
      }
      c.alive = false;
      ws.ping();
    }
  }, PING_INTERVAL_MS);
  pinger.unref?.();

  return {
    /**
     * @param {import("node:http").IncomingMessage} req
     * @param {import("node:stream").Duplex} socket
     * @param {Buffer} head
     */
    handleUpgrade(req, socket, head) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    },
    presence,
    close() {
      clearInterval(pinger);
      for (const ws of clients.keys()) ws.terminate();
      wss.close();
    },
  };
}
