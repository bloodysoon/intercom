"use client";

import { useEffect, useRef, useState } from "react";
import { IntercomDevice } from "@/features/intercom/components/IntercomDevice";
import type { IntercomState } from "@/features/intercom/types";
import type { ConnectionStatus } from "../lib/protocol";

const noop = () => {};
const NO_SOURCE = { stream: null, mirrored: false, width: null, height: null };
/** Rendered at a real tablet size, then scaled, so proportions match the device exactly. */
const VIRTUAL = { width: 820, height: 1180 };

/**
 * Mirror of what the tablet displays, rendered with the same components
 * (simulated picture instead of the camera).
 */
export function LivePreview({ state, connection }: { state: IntercomState | null; connection: ConnectionStatus }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / VIRTUAL.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={frame}
      className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[18px] bg-black"
      style={{ aspectRatio: `${VIRTUAL.width} / ${VIRTUAL.height}` }}
    >
      {state ? (
        <div
          className="pointer-events-none absolute left-0 top-0 origin-top-left"
          style={{ width: VIRTUAL.width, height: VIRTUAL.height, transform: `scale(${scale})` }}
          inert
        >
          <div className="h-full p-[6px]">
            <IntercomDevice
              state={state}
              source={NO_SOURCE}
              cameraOk
              connection={connection}
              onKey={noop}
              keyFlash={null}
              brandPressHandlers={{}}
            />
          </div>
        </div>
      ) : (
        <div className="grid h-full place-items-center text-sm text-slate-500">Fără semnal</div>
      )}
    </div>
  );
}
