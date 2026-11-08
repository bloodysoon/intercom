"use client";

import { useEffect } from "react";
import { getAudioEngine } from "../lib/audio-engine";

/**
 * Unlocks Web Audio on the first touch/click/key anywhere on the page, and
 * resumes it when the page becomes visible again (iOS suspends it).
 */
export function useAudioUnlock(): void {
  useEffect(() => {
    const engine = getAudioEngine();
    const unlock = () => engine.unlock();
    const opts = { capture: true, passive: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    const onVisible = () => {
      if (document.visibilityState === "visible") engine.unlock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pointerdown", unlock, opts);
      window.removeEventListener("keydown", unlock, opts);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
