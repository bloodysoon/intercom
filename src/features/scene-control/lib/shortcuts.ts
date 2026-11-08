import type { IntercomCommand, IntercomState } from "@/features/intercom/types";

export interface Shortcut {
  keys: string;
  label: string;
}

/** Shown in the console legend. */
export const SHORTCUTS: Shortcut[] = [
  { keys: "→ / Space / PgDn", label: "Pasul următor" },
  { keys: "← / PgUp", label: "Pasul anterior" },
  { keys: "Shift + R", label: "Resetare scenă" },
  { keys: "U", label: "Deblochează ușa" },
  { keys: "S", label: "Animație scanare" },
  { keys: "G", label: "Succes" },
  { keys: "F", label: "Eșec" },
  { keys: "L", label: "Inel LED pornit/oprit" },
  { keys: "B", label: "Luminozitate ridicată" },
  { keys: "Esc", label: "Șterge mesajul personalizat" },
];

/**
 * Maps a keyboard event on the console to a command. Pure so it can be tested.
 * PageUp / PageDown make standard presentation clickers work out of the box.
 */
export function commandForKey(
  e: Pick<KeyboardEvent, "key" | "shiftKey" | "metaKey" | "ctrlKey" | "altKey">,
  state: IntercomState | null,
): IntercomCommand | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  switch (e.key) {
    case "ArrowRight":
    case "PageDown":
    case " ":
      return { type: "next" };
    case "ArrowLeft":
    case "PageUp":
      return { type: "prev" };
    case "Escape":
      return { type: "setMessageOverride", message: null };
  }
  switch (e.key.toLowerCase()) {
    case "r":
      return e.shiftKey ? { type: "reset" } : null;
    case "u":
      return { type: "unlock" };
    case "s":
      return { type: "triggerEffect", kind: "scan" };
    case "g":
      return { type: "triggerEffect", kind: "success" };
    case "f":
      return { type: "triggerEffect", kind: "failure" };
    case "l":
      return { type: "setLedPower", on: !(state?.ledPower ?? true) };
    case "b":
      return { type: "setSettings", settings: { highBrightness: !(state?.settings.highBrightness ?? false) } };
    default:
      return null;
  }
}
