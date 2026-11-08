"use client";

import type { ComponentProps } from "react";
import type { ConnectionStatus } from "@/features/scene-control/lib/protocol";
import type { IntercomState, KeypadKey } from "../types";
import type { DeviceHeader } from "./DeviceHeader";
import { IntercomDevice } from "./IntercomDevice";
import { ScreenSkin } from "./screen/ScreenSkin";
import type { VideoSource } from "./video/VideoArea";

export interface DeviceViewProps {
  state: IntercomState;
  source: VideoSource;
  cameraOk: boolean;
  connection: ConnectionStatus;
  onKey: (key: KeypadKey) => void;
  keyFlash: { key: KeypadKey; id: number } | null;
  brandPressHandlers: ComponentProps<typeof DeviceHeader>["pressHandlers"];
}

/** Renders the intercom in the skin chosen by the operator (synced setting). */
export function DeviceView(props: DeviceViewProps) {
  return props.state.settings.skin === "hardware" ? <IntercomDevice {...props} /> : <ScreenSkin {...props} />;
}
