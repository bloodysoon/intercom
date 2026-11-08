"use client";

import { CameraFeed } from "@/features/camera/components/CameraFeed";
import { DemoFeed } from "@/features/camera/components/DemoFeed";
import type { IntercomView } from "../../lib/state-machine";
import type { TransientEffect, Tone, TrackingMode } from "../../types";
import { CrownProhibited, CueOverlay } from "./CueOverlay";
import { FaceTracking } from "./FaceTracking";
import { UnlockOverlay } from "./UnlockOverlay";
import { VideoHud } from "./VideoHud";

export interface VideoSource {
  stream: MediaStream | null;
  mirrored: boolean;
  width: number | null;
  height: number | null;
}

interface VideoAreaProps {
  view: IntercomView;
  effect: TransientEffect | null;
  source: VideoSource;
}

function trackingTone(mode: TrackingMode, sceneTone: Tone): Tone {
  switch (mode) {
    case "rejected":
      return "error";
    case "verified":
      return sceneTone === "warning" || sceneTone === "error" ? "warning" : "success";
    case "locked":
      return sceneTone === "warning" ? "warning" : "info";
    default:
      return "info";
  }
}

export function VideoArea({ view, effect, source }: VideoAreaProps) {
  const { scene } = view;
  const overlay = scene.overlay;

  // Operator-triggered effects temporarily take over the face overlay.
  let tracking = overlay.tracking;
  let scanning = overlay.scanning;
  let tone = trackingTone(tracking, scene.tone);
  if (effect?.kind === "scan") {
    scanning = true;
    tone = "info";
    if (tracking === "hidden") tracking = "locked";
  } else if (effect?.kind === "failure") {
    tracking = "rejected";
    tone = "error";
  } else if (effect?.kind === "success") {
    tracking = "verified";
    tone = "success";
  }
  const showZone = scene.id !== "unlocked" && (overlay.guides || scanning || tracking !== "hidden");

  const resolution =
    source.width && source.height ? `${source.width}×${source.height} · 30 FPS` : "1280×720 · 30 FPS";

  return (
    <div className="video" data-dimmed={scene.cameraDimmed === true}>
      {source.stream ? (
        <CameraFeed className="video__media" stream={source.stream} mirrored={source.mirrored} />
      ) : (
        <div className="video__media">
          <DemoFeed subject={scene.id !== "standby"} />
        </div>
      )}
      <div className="video__tint" />
      <div className="video__grain" />

      {showZone && (
        <FaceTracking scene={scene} overlay={overlay} tone={tone} tracking={tracking} scanning={scanning} />
      )}
      {showZone && overlay.cue === "crown" && (
        <div className="face-zone" data-tone="error">
          <CrownProhibited />
        </div>
      )}

      {scene.id !== "unlocked" && <CueOverlay key={scene.id} cue={overlay.cue} />}

      {effect && <div key={effect.id} className="video__toneflash" data-kind={effect.kind} />}

      <VideoHud resolution={resolution} />

      {scene.id === "unlocked" && <UnlockOverlay />}
    </div>
  );
}
