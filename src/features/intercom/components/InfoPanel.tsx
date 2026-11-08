import { MAX_INPUT_LENGTH } from "../lib/keypad";
import { ACCESS_TEXT, type IntercomView } from "../lib/state-machine";
import type { KeypadState } from "../types";
import { SceneIcon } from "./SceneIcon";

interface InfoPanelProps {
  view: IntercomView;
  keypad: KeypadState;
}

/**
 * Below the message: only the digit boxes while a code is needed or digits
 * are typed. No labels, progress bar ("Verificare identitate"), hints or
 * keypad messages — in any text mode.
 */
function Footer({ view, keypad }: InfoPanelProps) {
  if (view.scene.keypad === "code") {
    return (
      <div className="entry__slots">
        {Array.from({ length: MAX_INPUT_LENGTH.code }, (_, i) => (
          <span key={i} className="entry__slot" data-filled={i < keypad.input.length} data-cursor={i === keypad.input.length}>
            {i < keypad.input.length ? "•" : ""}
          </span>
        ))}
      </div>
    );
  }
  if (keypad.input.length > 0) {
    return (
      <span className="entry__value">
        {keypad.input}
        <span className="entry__caret" />
      </span>
    );
  }
  return null;
}

/**
 * Filming default: only the access state in large letters. The code boxes
 * appear only while digits are needed or typed; a wrong code shows
 * "Acces refuzat" for a moment. No icons, labels or hints.
 */
function MinimalInfo({ view, keypad }: InfoPanelProps) {
  const denied = keypad.feedback?.tone === "error";
  const title = denied ? ACCESS_TEXT.denied : view.title;
  const tone = denied ? "error" : view.tone;
  const showSlots = view.scene.keypad === "code";
  const showDigits = !showSlots && keypad.input.length > 0;

  return (
    <section className="info info--minimal" data-tone={tone} aria-live="polite">
      <div key={`${title}:${keypad.feedback?.id ?? ""}`} className="info__access swap">
        {title || " "}
      </div>
      {(showSlots || showDigits) && (
        <div className="info__footer info__footer--center">
          <Footer view={view} keypad={keypad} />
        </div>
      )}
    </section>
  );
}

/** Lower part of the display: status, main message, progress / code entry. */
export function InfoPanel({ view, keypad }: InfoPanelProps) {
  if (view.minimal) return <MinimalInfo view={view} keypad={keypad} />;
  const { scene } = view;
  const caps = scene.id === "unlocked" && !view.isCustomMessage;
  const swapKey = `${scene.id}:${view.title}:${view.subtitle ?? ""}`;
  const icon = view.isCustomMessage ? (view.tone === "error" ? "xCircle" : view.tone === "success" ? "checkCircle" : "shield") : scene.icon;

  return (
    <section className="info" data-tone={view.tone} aria-live="polite">
      <div className="info__status">
        <span className="info__status-text">
          <span className="info__dot" />
          <span key={view.status} className="swap">
            {view.status}
          </span>
        </span>
        {scene.attempts && (
          <span className="attempts" aria-label={`${scene.attempts.remaining} încercări rămase`}>
            {Array.from({ length: scene.attempts.total }, (_, i) => (
              <span key={i} className="attempts__dot" data-used={i < scene.attempts!.total - scene.attempts!.remaining} />
            ))}
          </span>
        )}
      </div>

      <div className="info__main">
        <div className="info__icon">
          <SceneIcon key={icon} icon={icon} />
        </div>
        <div key={swapKey} className="info__text swap">
          <div className={`info__title${caps ? " info__title--caps" : ""}`}>{view.title}</div>
          {view.subtitle && (
            <div className={`info__subtitle${caps ? " info__title--caps" : ""}`}>{view.subtitle}</div>
          )}
        </div>
      </div>

      {(scene.keypad === "code" || keypad.input.length > 0) && (
        <div className="info__footer">
          <Footer view={view} keypad={keypad} />
        </div>
      )}
    </section>
  );
}
