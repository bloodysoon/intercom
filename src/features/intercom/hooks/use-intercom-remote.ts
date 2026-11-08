"use client";

import { useEffect, useRef, useState } from "react";
import type { ConnectionStatus, DeviceInfo, Presence } from "@/features/scene-control/lib/protocol";
import { resolveSyncUrl } from "@/features/scene-control/lib/protocol";
import { SyncClient } from "@/features/scene-control/lib/sync-client";
import type { IntercomStore } from "../lib/store";
import { parseCommand } from "../lib/validation";
import type { IntercomCommand } from "../types";

const SEEN_LIMIT = 64;

/**
 * Connects the tablet to the relay as an `intercom`: applies operator
 * commands and publishes every state change back. If the connection drops
 * the tablet simply keeps showing its current state.
 */
export function useIntercomRemote(
  store: IntercomStore,
  dispatch: (command: IntercomCommand) => void,
  device: DeviceInfo,
) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [presence, setPresence] = useState<Presence>({ intercoms: 0, controls: 0 });
  const clientRef = useRef<SyncClient | null>(null);
  const deviceRef = useRef(device);
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    const seen: string[] = [];
    const publish = () => clientRef.current?.send({ type: "state", state: store.getState(), device: deviceRef.current });

    const client = new SyncClient({
      url: resolveSyncUrl(window.location),
      role: "intercom",
      onStatus: setStatus,
      onMessage: (msg) => {
        switch (msg.type) {
          case "welcome":
            setPresence(msg.presence);
            publish();
            break;
          case "presence":
            setPresence(msg.presence);
            break;
          case "requestState":
            publish();
            break;
          case "command": {
            if (seen.includes(msg.id)) return;
            seen.push(msg.id);
            if (seen.length > SEEN_LIMIT) seen.shift();
            const command = parseCommand(msg.command);
            if (command) dispatchRef.current(command);
            // Always answer so the console sees the command was received.
            publish();
            break;
          }
          default:
            break;
        }
      },
    });
    clientRef.current = client;
    client.start();
    const unsubscribe = store.subscribe(publish);

    return () => {
      unsubscribe();
      client.stop();
      clientRef.current = null;
    };
  }, [store]);

  // Push device health changes.
  useEffect(() => {
    deviceRef.current = device;
    clientRef.current?.send({ type: "state", state: store.getState(), device });
  }, [device, store]);

  return { status, presence };
}
