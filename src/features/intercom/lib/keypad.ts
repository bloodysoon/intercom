import type { IntercomSettings, KeypadKey, KeypadMode, KeypadState, Tone } from "../types";

export const MAX_INPUT_LENGTH: Record<KeypadMode, number> = {
  apartment: 4,
  code: 6,
};

export const EMPTY_KEYPAD: KeypadState = {
  input: "",
  feedback: null,
  failedCodeAttempts: 0,
};

export type KeypadOutcome =
  | { kind: "none" }
  | { kind: "feedback"; tone: Tone; text: string }
  | { kind: "unlock" };

export interface KeypadResult {
  input: string;
  outcome: KeypadOutcome;
  failedCodeAttempt: boolean;
}

/**
 * Pure keypad logic. Takes the current input and a key, returns the new input
 * and what the device should do about it.
 *
 * The door is never opened from the keypad unless the operator explicitly
 * enables `keypadUnlockEnabled` — the script requires the device to keep
 * waiting for a code that never arrives.
 */
export function applyKey(
  input: string,
  key: KeypadKey,
  mode: KeypadMode,
  settings: Pick<IntercomSettings, "keypadUnlockEnabled" | "unlockCode">,
): KeypadResult {
  const none: KeypadOutcome = { kind: "none" };

  if (key === "clear") {
    return { input: "", outcome: none, failedCodeAttempt: false };
  }

  if (key === "backspace") {
    return { input: input.slice(0, -1), outcome: none, failedCodeAttempt: false };
  }

  if (key === "confirm") {
    if (input.length === 0) {
      return {
        input,
        outcome: {
          kind: "feedback",
          tone: "warning",
          text: mode === "code" ? "Introduceți codul de verificare" : "Introduceți numărul apartamentului",
        },
        failedCodeAttempt: false,
      };
    }

    if (mode === "code") {
      if (settings.keypadUnlockEnabled && input === settings.unlockCode) {
        return { input: "", outcome: { kind: "unlock" }, failedCodeAttempt: false };
      }
      return {
        input: "",
        outcome: { kind: "feedback", tone: "error", text: "Cod incorect. Accesul este refuzat" },
        failedCodeAttempt: true,
      };
    }

    return {
      input: "",
      outcome: { kind: "feedback", tone: "info", text: `Se apelează apartamentul ${input}…` },
      failedCodeAttempt: false,
    };
  }

  // Digit
  if (input.length >= MAX_INPUT_LENGTH[mode]) {
    return { input, outcome: none, failedCodeAttempt: false };
  }
  return { input: input + key, outcome: none, failedCodeAttempt: false };
}
