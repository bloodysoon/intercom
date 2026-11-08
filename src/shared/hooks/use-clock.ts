"use client";

import { useEffect, useState } from "react";

/** Current time, ticking every second. `null` until mounted (avoids hydration mismatch). */
export function useClock(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow(d);
      timer = setTimeout(tick, 1000 - d.getMilliseconds() + 5);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatTime(d: Date, seconds = true): string {
  const base = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return seconds ? `${base}:${pad(d.getSeconds())}` : base;
}

const MONTHS = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];

export function formatDate(d: Date): string {
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
