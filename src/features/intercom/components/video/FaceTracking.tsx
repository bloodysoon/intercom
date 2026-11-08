import { ScanFace, UserX, UserCheck, Crosshair } from "lucide-react";
import type { OverlayConfig, SceneDefinition, Tone, TrackingMode } from "../../types";

interface FaceTrackingProps {
  scene: SceneDefinition;
  overlay: OverlayConfig;
  tone: Tone;
  tracking: TrackingMode;
  scanning: boolean;
}

const LABEL_ICON = {
  hidden: Crosshair,
  searching: ScanFace,
  locked: Crosshair,
  rejected: UserX,
  verified: UserCheck,
} as const;

function identity(scene: SceneDefinition, tracking: TrackingMode): string {
  if (tracking === "rejected") return "NECUNOSCUT";
  if (scene.scene === 3) return "PRINȚUL";
  if (scene.progress !== undefined && scene.progress >= 97) return "REGELE (?)";
  if (tracking === "searching") return "—";
  return "ÎN ANALIZĂ";
}

/** Oval guide, tracking brackets, scan line and landmark mesh around the subject's face. */
export function FaceTracking({ scene, overlay, tone, tracking, scanning }: FaceTrackingProps) {
  const LabelIcon = LABEL_ICON[tracking];
  const match = scene.progress ?? null;

  return (
    <div className="face-zone" data-tone={tone}>
      {overlay.guides && <div className="face-guide" data-cue={overlay.cue} />}

      {scanning && (
        <>
          <div className="scanline" />
          <svg className="landmarks" viewBox="0 0 100 128" preserveAspectRatio="none" aria-hidden>
            <path d="M28 52 Q36 47 44 52 M56 52 Q64 47 72 52 M50 56 L47 76 L53 76 M38 92 Q50 100 62 92 M22 60 Q24 100 50 114 Q76 100 78 60" />
            {[
              [28, 52], [36, 49], [44, 52], [56, 52], [64, 49], [72, 52], [50, 56], [47, 76], [53, 76],
              [38, 92], [50, 97], [62, 92], [22, 60], [26, 88], [38, 106], [50, 114], [62, 106], [74, 88], [78, 60],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.3" />
            ))}
          </svg>
        </>
      )}

      {tracking !== "hidden" && (
        <div className="tracking" data-mode={tracking}>
          <span className="tracking__corner tracking__corner--tl" />
          <span className="tracking__corner tracking__corner--tr" />
          <span className="tracking__corner tracking__corner--bl" />
          <span className="tracking__corner tracking__corner--br" />
          {overlay.trackingLabel && (
            <span className="tracking__label">
              <LabelIcon size="1.15em" strokeWidth={2.4} aria-hidden />
              {overlay.trackingLabel}
            </span>
          )}
          <span className="tracking__meta">
            <span>ID: {identity(scene, tracking)}</span>
            <span>POTRIVIRE: {match === null ? "--" : `${match}%`}</span>
            <span>LUMINĂ: OK</span>
          </span>
        </div>
      )}
    </div>
  );
}
