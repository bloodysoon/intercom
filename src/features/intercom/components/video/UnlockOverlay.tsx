import { LockOpen } from "lucide-react";

export function UnlockOverlay({ bare = false }: { bare?: boolean }) {
  // Filming mode: green wash only; the panel below says "Acces permis".
  if (bare) return <div className="unlock" aria-hidden />;
  return (
    <div className="unlock" aria-live="assertive">
      <div className="unlock__badge">
        <LockOpen strokeWidth={2.2} aria-hidden />
      </div>
      <div className="unlock__text">ACCES PERMIS</div>
    </div>
  );
}
