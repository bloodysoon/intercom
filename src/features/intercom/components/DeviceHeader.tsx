import type { HTMLAttributes } from "react";
import type { ConnectionStatus } from "@/features/scene-control/lib/protocol";
import { Indicator, type IndicatorColor } from "./hardware/Indicator";
import { RoyalCrest } from "./hardware/RoyalCrest";

interface DeviceHeaderProps {
  connection: ConnectionStatus;
  cameraOk: boolean;
  /** Pointer handlers for the hidden technician long-press. */
  pressHandlers: Pick<
    HTMLAttributes<HTMLDivElement>,
    "onPointerDown" | "onPointerUp" | "onPointerLeave" | "onPointerCancel"
  >;
}

const NET: Record<ConnectionStatus, { color: IndicatorColor; blink: boolean }> = {
  open: { color: "green", blink: false },
  connecting: { color: "amber", blink: true },
  reconnecting: { color: "amber", blink: true },
  offline: { color: "red", blink: false },
};

export function DeviceHeader({ connection, cameraOk, pressHandlers }: DeviceHeaderProps) {
  const net = NET[connection];
  return (
    <header className="area-header brand">
      <div className="brand__mark" {...pressHandlers}>
        <RoyalCrest className="brand__crest" />
        <div style={{ minWidth: 0 }}>
          <div className="brand__name">PALATUL REGAL</div>
          <div className="brand__sub">DOCHIȚA — SISTEM INTELIGENT DE SECURITATE</div>
        </div>
      </div>
      <div className="brand__status">
        <Indicator label="ALIM." color="green" />
        <Indicator label="REȚEA" color={net.color} blink={net.blink} />
        <Indicator label="CAM" color={cameraOk ? "blue" : "amber"} />
      </div>
    </header>
  );
}
