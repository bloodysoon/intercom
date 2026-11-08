import { afterEach, describe, expect, it } from "vitest";
import { createInitialState, reduce } from "@/features/intercom/lib/state-machine";
import { MqttSyncClient } from "./mqtt-client";
import type { ServerMessage } from "./protocol";
import { DEFAULT_BROKERS } from "./transport";

/**
 * Real round trip through the public broker. Needs internet, so it only runs
 * with MQTT_LIVE=1:  MQTT_LIVE=1 npx vitest run mqtt-client
 */
const live = process.env.MQTT_LIVE === "1";

// Minimal browser globals the client uses for reconnect hooks.
const g = globalThis as unknown as { window?: unknown; document?: unknown };
g.window ??= { addEventListener() {}, removeEventListener() {} };
g.document ??= { addEventListener() {}, removeEventListener() {}, visibilityState: "visible" };

const clients: MqttSyncClient[] = [];
afterEach(() => clients.splice(0).forEach((c) => c.stop()));

async function waitFor<T>(fn: () => T | undefined, timeout = 10_000): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const v = fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("timeout");
}

describe.runIf(live)("MQTT transport (live broker)", () => {
  it("delivers commands to the intercom and state back to the console", async () => {
    const room = `test-${Math.random().toString(36).slice(2, 10)}`;
    const mk = (role: "intercom" | "control") => {
      const messages: ServerMessage[] = [];
      const c = new MqttSyncClient({ role, room, brokers: DEFAULT_BROKERS, onMessage: (m) => messages.push(m), onStatus: () => {} });
      clients.push(c);
      c.start();
      return { c, messages };
    };
    const intercom = mk("intercom");
    const control = mk("control");
    await waitFor(() => intercom.c.isOpen && control.c.isOpen);
    await waitFor(() => control.messages.some((m) => m.type === "presence" && m.presence.intercoms === 1));

    control.c.send({ type: "command", id: "c1", command: { type: "goto", sceneId: "smile" } });
    const cmd = await waitFor(() => intercom.messages.find((m) => m.type === "command"));
    expect(cmd).toEqual({ type: "command", id: "c1", command: { type: "goto", sceneId: "smile" } });

    const state = reduce(createInitialState(), { type: "goto", sceneId: "smile" });
    intercom.c.send({ type: "state", state, device: { camera: "live", cameraDetail: null, demo: false, fullscreen: true, wakeLock: true } });
    const st = await waitFor(() => control.messages.find((m) => m.type === "state"));
    expect(st.type === "state" && st.state.sceneId).toBe("smile");

    // A console that joins later gets the retained state immediately.
    const late = mk("control");
    const retained = await waitFor(() => late.messages.find((m) => m.type === "state"));
    expect(retained.type === "state" && retained.state.sceneId).toBe("smile");
  }, 30_000);
});
