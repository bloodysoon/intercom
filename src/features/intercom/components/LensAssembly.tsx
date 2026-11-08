import type { LedMode } from "../types";

interface LensAssemblyProps {
  led: LedMode;
  /** Change this key to replay the lens-wipe reflection. */
  wipeKey?: string | null;
}

/**
 * Camera module: machined bezel, LED diffuser ring, recessed dark glass,
 * flanked by an IR emitter and ambient-light sensor.
 */
export function LensAssembly({ led, wipeKey }: LensAssemblyProps) {
  return (
    <div className="area-lens lens-row" aria-hidden>
      <span className="sensor-dot" />
      <div className="lens" data-led={led}>
        <div className="lens__halo" />
        <div className="lens__bezel">
          <div className="lens__ring">
            <div className="lens__sweep" />
          </div>
          <div className="lens__inner">
            <div className="lens__glass">
              <span className="lens__glint" />
              {wipeKey && <span key={wipeKey} className="lens__wipe" />}
            </div>
          </div>
        </div>
      </div>
      <span className="sensor-dot sensor-dot--light" />
    </div>
  );
}
