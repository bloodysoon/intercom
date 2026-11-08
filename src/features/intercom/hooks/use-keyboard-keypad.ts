"use client";

import { useEffect } from "react";
import type { KeypadKey } from "../types";

const KEY_MAP: Record<string, KeypadKey> = {
  Enter: "confirm",
  NumpadEnter: "confirm",
  Escape: "clear",
  Delete: "clear",
  Backspace: "backspace",
};

/** Maps a physical keyboard event to a keypad key (digits, Enter, Esc/Delete, Backspace). */
export function keyFromEvent(e: Pick<KeyboardEvent, "key" | "code">): KeypadKey | null {
  if (/^[0-9]$/.test(e.key)) return e.key as KeypadKey;
  return KEY_MAP[e.key] ?? KEY_MAP[e.code] ?? null;
}

/** External keyboard support for development and for a hidden USB keypad. */
export function useKeyboardKeypad(onKey: (key: KeypadKey) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const key = keyFromEvent(e);
      if (!key) return;
      e.preventDefault();
      if (!e.repeat) onKey(key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKey, enabled]);
}
