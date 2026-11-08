import { CircleAlert, CircleCheck, Info, PhoneCall } from "lucide-react";
import { MAX_INPUT_LENGTH } from "../lib/keypad";
import type { IntercomView } from "../lib/state-machine";
import type { KeypadState, Tone } from "../types";
import { SceneIcon } from "./SceneIcon";

interface InfoPanelProps {
  view: IntercomView;
  keypad: KeypadState;
}

const FEEDBACK_ICON: Record<Tone, typeof Info> = {
  neutral: Info,
  info: PhoneCall,
  warning: CircleAlert,
  error: CircleAlert,
  success: CircleCheck,
};

function Footer({ view, keypad }: InfoPanelProps) {
  const { scene } = view;

  if (keypad.feedback) {
    const Icon = FEEDBACK_ICON[keypad.feedback.tone];
    return (
      <div key={keypad.feedback.id} className="feedback" data-tone={keypad.feedback.tone}>
        <Icon size="1.2em" strokeWidth={2.4} aria-hidden />
        {keypad.feedback.text}
      </div>
    );
  }

  if (scene.keypad === "code") {
    const len = MAX_INPUT_LENGTH.code;
    return (
      <div className="entry">
        <span className="entry__label">Cod</span>
        <div className="entry__slots">
          {Array.from({ length: len }, (_, i) => (
            <span
              key={i}
              className="entry__slot"
              data-filled={i < keypad.input.length}
              data-cursor={i === keypad.input.length}
            >
              {i < keypad.input.length ? "•" : ""}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (keypad.input.length > 0) {
    return (
      <div className="entry">
        <span className="entry__label">Apartament</span>
        <span className="entry__value">
          {keypad.input}
          <span className="entry__caret" />
        </span>
      </div>
    );
  }

  if (scene.progress !== undefined) {
    return (
      <div className="progress">
        <div className="progress__labels">
          <span>VERIFICARE IDENTITATE</span>
          <span>{scene.progress}%</span>
        </div>
        <div className="progress__track">
          <div className="progress__bar" style={{ width: `${scene.progress}%` }} />
        </div>
      </div>
    );
  }

  // Sc. 3 happens inside the palace: no visitor prompt there.
  if (scene.scene === 3) return null;

  return (
    <div className="entry">
      <span className="entry__label">Introduceți nr. apartamentului și apăsați ✓</span>
    </div>
  );
}

/** Lower part of the display: status, main message, progress / code entry. */
export function InfoPanel({ view, keypad }: InfoPanelProps) {
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

      <div className="info__footer">
        <Footer view={view} keypad={keypad} />
      </div>
    </section>
  );
}
