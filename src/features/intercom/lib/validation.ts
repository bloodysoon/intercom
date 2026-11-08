import { isSceneId } from "../constants/scenes";
import type {
  EffectKind,
  IntercomCommand,
  IntercomSettings,
  IntercomState,
  KeypadKey,
  LedMode,
  MessageOverride,
  SoundId,
  Tone,
} from "../types";
import { createInitialState } from "./state-machine";

/**
 * Runtime guards for data that crosses a trust boundary: messages from the
 * network and state restored from storage. Anything malformed is dropped
 * rather than allowed to crash the display mid-take.
 */

export const LED_MODES: readonly LedMode[] = [
  "off",
  "idle",
  "active",
  "scanning",
  "failed",
  "verifying",
  "success",
  "unlocked",
];
export const SOUND_IDS: readonly SoundId[] = ["key", "cameraOn", "scan", "failure", "success", "denied", "unlock"];
export const TONES: readonly Tone[] = ["neutral", "info", "warning", "error", "success"];
const EFFECTS: readonly EffectKind[] = ["scan", "success", "failure"];
const KEYS: readonly KeypadKey[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "confirm", "backspace"];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);
const str = (v: unknown, max = 200): string | undefined =>
  typeof v === "string" ? v.slice(0, max) : undefined;

function parseMessage(v: unknown): MessageOverride | null | undefined {
  if (v === null) return null;
  if (!isObj(v)) return undefined;
  const title = str(v.title);
  if (!title || !oneOf(TONES, v.tone)) return undefined;
  return { title, subtitle: str(v.subtitle), status: str(v.status), tone: v.tone };
}

function parseSettings(v: unknown): Partial<IntercomSettings> | undefined {
  if (!isObj(v)) return undefined;
  const out: Partial<IntercomSettings> = {};
  for (const key of ["muted", "autoSound", "highBrightness", "keypadUnlockEnabled"] as const) {
    if (typeof v[key] === "boolean") out[key] = v[key];
  }
  if (typeof v.unlockCode === "string" && /^\d{1,6}$/.test(v.unlockCode)) out.unlockCode = v.unlockCode;
  if (v.screenText === "short" || v.screenText === "full") out.screenText = v.screenText;
  if (v.skin === "screen" || v.skin === "hardware") out.skin = v.skin;
  return out;
}

export function parseCommand(v: unknown): IntercomCommand | null {
  if (!isObj(v)) return null;
  switch (v.type) {
    case "next":
    case "prev":
    case "reset":
    case "unlock":
      return { type: v.type };
    case "goto":
      return isSceneId(v.sceneId) ? { type: "goto", sceneId: v.sceneId } : null;
    case "setLedPower":
      return typeof v.on === "boolean" ? { type: "setLedPower", on: v.on } : null;
    case "setLedOverride":
      return v.mode === null || oneOf(LED_MODES, v.mode) ? { type: "setLedOverride", mode: v.mode } : null;
    case "setMessageOverride": {
      const message = parseMessage(v.message);
      return message === undefined ? null : { type: "setMessageOverride", message };
    }
    case "triggerEffect":
      return oneOf(EFFECTS, v.kind) ? { type: "triggerEffect", kind: v.kind } : null;
    case "clearEffect":
      return typeof v.id === "number" ? { type: "clearEffect", id: v.id } : null;
    case "playSound":
      return oneOf(SOUND_IDS, v.sound) ? { type: "playSound", sound: v.sound } : null;
    case "setSettings": {
      const settings = parseSettings(v.settings);
      return settings ? { type: "setSettings", settings } : null;
    }
    case "keypadPress":
      return oneOf(KEYS, v.key) ? { type: "keypadPress", key: v.key } : null;
    case "clearKeypadFeedback":
      return typeof v.id === "number" ? { type: "clearKeypadFeedback", id: v.id } : null;
    default:
      return null;
  }
}

/** Restores a state snapshot, filling gaps with defaults. Returns null if unusable. */
export function parseState(v: unknown): IntercomState | null {
  if (!isObj(v) || !isSceneId(v.sceneId)) return null;
  const base = createInitialState(parseSettings(v.settings));
  const message = parseMessage(v.messageOverride);
  const keypad = isObj(v.keypad) ? v.keypad : {};
  return {
    ...base,
    sceneId: v.sceneId,
    ledPower: typeof v.ledPower === "boolean" ? v.ledPower : true,
    ledOverride: oneOf(LED_MODES, v.ledOverride) ? v.ledOverride : null,
    messageOverride: message ?? null,
    // Transient effects and feedback are never restored.
    effect: null,
    keypad: {
      input: typeof keypad.input === "string" && /^\d{0,6}$/.test(keypad.input) ? keypad.input : "",
      feedback: null,
      failedCodeAttempts: typeof keypad.failedCodeAttempts === "number" ? keypad.failedCodeAttempts : 0,
    },
    revision: typeof v.revision === "number" ? v.revision : 0,
    seq: typeof v.seq === "number" ? v.seq : 0,
  };
}
