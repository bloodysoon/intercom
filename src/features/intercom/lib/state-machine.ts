import { getScene, INITIAL_SCENE, SCENE_IDS, sceneIndex, UNLOCKED_SCENE } from "../constants/scenes";
import type {
  IntercomCommand,
  IntercomSettings,
  IntercomState,
  LedMode,
  MessageOverride,
  SceneDefinition,
  SceneId,
  Tone,
} from "../types";
import { applyKey, EMPTY_KEYPAD } from "./keypad";

export const DEFAULT_SETTINGS: IntercomSettings = {
  highBrightness: false,
  keypadUnlockEnabled: false,
  unlockCode: "1225",
  screenText: "short",
  skin: "screen",
};

export function createInitialState(settings: Partial<IntercomSettings> = {}): IntercomState {
  return {
    sceneId: INITIAL_SCENE,
    ledPower: true,
    ledOverride: null,
    messageOverride: null,
    effect: null,
    keypad: EMPTY_KEYPAD,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    revision: 0,
    seq: 0,
  };
}

/** Moves to a scene, clearing per-scene transient things. */
function enterScene(state: IntercomState, sceneId: SceneId): IntercomState {
  return {
    ...state,
    sceneId,
    messageOverride: null,
    effect: null,
    keypad: { ...EMPTY_KEYPAD, failedCodeAttempts: state.keypad.failedCodeAttempts },
  };
}

function bump(state: IntercomState): IntercomState {
  return { ...state, revision: state.revision + 1 };
}

/**
 * Pure transition function. Every change to the device goes through here,
 * whether it comes from the keypad, the keyboard or the operator console.
 * Returns the same object reference when nothing changes.
 */
export function reduce(state: IntercomState, command: IntercomCommand): IntercomState {
  switch (command.type) {
    case "goto": {
      if (!SCENE_IDS.includes(command.sceneId)) return state;
      return bump(enterScene(state, command.sceneId));
    }
    case "next": {
      const i = sceneIndex(state.sceneId);
      if (i >= SCENE_IDS.length - 1) return state;
      return bump(enterScene(state, SCENE_IDS[i + 1]));
    }
    case "prev": {
      const i = sceneIndex(state.sceneId);
      if (i <= 0) return state;
      return bump(enterScene(state, SCENE_IDS[i - 1]));
    }
    case "reset": {
      const fresh = createInitialState(state.settings);
      return { ...fresh, revision: state.revision + 1, seq: state.seq };
    }
    case "unlock": {
      return bump(enterScene(state, UNLOCKED_SCENE));
    }
    case "setLedPower": {
      if (state.ledPower === command.on) return state;
      return bump({ ...state, ledPower: command.on });
    }
    case "setLedOverride": {
      if (state.ledOverride === command.mode) return state;
      return bump({ ...state, ledOverride: command.mode });
    }
    case "setMessageOverride": {
      return bump({ ...state, messageOverride: command.message });
    }
    case "triggerEffect": {
      const id = state.seq + 1;
      return bump({ ...state, seq: id, effect: { kind: command.kind, id } });
    }
    case "clearEffect": {
      if (!state.effect || state.effect.id !== command.id) return state;
      return bump({ ...state, effect: null });
    }
    case "setSettings": {
      return bump({ ...state, settings: { ...state.settings, ...command.settings } });
    }
    case "keypadPress": {
      const scene = getScene(state.sceneId);
      const result = applyKey(state.keypad.input, command.key, scene.keypad, state.settings);
      const failedCodeAttempts = state.keypad.failedCodeAttempts + (result.failedCodeAttempt ? 1 : 0);

      if (result.outcome.kind === "unlock") {
        const unlocked = enterScene(state, UNLOCKED_SCENE);
        return bump({ ...unlocked, keypad: { ...unlocked.keypad, failedCodeAttempts } });
      }

      let seq = state.seq;
      let feedback = state.keypad.feedback;
      if (result.outcome.kind === "feedback") {
        seq += 1;
        feedback = { id: seq, tone: result.outcome.tone, text: result.outcome.text };
      } else if (command.key !== "confirm") {
        // Typing again dismisses an old message.
        feedback = null;
      }

      return bump({
        ...state,
        seq,
        keypad: { input: result.input, feedback, failedCodeAttempts },
      });
    }
    case "clearKeypadFeedback": {
      if (!state.keypad.feedback || state.keypad.feedback.id !== command.id) return state;
      return bump({ ...state, keypad: { ...state.keypad, feedback: null } });
    }
  }
}

export interface IntercomView {
  scene: SceneDefinition;
  led: LedMode;
  status: string;
  title: string;
  subtitle?: string;
  tone: Tone;
  isCustomMessage: boolean;
}

const EFFECT_LED: Record<"scan" | "success" | "failure", LedMode> = {
  scan: "scanning",
  success: "success",
  failure: "failed",
};

/** What the display should actually show, after overrides and effects. */
export function selectView(state: IntercomState): IntercomView {
  const scene = getScene(state.sceneId);
  let led: LedMode = state.ledOverride ?? scene.led;
  if (state.effect && !state.ledOverride) led = EFFECT_LED[state.effect.kind];
  if (!state.ledPower) led = "off";

  const message: MessageOverride | null = state.messageOverride;
  const text = state.settings.screenText === "full" && scene.full ? { status: scene.status, ...scene.full } : scene;
  return {
    scene,
    led,
    status: message?.status ?? text.status ?? scene.status,
    title: message?.title ?? text.title,
    subtitle: message ? message.subtitle : text.subtitle,
    tone: message?.tone ?? scene.tone,
    isCustomMessage: message !== null,
  };
}
