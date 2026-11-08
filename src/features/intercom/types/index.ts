/**
 * Core domain types for the Dochița intercom.
 *
 * The intercom state is fully serialisable so it can be persisted locally,
 * mirrored to the operator console and restored after a reload.
 */

/** Visual state of the illuminated ring around the camera lens. */
export type LedMode =
  | "off"
  | "idle"
  | "active"
  | "scanning"
  | "failed"
  | "verifying"
  | "success"
  | "unlocked";

/** Sound cues the device can emit. */
export type SoundId =
  | "key"
  | "cameraOn"
  | "scan"
  | "failure"
  | "success"
  | "denied"
  | "unlock";

/** Semantic tone of a message — drives colour on the display. */
export type Tone = "neutral" | "info" | "warning" | "error" | "success";

/** Icon shown in the information panel (mapped to Lucide icons in the UI). */
export type SceneIcon =
  | "shield"
  | "scan"
  | "faceX"
  | "sparkles"
  | "crown"
  | "approach"
  | "arrowLeft"
  | "smile"
  | "question"
  | "xCircle"
  | "checkCircle"
  | "eye"
  | "rotate"
  | "fingerprint"
  | "phone"
  | "hourglass"
  | "unlock"
  | "idCard"
  | "angry"
  | "battery"
  | "hammer"
  | "door"
  | "doorOpen"
  | "receipt"
  | "megaphone";

/** Guidance cue rendered on top of the live video. */
export type VideoCue =
  | "none"
  | "approach"
  | "left"
  | "otherLeft"
  | "crown"
  | "wipe"
  | "smile"
  | "blink"
  | "turnHead"
  | "listen";

/** Behaviour of the tracking frame drawn around the subject. */
export type TrackingMode = "hidden" | "searching" | "locked" | "rejected" | "verified";

export type KeypadMode = "apartment" | "code";

export interface OverlayConfig {
  /** Oval face-alignment guide. */
  guides: boolean;
  /** Animated horizontal scan line. */
  scanning: boolean;
  tracking: TrackingMode;
  cue: VideoCue;
  /** Label above the tracking frame, e.g. "SUBIECT NEIDENTIFICAT". */
  trackingLabel?: string;
}

/** Screenplay scene the beat belongs to (Sc. 2 = palace entrance, Sc. 3 = inside the palace). */
export type ScreenplayScene = 2 | 3;

export interface SceneDefinition {
  id: SceneId;
  scene: ScreenplayScene;
  /** Short operator-facing label. */
  label: string;
  /**
   * What happens on set right before this beat (the King's line or a stage
   * direction from the screenplay). Shown to the operator as the trigger.
   */
  cue: string;
  /**
   * Dochița's line exactly as in the screenplay (diacritics corrected).
   * Spoken live by the voice actor; the display shows it as text.
   * Undefined for silent beats.
   */
  line?: string;
  /**
   * The joke inside `line`. It must only be heard (voice), never read on the
   * screen first: the display updates a beat before the voice speaks.
   */
  punchline?: string;
  /** Display used when the operator switches "Text pe ecran" to full. */
  full?: ScreenText;
  /** Small uppercase status line at the top of the information panel. */
  status: string;
  title: string;
  subtitle?: string;
  tone: Tone;
  icon: SceneIcon;
  led: LedMode;
  overlay: OverlayConfig;
  /** 0–100, renders a progress bar when defined. */
  progress?: number;
  /** Number of remaining attempts to show as indicator dots. */
  attempts?: { total: number; remaining: number };
  keypad: KeypadMode;
  /** Sound played when entering the scene, if automatic sounds are on. */
  sound?: SoundId;
  /** Whether the camera feed is visible (dimmed in standby). */
  cameraDimmed?: boolean;
}

export interface ScreenText {
  status?: string;
  title: string;
  subtitle?: string;
}

/** short = filming default (statuses/instructions only); full = Dochița's whole line. */
export type ScreenTextMode = "short" | "full";

export type SceneId =
  // Scene 2 — palace entrance
  | "standby"
  | "activation"
  | "faceRejected"
  | "lensWiped"
  | "occupation"
  | "removeCrown"
  | "approach"
  | "moveLeft"
  | "otherLeft"
  | "smile"
  | "noThreats"
  | "securityQuestion"
  | "wrongAnswer"
  | "correctAnswer"
  | "blink"
  | "turnHead"
  | "noHead"
  | "almostConfirmed"
  | "chargePhone"
  | "codeLoop"
  | "repairCost"
  | "knocking"
  // Scene 3 — the door opens, then inside the palace
  | "unlocked"
  | "exitRequest"
  | "queenConfirm"
  | "importTax"
  | "statementPublished";

export interface MessageOverride {
  status?: string;
  title: string;
  subtitle?: string;
  tone: Tone;
}

export type EffectKind = "scan" | "success" | "failure";

export interface TransientEffect {
  kind: EffectKind;
  id: number;
}

export interface KeypadFeedback {
  id: number;
  tone: Tone;
  text: string;
}

export interface KeypadState {
  input: string;
  feedback: KeypadFeedback | null;
  failedCodeAttempts: number;
}

export interface IntercomSettings {
  /** Master mute — silences everything. */
  muted: boolean;
  /** Play scene / effect sounds automatically. */
  autoSound: boolean;
  /** Boost LED and display brightness for bright sets. */
  highBrightness: boolean;
  /** If true, entering `unlockCode` on the keypad opens the door. Off by default. */
  keypadUnlockEnabled: boolean;
  unlockCode: string;
  /** What the display shows for spoken lines. Filming default: "short". */
  screenText: ScreenTextMode;
  /**
   * screen   = the tablet itself is the intercom: full-screen display UI (default)
   * hardware = drawn device housing with lens, keys and grille
   */
  skin: DeviceSkin;
}

export type DeviceSkin = "screen" | "hardware";

export interface IntercomState {
  sceneId: SceneId;
  ledPower: boolean;
  /** When set, replaces the scene's LED mode. */
  ledOverride: LedMode | null;
  messageOverride: MessageOverride | null;
  effect: TransientEffect | null;
  keypad: KeypadState;
  settings: IntercomSettings;
  /** Monotonic counter, incremented on every change. */
  revision: number;
  /** Counter used to mint ids for transient things. */
  seq: number;
}

export type KeypadKey =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "clear"
  | "confirm"
  | "backspace";

/** Every way the intercom state can change. Sent locally or by the operator. */
export type IntercomCommand =
  | { type: "goto"; sceneId: SceneId }
  | { type: "next" }
  | { type: "prev" }
  | { type: "reset" }
  | { type: "unlock" }
  | { type: "setLedPower"; on: boolean }
  | { type: "setLedOverride"; mode: LedMode | null }
  | { type: "setMessageOverride"; message: MessageOverride | null }
  | { type: "triggerEffect"; kind: EffectKind }
  | { type: "clearEffect"; id: number }
  | { type: "playSound"; sound: SoundId }
  | { type: "setSettings"; settings: Partial<IntercomSettings> }
  | { type: "keypadPress"; key: KeypadKey }
  | { type: "clearKeypadFeedback"; id: number };
