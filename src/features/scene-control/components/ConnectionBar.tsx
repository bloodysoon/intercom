import { Camera, CheckCheck, Clock, Radio, TabletSmartphone, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { CameraStatus } from "@/features/camera/types";
import type { AckState } from "../hooks/use-control-sync";
import type { ConnectionStatus, DeviceInfo, Presence } from "../lib/protocol";
import type { TransportInfo } from "../lib/transport";

type Level = "ok" | "warn" | "bad" | "idle";

const LEVEL_CLASS: Record<Level, string> = {
  ok: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  warn: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  bad: "border-red-400/40 bg-red-500/15 text-red-300",
  idle: "border-white/10 bg-white/5 text-slate-400",
};

function Badge({ level, icon, children }: { level: Level; icon: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${LEVEL_CLASS[level]}`}>
      {icon}
      {children}
    </span>
  );
}

const CAMERA: Record<CameraStatus, [Level, string]> = {
  live: ["ok", "Cameră activă"],
  starting: ["warn", "Cameră: pornire"],
  off: ["idle", "Imagine simulată"],
  denied: ["bad", "Cameră refuzată"],
  unavailable: ["bad", "Cameră indisponibilă"],
  error: ["warn", "Cameră: reîncercare"],
};

interface ConnectionBarProps {
  status: ConnectionStatus;
  presence: Presence;
  device: DeviceInfo | null;
  ack: AckState;
  info: TransportInfo | null;
}

export function ConnectionBar({ status, presence, device, ack, info }: ConnectionBarProps) {
  const via = info?.mode === "mqtt" ? `cloud · sala ${info.room}` : "rețea locală";
  const server: [Level, string] =
    status === "open"
      ? ["ok", `Conectat (${via})`]
      : status === "offline"
        ? ["bad", "Deconectat"]
        : ["warn", `Reconectare (${via})…`];
  const tablet: [Level, string] =
    status !== "open"
      ? ["idle", "Interfon: necunoscut"]
      : presence.intercoms > 0
        ? ["ok", presence.intercoms > 1 ? `${presence.intercoms} interfoane online` : "Interfon online"]
        : ["bad", "Interfon OFFLINE"];
  const cam = device && presence.intercoms > 0 ? CAMERA[device.camera] : null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
      <Badge level={server[0]} icon={<Radio size={16} />}>
        {server[1]}
      </Badge>
      <Badge level={tablet[0]} icon={<TabletSmartphone size={16} />}>
        {tablet[1]}
      </Badge>
      {cam && (
        <Badge level={cam[0]} icon={<Camera size={16} />}>
          {cam[1]}
        </Badge>
      )}
      {ack.kind === "pending" && (
        <Badge level="warn" icon={<Clock size={16} />}>
          Se trimite…
        </Badge>
      )}
      {ack.kind === "ok" && (
        <Badge level="ok" icon={<CheckCheck size={16} />}>
          Confirmat
        </Badge>
      )}
      {ack.kind === "timeout" && (
        <Badge level="bad" icon={<TriangleAlert size={16} />}>
          Comanda nu a fost confirmată
        </Badge>
      )}
    </div>
  );
}
