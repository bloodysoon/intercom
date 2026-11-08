"use client";

import { useEffect } from "react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const t = setTimeout(reset, 2000);
    return () => clearTimeout(t);
  }, [reset]);

  return (
    <html lang="ro">
      <body style={{ margin: 0, height: "100vh", background: "#000", display: "grid", placeItems: "center" }}>
        <div style={{ color: "#8d97a4", letterSpacing: "0.2em", fontSize: 14, fontWeight: 700, fontFamily: "system-ui" }}>
          DOCHIȚA · REPORNIRE SISTEM…
        </div>
      </body>
    </html>
  );
}
