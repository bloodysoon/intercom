"use client";

import { useEffect } from "react";

/**
 * If anything ever throws during a take, show a calm device-like
 * "restarting" screen and recover automatically — never a browser error.
 */
export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const t = setTimeout(reset, 1500);
    return () => clearTimeout(t);
  }, [reset]);

  return (
    <div className="kiosk" style={{ display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center", color: "#8d97a4", letterSpacing: "0.2em", fontSize: 14, fontWeight: 700 }}>
        DOCHIȚA · REPORNIRE SISTEM…
      </div>
    </div>
  );
}
