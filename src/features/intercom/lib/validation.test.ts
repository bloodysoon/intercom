import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "./state-machine";
import { parseCommand, parseState } from "./validation";

describe("parseCommand", () => {
  it("accepts well-formed operator commands", () => {
    expect(parseCommand({ type: "next" })).toEqual({ type: "next" });
    expect(parseCommand({ type: "goto", sceneId: "smile" })).toEqual({ type: "goto", sceneId: "smile" });
    expect(parseCommand({ type: "setLedOverride", mode: null })).toEqual({ type: "setLedOverride", mode: null });
    expect(parseCommand({ type: "playSound", sound: "unlock" })).toEqual({ type: "playSound", sound: "unlock" });
  });

  it("rejects malformed or unknown commands", () => {
    expect(parseCommand(null)).toBeNull();
    expect(parseCommand("next")).toBeNull();
    expect(parseCommand({ type: "selfDestruct" })).toBeNull();
    expect(parseCommand({ type: "goto", sceneId: "nowhere" })).toBeNull();
    expect(parseCommand({ type: "setLedOverride", mode: "purple" })).toBeNull();
    expect(parseCommand({ type: "setMessageOverride", message: { title: 5, tone: "info" } })).toBeNull();
  });

  it("filters invalid settings fields", () => {
    expect(
      parseCommand({ type: "setSettings", settings: { muted: true, unlockCode: "abc", highBrightness: "yes" } }),
    ).toEqual({ type: "setSettings", settings: { muted: true } });
    expect(parseCommand({ type: "setSettings", settings: { screenText: "full" } })).toEqual({
      type: "setSettings",
      settings: { screenText: "full" },
    });
    expect(parseCommand({ type: "setSettings", settings: { screenText: "huge" } })).toEqual({
      type: "setSettings",
      settings: {},
    });
  });
});

describe("parseState", () => {
  it("round-trips a real state, dropping transient effects", () => {
    const state = reduce(reduce(createInitialState(), { type: "goto", sceneId: "blink" }), {
      type: "triggerEffect",
      kind: "scan",
    });
    const restored = parseState(JSON.parse(JSON.stringify(state)));
    expect(restored?.sceneId).toBe("blink");
    expect(restored?.effect).toBeNull();
    expect(restored?.revision).toBe(state.revision);
  });

  it("returns null for garbage", () => {
    expect(parseState(undefined)).toBeNull();
    expect(parseState({ sceneId: "x" })).toBeNull();
  });
});
