import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRelay } from "../../../../server/relay.mjs";
import { createInitialState, reduce } from "@/features/intercom/lib/state-machine";
import type { ConnectionStatus, ServerMessage } from "./protocol";
import { SyncClient } from "./sync-client";

/** End-to-end check of operator → relay → intercom → relay → operator. */

let server: Server;
let relay: ReturnType<typeof createRelay>;
let url: string;
const clients: SyncClient[] = [];

beforeEach(async () => {
  relay = createRelay();
  server = createServer();
  server.on("upgrade", (req, socket, head) => relay.handleUpgrade(req, socket, head));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}/ws`;
});

afterEach(async () => {
  clients.splice(0).forEach((c) => c.stop());
  relay.close();
  await new Promise((r) => server.close(r));
});

function connect(role: "intercom" | "control") {
  const messages: ServerMessage[] = [];
  const statuses: ConnectionStatus[] = [];
  const client = new SyncClient({
    url,
    role,
    onMessage: (m) => messages.push(m),
    onStatus: (s) => statuses.push(s),
  });
  clients.push(client);
  client.start();
  return { client, messages, statuses };
}

async function waitFor<T>(fn: () => T | undefined, timeout = 2000): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const v = fn();
    if (v !== undefined && v !== false) return v;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error("timeout");
}

describe("relay", () => {
  it("forwards operator commands to the intercom", async () => {
    const intercom = connect("intercom");
    const control = connect("control");
    await waitFor(() => intercom.client.isOpen && control.client.isOpen);
    await waitFor(() => control.messages.find((m) => m.type === "welcome"));

    control.client.send({ type: "command", id: "c1", command: { type: "goto", sceneId: "smile" } });
    const msg = await waitFor(() => intercom.messages.find((m) => m.type === "command"));
    expect(msg).toEqual({ type: "command", id: "c1", command: { type: "goto", sceneId: "smile" } });
  });

  it("does not let an intercom issue commands", async () => {
    const a = connect("intercom");
    const b = connect("intercom");
    await waitFor(() => a.client.isOpen && b.client.isOpen);
    await waitFor(() => b.messages.find((m) => m.type === "welcome"));
    a.client.send({ type: "command", id: "x", command: { type: "unlock" } });
    await new Promise((r) => setTimeout(r, 100));
    expect(b.messages.some((m) => m.type === "command")).toBe(false);
  });

  it("relays intercom state to consoles and caches it for late joiners", async () => {
    const intercom = connect("intercom");
    await waitFor(() => intercom.client.isOpen);
    await waitFor(() => intercom.messages.find((m) => m.type === "welcome"));
    const state = reduce(createInitialState(), { type: "goto", sceneId: "blink" });
    intercom.client.send({
      type: "state",
      state,
      device: { camera: "live", cameraDetail: null, demo: false, fullscreen: true, wakeLock: true },
    });

    await new Promise((r) => setTimeout(r, 50));
    const late = connect("control");
    const welcome = await waitFor(() => late.messages.find((m) => m.type === "welcome"));
    expect(welcome.type === "welcome" && welcome.lastState).toMatchObject({ sceneId: "blink" });
    expect(welcome.type === "welcome" && welcome.lastDevice).toMatchObject({ camera: "live" });
  });

  it("asks intercoms for fresh state when a console joins", async () => {
    const intercom = connect("intercom");
    await waitFor(() => intercom.messages.find((m) => m.type === "welcome"));
    connect("control");
    await waitFor(() => intercom.messages.find((m) => m.type === "requestState"));
  });

  it("reports presence", async () => {
    const intercom = connect("intercom");
    connect("control");
    const p = await waitFor(() =>
      intercom.messages.find((m) => m.type === "presence" && m.presence.controls === 1 && m.presence.intercoms === 1),
    );
    expect(p).toBeTruthy();
  });

  it("reconnects after the relay drops the connection", async () => {
    const intercom = connect("intercom");
    await waitFor(() => intercom.client.isOpen);
    relay.close();
    relay = createRelay();
    server.removeAllListeners("upgrade");
    server.on("upgrade", (req, socket, head) => relay.handleUpgrade(req, socket, head));
    await waitFor(() => intercom.statuses.includes("reconnecting"));
    await waitFor(() => intercom.client.isOpen && relay.presence().intercoms === 1, 4000);
  });
});
