import {
  ChevronLeft,
  Crown,
  Expand,
  Eye,
  Mic,
  RotateCcw,
  RotateCw,
  ScanFace,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { VideoCue } from "../../types";

function Chip({ color, icon, children }: { color: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="cue-chip swap" style={{ "--cue-color": color } as CSSProperties}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

const ICON = { size: "1.25em", strokeWidth: 2.4, "aria-hidden": true } as const;

/** Guidance graphics drawn on the live picture for each script beat. */
export function CueOverlay({ cue }: { cue: VideoCue }) {
  switch (cue) {
    case "approach":
      return (
        <Chip color="var(--tone-info)" icon={<Expand {...ICON} />}>
          Distanță prea mare
        </Chip>
      );
    case "left":
      return (
        <>
          <div className="cue chevrons chevrons--left" style={{ "--cue-color": "var(--tone-info)" } as CSSProperties}>
            <ChevronLeft strokeWidth={3} />
            <ChevronLeft strokeWidth={3} />
            <ChevronLeft strokeWidth={3} />
          </div>
          <Chip color="var(--tone-info)" icon={<ChevronLeft {...ICON} />}>
            Deplasare: stânga · 12 cm
          </Chip>
        </>
      );
    case "otherLeft":
      return (
        <>
          <div className="cue chevrons chevrons--left" style={{ "--cue-color": "var(--tone-warning)" } as CSSProperties}>
            <ChevronLeft strokeWidth={3} />
            <ChevronLeft strokeWidth={3} />
            <ChevronLeft strokeWidth={3} />
          </div>
          <X className="cue wrong-way" strokeWidth={3} aria-hidden />
          <Chip color="var(--tone-warning)" icon={<ChevronLeft {...ICON} />}>
            Direcție greșită
          </Chip>
        </>
      );
    case "crown":
      return (
        <Chip color="var(--tone-warning)" icon={<Crown {...ICON} />}>
          Obiect pe cap detectat
        </Chip>
      );
    case "wipe":
      return (
        <>
          <div className="wipe-sheen" />
          <Chip color="var(--tone-success)" icon={<Sparkles {...ICON} />}>
            Obiectiv curat · Imagine 100%
          </Chip>
        </>
      );
    case "smile":
      return (
        <Chip color="var(--tone-info)" icon={<Smile {...ICON} />}>
          Analiză zâmbet în curs
        </Chip>
      );
    case "blink":
      return (
        <Chip color="var(--tone-info)" icon={<Eye {...ICON} className="blink-eye" />}>
          Detectare clipire · 0 / 2
        </Chip>
      );
    case "turnHead":
      return (
        <>
          <RotateCcw className="cue turn-cue turn-cue--l" strokeWidth={2.4} aria-hidden />
          <RotateCw className="cue turn-cue turn-cue--r" strokeWidth={2.4} aria-hidden />
          <Chip color="var(--tone-info)" icon={<ScanFace {...ICON} />}>
            Analiză profil 3D
          </Chip>
        </>
      );
    case "listen":
      return (
        <Chip
          color="var(--tone-warning)"
          icon={
            <>
              <Mic {...ICON} />
              <span className="eq" aria-hidden>
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            </>
          }
        >
          Ascultare răspuns
        </Chip>
      );
    case "none":
      return null;
  }
}

/** Crown with a prohibition stroke, positioned above the face guide. */
export function CrownProhibited() {
  return (
    <div className="crown-cue" aria-hidden>
      <Crown strokeWidth={2.2} />
    </div>
  );
}
