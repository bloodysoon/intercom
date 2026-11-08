"use client";

import { Maximize, RefreshCw, RotateCcw, Sun, X } from "lucide-react";
import type { CameraStatus } from "@/features/camera/types";
import type { ConnectionStatus } from "@/features/scene-control/lib/protocol";
import type { IntercomSettings } from "../types";

const CAMERA_LABEL: Record<CameraStatus, string> = {
  off: "Oprită (mod demonstrativ)",
  starting: "Se pornește…",
  live: "Activă",
  denied: "Permisiune refuzată",
  unavailable: "Indisponibilă",
  error: "Eroare — se reîncearcă",
};

const NET_LABEL: Record<ConnectionStatus, string> = {
  open: "Conectat",
  connecting: "Se conectează…",
  reconnecting: "Reconectare…",
  offline: "Deconectat",
};

interface TechnicianSheetProps {
  camera: CameraStatus;
  cameraDetail: string | null;
  demo: boolean;
  connection: ConnectionStatus;
  controls: number;
  via: string;
  settings: IntercomSettings;
  fullscreen: { supported: boolean; active: boolean };
  onClose: () => void;
  onRestartCamera: () => void;
  onToggleDemo: () => void;
  onFullscreen: () => void;
  onSettings: (s: Partial<IntercomSettings>) => void;
  onResetScene: () => void;
}

/** Hidden on-device menu for the crew (long-press the brand). Not the director panel. */
export function TechnicianSheet(p: TechnicianSheetProps) {
  return (
    <div className="tech" role="dialog" aria-label="Meniu tehnic" onPointerDown={(e) => e.stopPropagation()}>
      <div className="tech__panel">
        <div className="tech__head">
          <strong>Meniu tehnic</strong>
          <button type="button" className="tech__close" onClick={p.onClose} aria-label="Închide">
            <X />
          </button>
        </div>

        <dl className="tech__status">
          <dt>Cameră</dt>
          <dd>
            {CAMERA_LABEL[p.camera]}
            {p.cameraDetail && <small>{p.cameraDetail}</small>}
          </dd>
          <dt>Rețea</dt>
          <dd>
            {NET_LABEL[p.connection]} · {p.controls} {p.controls === 1 ? "panou" : "panouri"} regizor
            <small>{p.via}</small>
          </dd>
        </dl>

        <div className="tech__grid">
          <button type="button" onClick={p.onRestartCamera}>
            <RefreshCw /> Repornește camera
          </button>
          <button type="button" onClick={p.onToggleDemo}>
            <RefreshCw /> {p.demo ? "Folosește camera" : "Mod demonstrativ"}
          </button>
          {p.fullscreen.supported && (
            <button type="button" onClick={p.onFullscreen}>
              <Maximize /> {p.fullscreen.active ? "Ieși din ecran complet" : "Ecran complet"}
            </button>
          )}
          <button type="button" data-on={p.settings.highBrightness} onClick={() => p.onSettings({ highBrightness: !p.settings.highBrightness })}>
            <Sun /> Luminozitate ridicată
          </button>
          <button type="button" onClick={p.onResetScene}>
            <RotateCcw /> Resetează scena
          </button>
        </div>
      </div>
    </div>
  );
}
