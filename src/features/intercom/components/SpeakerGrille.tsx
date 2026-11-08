import { Indicator } from "./hardware/Indicator";

/** Speaker perforations, microphone port and door-lock indicator. */
export function SpeakerGrille({ unlocked }: { unlocked: boolean }) {
  return (
    <div className="area-grille grille-row">
      <Indicator label={unlocked ? "DESCHIS" : "ÎNCUIAT"} color={unlocked ? "green" : "red"} />
      <div className="grille" aria-hidden />
      <span className="indicator">
        <span className="mic-hole" aria-hidden />
        <span>MIC</span>
      </span>
    </div>
  );
}
