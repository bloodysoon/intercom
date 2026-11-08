"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Screen Wake Lock with automatic re-acquisition when the page becomes
 * visible again (browsers release it on tab switch / screen off).
 * Only requested after an explicit user choice.
 */
export function useWakeLock() {
  const [supported] = useState(() => typeof navigator !== "undefined" && "wakeLock" in navigator);
  const [active, setActive] = useState(false);
  const wanted = useRef(false);
  const sentinel = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!supported || document.visibilityState !== "visible") return;
    try {
      const s = await navigator.wakeLock.request("screen");
      sentinel.current = s;
      setActive(true);
      s.addEventListener("release", () => {
        if (sentinel.current === s) sentinel.current = null;
        setActive(false);
      });
    } catch {
      setActive(false);
    }
  }, [supported]);

  const request = useCallback(async () => {
    wanted.current = true;
    await acquire();
  }, [acquire]);

  const release = useCallback(async () => {
    wanted.current = false;
    try {
      await sentinel.current?.release();
    } catch {
      // ignore
    }
    sentinel.current = null;
    setActive(false);
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && wanted.current && !sentinel.current) void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [acquire]);

  return { supported, active, request, release };
}
