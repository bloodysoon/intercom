"use client";

import { useCallback, useEffect, useState } from "react";

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

function fullscreenElement(): Element | null {
  const d = document as FsDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

/** Fullscreen API with WebKit fallback. Must be entered from a user gesture. */
export function useFullscreen() {
  const [supported] = useState(() => {
    if (typeof document === "undefined") return false;
    const d = document as FsDocument;
    const el = document.documentElement as FsElement;
    const canRequest = typeof el.requestFullscreen === "function" || typeof el.webkitRequestFullscreen === "function";
    return canRequest && Boolean(d.fullscreenEnabled ?? d.webkitFullscreenEnabled ?? true);
  });
  // Installed as an app (Home Screen / PWA): already full screen, nothing to do.
  const [standalone] = useState(() => {
    if (typeof window === "undefined") return false;
    const nav = navigator as Navigator & { standalone?: boolean };
    return nav.standalone === true || window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches;
  });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(fullscreenElement() !== null);
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const enter = useCallback(async () => {
    if (fullscreenElement()) return;
    const el = document.documentElement as FsElement;
    try {
      // Call synchronously inside the tap handler — iPad Safari drops the
      // request if anything async runs first.
      if (el.requestFullscreen) await el.requestFullscreen();
      else await el.webkitRequestFullscreen?.();
    } catch {
      // Not allowed (no gesture / unsupported) — stay windowed.
    }
  }, []);

  const exit = useCallback(async () => {
    const d = document as FsDocument;
    try {
      if (!fullscreenElement()) return;
      if (d.exitFullscreen) await d.exitFullscreen();
      else await d.webkitExitFullscreen?.();
    } catch {
      // ignore
    }
  }, []);

  return { supported, standalone, active, enter, exit };
}
