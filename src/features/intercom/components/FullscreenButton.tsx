"use client";

import { Maximize, Share } from "lucide-react";
import { useState } from "react";

interface FullscreenButtonProps {
  supported: boolean;
  onEnter: () => Promise<void>;
}

/**
 * Floating "Ecran complet" button. It disappears as soon as the tablet is in
 * full screen (and comes back if full screen is left). Where the browser has
 * no fullscreen API (iPhone Safari), a tap shows how to install the app
 * from the Home Screen instead, which opens without browser bars.
 */
export function FullscreenButton({ supported, onEnter }: FullscreenButtonProps) {
  const [hint, setHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  if (hint) {
    return (
      <div className="fs-hint" role="dialog" onClick={() => setDismissed(true)}>
        <p>
          Browserul nu permite ecran complet. Apăsați <Share aria-label="Partajare" className="fs-hint__icon" /> →{" "}
          <b>„Adaugă pe ecranul principal”</b>, apoi deschideți Dochița de pe ecranul principal.
        </p>
        <span className="fs-hint__close">Atingeți pentru a închide</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="fs-btn"
      onClick={() => {
        if (supported) void onEnter();
        else setHint(true);
      }}
    >
      <Maximize aria-hidden />
      <span>Ecran complet</span>
    </button>
  );
}
