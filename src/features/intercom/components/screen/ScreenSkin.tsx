"use client";

import { formatTime, useClock } from "@/shared/hooks/use-clock";
import { selectView } from "../../lib/state-machine";
import { RoyalCrest } from "../hardware/RoyalCrest";
import { InfoPanel } from "../InfoPanel";
import { Keypad } from "../keypad/Keypad";
import type { DeviceViewProps } from "../DeviceView";
import { LensAssembly } from "../LensAssembly";
import { VideoArea } from "../video/VideoArea";

/**
 * The tablet *is* the intercom: a full-screen smart-panel interface.
 * No drawn housing and no status icons — a visible camera with its LED ring
 * (the King wipes it in Sc. 2), live picture edge to edge, brand and clock,
 * touch keys, and the status light also as a glow around the screen edge.
 */
export function ScreenSkin({ state, source, onKey, keyFlash, brandPressHandlers }: DeviceViewProps) {
  const view = selectView(state);

  return (
    <div className="sk" data-led={view.led}>
      <div className="sk__layout">
        <StatusBar pressHandlers={brandPressHandlers} />
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

function StatusBar({ pressHandlers }: { pressHandlers: DeviceViewProps["brandPressHandlers"] }) {
  const now = useClock();
  return (
    <header className="sk__bar">
      <div className="sk__brand" {...pressHandlers}>
        <RoyalCrest className="sk__crest" />
        <div className="sk__brandtext">
          <div className="sk__name">PALATUL REGAL</div>
          <div className="sk__sub">DOCHIȚA · SISTEM INTELIGENT DE SECURITATE</div>
        </div>
      </div>
      <span className="sk__time">{now ? formatTime(now, false) : " "}</span>
    </header>
  );
}
