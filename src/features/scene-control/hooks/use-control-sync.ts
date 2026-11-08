"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseState } from "@/features/intercom/lib/validation";
import type { IntercomCommand, IntercomState } from "@/features/intercom/types";
import type { ConnectionStatus, DeviceInfo, Presence } from "../lib/protocol";
import { resolveSyncUrl } from "../lib/protocol";
import { SyncClient } from "../lib/sync-client";

export type AckState = { kind: "idle" } | { kind: "pending"; at: number } | { kind: "ok"; at: number } | { kind: "timeout"; at: number };

const ACK_TIMEOUT_MS = 2500;

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Operator side of the sync: sends commands, mirrors the tablet's state,
 * tracks presence and whether the last command was acknowledged.
 */
export function useControlSync() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [presence, setPresence] = useState<Presence>({ intercoms: 0, controls: 0 });
  const [remote, setRemote] = useState<IntercomState | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [ack, setAck] = useState<AckState>({ kind: "idle" });
  const clientRef = useRef<SyncClient | null>(null);
  const ackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onState = (raw: unknown, dev: DeviceInfo | null) => {
      const state = parseState(raw);
      if (state) setRemote(state);
      if (dev) setDevice(dev);
      setAck((a) => (a.kind === "pending" ? { kind: "ok", at: Date.now() } : a));
      if (ackTimer.current) clearTimeout(ackTimer.current);
    };

    const client = new SyncClient({
      url: resolveSyncUrl(window.location),
      role: "control",
      onStatus: setStatus,
      onMessage: (msg) => {
        switch (msg.type) {
          case "welcome":
            setPresence(msg.presence);
            if (msg.lastState) {
              const s = parseState(msg.lastState);
              if (s) setRemote(s);
            }
            if (msg.lastDevice) setDevice(msg.lastDevice);
            break;
          case "presence":
            setPresence(msg.presence);
            break;
          case "state":
            onState(msg.state, msg.device);
            break;
          default:
            break;
        }
      },
    });
    clientRef.current = client;
    client.start();
    return () => {
      client.stop();
      clientRef.current = null;
      if (ackTimer.current) clearTimeout(ackTimer.current);
    };
  }, []);

  const send = useCallback((command: IntercomCommand): boolean => {
    const ok = clientRef.current?.send({ type: "command", id: newId(), command }) ?? false;
    if (!ok) {
      setAck({ kind: "timeout", at: Date.now() });
      return false;
    }
    setAck({ kind: "pending", at: Date.now() });
    if (ackTimer.current) clearTimeout(ackTimer.current);
    ackTimer.current = setTimeout(() => {
      setAck((a) => (a.kind === "pending" ? { kind: "timeout", at: Date.now() } : a));
    }, ACK_TIMEOUT_MS);
    return true;
  }, []);

  return { status, presence, remote, device, ack, send };
}
