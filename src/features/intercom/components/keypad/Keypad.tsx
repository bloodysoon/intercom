"use client";

import { Check, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import type { KeypadKey } from "../../types";

export const KEY_LAYOUT: { key: KeypadKey; letters?: string }[] = [
  { key: "1", letters: "" },
  { key: "2", letters: "ABC" },
  { key: "3", letters: "DEF" },
  { key: "4", letters: "GHI" },
  { key: "5", letters: "JKL" },
  { key: "6", letters: "MNO" },
  { key: "7", letters: "PQRS" },
  { key: "8", letters: "TUV" },
  { key: "9", letters: "WXYZ" },
  { key: "clear" },
  { key: "0", letters: "+" },
  { key: "confirm" },
];

const LABELS: Partial<Record<KeypadKey, string>> = { clear: "Șterge", confirm: "Confirmă" };

interface KeypadProps {
  onKey: (key: KeypadKey) => void;
  /** Visual press triggered from outside (keyboard). Change `id` to replay. */
  flash?: { key: KeypadKey; id: number } | null;
}

/**
 * Physical-style 3×4 keypad. Acts on pointer-down like real hardware keys
 * (instant response, no double-tap zoom), with a backlight bloom on press.
 */
export function Keypad({ onKey, flash }: KeypadProps) {
  const [pressed, setPressed] = useState<ReadonlySet<KeypadKey>>(new Set());
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setKey = useCallback((key: KeypadKey, down: boolean) => {
    setPressed((prev) => {
      if (prev.has(key) === down) return prev;
      const next = new Set(prev);
      if (down) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!flash) return;
    const key = flash.key === "backspace" ? "clear" : flash.key;
    // Defer so the press state is set outside the effect body.
    const on = setTimeout(() => setKey(key, true), 0);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setKey(key, false), 150);
    return () => clearTimeout(on);
  }, [flash, setKey]);

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  const down = (key: KeypadKey) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setKey(key, true);
    onKey(key);
  };
  const up = (key: KeypadKey) => () => setKey(key, false);

  return (
    <div className="keypad" role="group" aria-label="Tastatură">
      {KEY_LAYOUT.map(({ key, letters }) => {
        const isAction = key === "clear" || key === "confirm";
        return (
          <button
            key={key}
            type="button"
            className={`key${key === "clear" ? " key--clear" : ""}${key === "confirm" ? " key--confirm" : ""}`}
            data-pressed={pressed.has(key)}
            data-key={key}
            aria-label={LABELS[key] ?? key}
            onPointerDown={down(key)}
            onPointerUp={up(key)}
            onPointerCancel={up(key)}
            onLostPointerCapture={up(key)}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => e.preventDefault()}
          >
            <span className="key__glyph">
              {isAction ? (
                key === "clear" ? (
                  <X className="key__icon" aria-hidden />
                ) : (
                  <Check className="key__icon" aria-hidden />
                )
              ) : (
                <>
                  <span className="key__digit">{key}</span>
                  <span className="key__letters">{letters}</span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
