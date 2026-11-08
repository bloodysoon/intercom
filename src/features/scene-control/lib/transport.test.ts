import { describe, expect, it } from "vitest";
import { isLocalHost, resolveSyncMode } from "./transport";

const loc = (hostname: string, search = "") => ({
  protocol: "https:",
  host: hostname,
  hostname,
  search,
});

describe("connection mode", () => {
  it("uses the local relay for a laptop on set", () => {
    for (const h of ["localhost", "127.0.0.1", "192.168.0.181", "10.0.0.5", "172.20.1.2", "studio.local"]) {
      expect(isLocalHost(h), h).toBe(true);
      expect(resolveSyncMode(loc(h), {})).toBe("relay");
    }
  });

  it("uses MQTT on a cloud deployment such as Vercel", () => {
    expect(isLocalHost("intercom-eta.vercel.app")).toBe(false);
    expect(resolveSyncMode(loc("intercom-eta.vercel.app"), {})).toBe("mqtt");
  });

  it("respects an explicit relay URL", () => {
    expect(resolveSyncMode(loc("intercom-eta.vercel.app"), { url: "wss://relay.example.com/ws" })).toBe("relay");
  });

  it("can be forced with ?sync= or the env setting", () => {
    expect(resolveSyncMode(loc("localhost", "?sync=mqtt"), {})).toBe("mqtt");
    expect(resolveSyncMode(loc("intercom-eta.vercel.app", "?sync=relay"), {})).toBe("relay");
    expect(resolveSyncMode(loc("localhost"), { mode: "mqtt" })).toBe("mqtt");
  });
});
