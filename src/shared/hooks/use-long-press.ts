"use client";

import { useCallback, useRef, type PointerEvent } from "react";

/**
 * Returns pointer handlers that fire `onLongPress` after `ms` of continuous
 * pressing. Used for the hidden technician menu so actors can't open it by accident.
 */
export function useLongPress(onLongPress: () => void, ms = 2500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0) return;
      cancel();
      timer.current = setTimeout(() => {
        timer.current = null;
        onLongPress();
      }, ms);
    },
    [cancel, ms, onLongPress],
  );

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  };
}
