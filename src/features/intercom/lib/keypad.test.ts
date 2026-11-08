import { describe, expect, it } from "vitest";
import type { IntercomState, KeypadKey } from "../types";
import { applyKey, MAX_INPUT_LENGTH } from "./keypad";
import { createInitialState, reduce } from "./state-machine";

const locked = { keypadUnlockEnabled: false, unlockCode: "1225" };
const open = { keypadUnlockEnabled: true, unlockCode: "1225" };

const press = (state: IntercomState, ...keys: KeypadKey[]) =>
  keys.reduce((s, key) => reduce(s, { type: "keypadPress", key }), state);

describe("applyKey", () => {
  it("appends digits", () => {
    expect(applyKey("12", "3", "apartment", locked).input).toBe("123");
  });

  it("limits input length per mode", () => {
    expect(applyKey("1234", "5", "apartment", locked).input).toBe("1234");
    expect(applyKey("12345", "6", "code", locked).input).toBe("123456");
    expect(applyKey("123456", "7", "code", locked).input).toHaveLength(MAX_INPUT_LENGTH.code);
  });

  it("clears everything with ✕", () => {
    expect(applyKey("1234", "clear", "code", locked).input).toBe("");
  });

  it("removes the last digit with backspace", () => {
    expect(applyKey("123", "backspace", "code", locked).input).toBe("12");
    expect(applyKey("", "backspace", "code", locked).input).toBe("");
  });

  it("asks for input when confirming nothing", () => {
    const r = applyKey("", "confirm", "code", locked);
    expect(r.outcome).toEqual({ kind: "feedback", tone: "warning", text: "Introduceți codul de verificare" });
  });

  it("calls an apartment on confirm", () => {
    const r = applyKey("12", "confirm", "apartment", locked);
    expect(r.input).toBe("");
    expect(r.outcome).toMatchObject({ kind: "feedback", tone: "info" });
    expect(r.outcome.kind === "feedback" && r.outcome.text).toContain("12");
  });

  it("rejects every code while keypad unlock is disabled", () => {
    const r = applyKey("1225", "confirm", "code", locked);
    expect(r.outcome).toMatchObject({ kind: "feedback", tone: "error" });
    expect(r.failedCodeAttempt).toBe(true);
  });

  it("accepts the configured code only when enabled", () => {
    expect(applyKey("1225", "confirm", "code", open).outcome).toEqual({ kind: "unlock" });
    expect(applyKey("0000", "confirm", "code", open).outcome).toMatchObject({ tone: "error" });
  });
});

describe("keypad in the intercom state", () => {
  const atCode = reduce(createInitialState(), { type: "goto", sceneId: "almostConfirmed" });

  it("records typed digits", () => {
    expect(press(atCode, "4", "2").keypad.input).toBe("42");
  });

  it("shows an error and counts failed attempts on a wrong code", () => {
    const s = press(atCode, "1", "1", "confirm");
    expect(s.keypad.feedback?.tone).toBe("error");
    expect(s.keypad.failedCodeAttempts).toBe(1);
    expect(s.sceneId).toBe("almostConfirmed");
  });

  it("dismisses old feedback when typing again", () => {
    const s = press(atCode, "1", "confirm", "2");
    expect(s.keypad.feedback).toBeNull();
    expect(s.keypad.input).toBe("2");
  });

  it("expires feedback only by matching id", () => {
    const s = press(atCode, "confirm");
    const id = s.keypad.feedback!.id;
    expect(reduce(s, { type: "clearKeypadFeedback", id: id + 99 })).toBe(s);
    expect(reduce(s, { type: "clearKeypadFeedback", id }).keypad.feedback).toBeNull();
  });

  it("unlocks via keypad when the operator enabled it", () => {
    const enabled = reduce(atCode, { type: "setSettings", settings: { keypadUnlockEnabled: true } });
    const s = press(enabled, "1", "2", "2", "5", "confirm");
    expect(s.sceneId).toBe("unlocked");
  });

});
