"use client";

import { useEffect } from "react";

/**
 * Registers the offline-capable service worker in production only (it would
 * fight hot reloading in development).
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
