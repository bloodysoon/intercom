"use client";

import { Camera, MonitorSmartphone, Power } from "lucide-react";
import { useState } from "react";
import { RoyalCrest } from "./hardware/RoyalCrest";

export interface BootPreferences {
  demo: boolean;
  fullscreen: boolean;
  wakeLock: boolean;
}

interface BootScreenProps {
  initial: BootPreferences;
  fullscreenSupported: boolean;
  wakeLockSupported: boolean;
  secureContext: boolean;
  onStart: (prefs: BootPreferences) => void;
}

/**
 * Pre-roll screen shown once per session. The tap on "Pornește" is the user
 * gesture that enables fullscreen, wake lock and the camera prompt.
 */
export function BootScreen({ initial, fullscreenSupported, wakeLockSupported, secureContext, onStart }: BootScreenProps) {
  const [prefs, setPrefs] = useState<BootPreferences>(initial);
  const toggle = (key: keyof BootPreferences) => setPrefs((p) => ({ ...p, [key]: !p[key] }));
  const controlUrl = typeof window !== "undefined" ? `${window.location.origin}/control` : "/control";

  return (
    <div className="boot">
      <div className="boot__card">
        <RoyalCrest className="boot__crest" />
        <h1 className="boot__title">Dochița</h1>
        <p className="boot__sub">Sistem inteligent de securitate · Palatul Regal</p>

        <div className="boot__modes">
          <button
            type="button"
            className="boot__mode"
            data-active={!prefs.demo}
            onClick={() => setPrefs((p) => ({ ...p, demo: false }))}
          >
            <Camera aria-hidden />
            <span>
              <strong>Cameră reală</strong>
              <small>{secureContext ? "Camera frontală a tabletei" : "Necesită HTTPS — va porni simularea"}</small>
            </span>
          </button>
          <button
            type="button"
            className="boot__mode"
            data-active={prefs.demo}
            onClick={() => setPrefs((p) => ({ ...p, demo: true }))}
          >
            <MonitorSmartphone aria-hidden />
            <span>
              <strong>Mod demonstrativ</strong>
              <small>Imagine simulată, fără cameră</small>
            </span>
          </button>
        </div>

        <div className="boot__options">
          <label className="boot__option" data-disabled={!fullscreenSupported}>
            <input
              type="checkbox"
              checked={prefs.fullscreen && fullscreenSupported}
              disabled={!fullscreenSupported}
              onChange={() => toggle("fullscreen")}
            />
            <span>Ecran complet{!fullscreenSupported && " (instalați ca aplicație)"}</span>
          </label>
          <label className="boot__option" data-disabled={!wakeLockSupported}>
            <input
              type="checkbox"
              checked={prefs.wakeLock && wakeLockSupported}
              disabled={!wakeLockSupported}
              onChange={() => toggle("wakeLock")}
            />
            <span>Menține ecranul aprins{!wakeLockSupported && " (nesuportat)"}</span>
          </label>
        </div>

        <button type="button" className="boot__start" onClick={() => onStart(prefs)}>
          <Power aria-hidden />
          Pornește interfonul
        </button>

        <p className="boot__hint">
          Panou regizor: <code>{controlUrl}</code>
          <br />
          Meniu tehnic: țineți apăsat pe sigla „Palatul Regal” 3 secunde.
        </p>
      </div>
    </div>
  );
}
