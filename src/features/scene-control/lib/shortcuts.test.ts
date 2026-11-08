import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "@/features/intercom/lib/state-machine";
import { commandForKey } from "./shortcuts";

const k = (key: string, mods: Partial<{ shiftKey: boolean; metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({
  key,
  shiftKey: false,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...mods,
});

describe("operator keyboard shortcuts", () => {
  const state = createInitialState();

  it("advances with arrow, space and clicker keys", () => {
    for (const key of ["ArrowRight", " ", "PageDown"]) expect(commandForKey(k(key), state)).toEqual({ type: "next" });
    for (const key of ["ArrowLeft", "PageUp"]) expect(commandForKey(k(key), state)).toEqual({ type: "prev" });
  });

  it("requires Shift for reset so it is never hit by accident", () => {
    expect(commandForKey(k("r"), state)).toBeNull();
    expect(commandForKey(k("R", { shiftKey: true }), state)).toEqual({ type: "reset" });
  });

  it("ignores shortcuts with system modifiers", () => {
    expect(commandForKey(k("r", { metaKey: true, shiftKey: true }), state)).toBeNull();
    expect(commandForKey(k("ArrowRight", { ctrlKey: true }), state)).toBeNull();
  });

  it("toggles relative to the intercom's current state", () => {
    expect(commandForKey(k("l"), state)).toEqual({ type: "setLedPower", on: false });
    const off = reduce(state, { type: "setLedPower", on: false });
    expect(commandForKey(k("l"), off)).toEqual({ type: "setLedPower", on: true });
    expect(commandForKey(k("m"), state)).toEqual({ type: "setSettings", settings: { muted: true } });
  });

  it("maps effect and unlock keys", () => {
    expect(commandForKey(k("u"), state)).toEqual({ type: "unlock" });
    expect(commandForKey(k("s"), state)).toEqual({ type: "triggerEffect", kind: "scan" });
    expect(commandForKey(k("g"), state)).toEqual({ type: "triggerEffect", kind: "success" });
    expect(commandForKey(k("f"), state)).toEqual({ type: "triggerEffect", kind: "failure" });
  });
});
