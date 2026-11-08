"use client";

import { Camera, CameraOff, Lock, LockOpen, Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/features/scene-control/lib/protocol";
import { formatTime, useClock } from "@/shared/hooks/use-clock";
import { isDoorOpen } from "../../constants/scenes";
import { selectView } from "../../lib/state-machine";
import { RoyalCrest } from "../hardware/RoyalCrest";
import { InfoPanel } from "../InfoPanel";
import { Keypad } from "../keypad/Keypad";
import type { DeviceViewProps } from "../DeviceView";
import { LensAssembly } from "../LensAssembly";
import { VideoArea } from "../video/VideoArea";

/**
 * The tablet *is* the intercom: a full-screen smart-panel interface.
 * No drawn housing — a visible camera with its LED ring (the King wipes it in
 * Sc. 2), live picture edge to edge, a status bar, touch keys, and the status
 * light also rendered as a glow around the screen edge.
 */
export function ScreenSkin({ state, source, cameraOk, connection, onKey, keyFlash, brandPressHandlers }: DeviceViewProps) {
  const view = selectView(state);
  const open = isDoorOpen(state.sceneId);

  return (
    <div className="sk" data-led={view.led}>
      <div className="sk__layout">
        <StatusBar
          connection={connection}
          cameraOk={cameraOk}
          open={open}
          pressHandlers={brandPressHandlers}
        />
        <LensAssembly led={view.led} wipeKey={state.sceneId === "lensWiped" ? `wipe-${state.revision}` : null} />
        <div className="sk__video">
          <VideoArea view={view} effect={state.effect} source={source} />
        </div>
        <div className="sk__panel">
          <InfoPanel view={view} keypad={state.keypad} />
          <Keypad onKey={onKey} flash={keyFlash} />
        </div>
      </div>
      <div className="sk__glow" aria-hidden />
    </div>
  );
}

function StatusBar({
  connection,
  cameraOk,
  open,
  pressHandlers,
}: {
  connection: ConnectionStatus;
  cameraOk: boolean;
  open: boolean;
  pressHandlers: DeviceViewProps["brandPressHandlers"];
}) {
  const now = useClock();
  const online = connection === "open";
  return (
    <header className="sk__bar">
      <div className="sk__brand" {...pressHandlers}>
        <RoyalCrest className="sk__crest" />
        <div className="sk__brandtext">
          <div className="sk__name">PALATUL REGAL</div>
          <div className="sk__sub">DOCHIȚA · SISTEM INTELIGENT DE SECURITATE</div>
        </div>
      </div>

      <div className="sk__icons">
        <span className="sk__icon" data-state={open ? "ok" : "locked"} title={open ? "Ușă deblocată" : "Ușă încuiată"}>
          {open ? <LockOpen /> : <Lock />}
        </span>
        <span className="sk__icon" data-state={cameraOk ? "on" : "warn"}>
          {cameraOk ? <Camera /> : <CameraOff />}
        </span>
        <span className="sk__icon" data-state={online ? "on" : "warn"} data-blink={!online}>
          {online ? <Wifi /> : <WifiOff />}
        </span>
        <span className="sk__time">{now ? formatTime(now, false) : " "}</span>
      </div>
    </header>
  );
}

