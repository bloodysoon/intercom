/**
 * Storage helpers that never throw (private mode, blocked storage, quota).
 */
type Area = "local" | "session";

function area(kind: Area): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJson(key: string, kind: Area = "local"): unknown {
  try {
    const raw = area(kind)?.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown, kind: Area = "local"): void {
  try {
    area(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function removeKey(key: string, kind: Area = "local"): void {
  try {
    area(kind)?.removeItem(key);
  } catch {
    // ignore
  }
}
