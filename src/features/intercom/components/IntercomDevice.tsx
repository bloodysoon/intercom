"use client";

import type { ComponentProps } from "react";
import type { ConnectionStatus } from "@/features/scene-control/lib/protocol";
import { isDoorOpen } from "../constants/scenes";
import { selectView } from "../lib/state-machine";
import type { IntercomState, KeypadKey } from "../types";
import { DeviceHeader } from "./DeviceHeader";
import { Screws } from "./hardware/Screws";
import { InfoPanel } from "./InfoPanel";
import { Keypad } from "./keypad/Keypad";
import { LensAssembly } from "./LensAssembly";
import { SpeakerGrille } from "./SpeakerGrille";
import { VideoArea, type VideoSource } from "./video/VideoArea";

interface IntercomDeviceProps {
  state: IntercomState;
  source: VideoSource;
  cameraOk: boolean;
  connection: ConnectionStatus;
  onKey: (key: KeypadKey) => void;
  keyFlash: { key: KeypadKey; id: number } | null;
  brandPressHandlers: ComponentProps<typeof DeviceHeader>["pressHandlers"];
}

/** The physical intercom: housing, camera module, display, keypad, speaker. */
export function IntercomDevice({
  state,
  source,
  cameraOk,
  connection,
  onKey,
  keyFlash,
  brandPressHandlers,
}: IntercomDeviceProps) {
  const view = selectView(state);

  return (
    <div className="housing">
      <Screws />
      <div className="layout">
        <DeviceHeader connection={connection} cameraOk={cameraOk} pressHandlers={brandPressHandlers} />
        <LensAssembly led={view.led} wipeKey={state.sceneId === "lensWiped" ? `wipe-${state.revision}` : null} />
        <div className="area-screen">
          <div className="screen">
            <div className="screen__glass">
              <VideoArea view={view} effect={state.effect} source={source} />
              <InfoPanel view={view} keypad={state.keypad} />
            </div>
          </div>
        </div>
        <div className="area-keypad">
          <Keypad onKey={onKey} flash={keyFlash} />
        </div>
        <SpeakerGrille unlocked={isDoorOpen(state.sceneId)} />
      </div>
    </div>
  );
}
