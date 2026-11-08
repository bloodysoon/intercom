import { describe, expect, it } from "vitest";
import { SCENE_IDS, SCENES } from "../constants/scenes";
import type { IntercomCommand, IntercomState } from "../types";
import { createInitialState, deriveSounds, reduce, selectView } from "./state-machine";

const run = (commands: IntercomCommand[], from: IntercomState = createInitialState()) =>
  commands.reduce(reduce, from);

describe("scene definitions", () => {
  it("has unique ids", () => {
    expect(new Set(SCENE_IDS).size).toBe(SCENE_IDS.length);
  });

  it("uses the unlock animation only for the door opening", () => {
    const unlocking = SCENES.filter((s) => s.led === "unlocked").map((s) => s.id);
    expect(unlocking).toEqual(["unlocked"]);
  });
});

describe("scene transitions", () => {
  it("starts in standby", () => {
    expect(createInitialState().sceneId).toBe("standby");
  });

  it("advances one beat at a time with next", () => {
    let state = createInitialState();
    for (let i = 1; i < SCENE_IDS.length; i++) {
      state = reduce(state, { type: "next" });
      expect(state.sceneId).toBe(SCENE_IDS[i]);
    }
  });

  it("does not move past the last scene", () => {
    const end = run([{ type: "goto", sceneId: SCENE_IDS[SCENE_IDS.length - 1] }]);
    expect(reduce(end, { type: "next" })).toBe(end);
  });

  it("does not move before the first scene", () => {
    const start = createInitialState();
    expect(reduce(start, { type: "prev" })).toBe(start);
  });

  it("goes back with prev", () => {
    const state = run([{ type: "goto", sceneId: "smile" }, { type: "prev" }]);
    expect(state.sceneId).toBe("otherLeft");
  });

  it("follows the King's scene in screenplay order", () => {
    let state = run([{ type: "goto", sceneId: "faceRejected" }]);
    const order = [];
    for (let i = 0; i < 5; i++) {
      state = reduce(state, { type: "next" });
      order.push(state.sceneId);
    }
    expect(order).toEqual(["lensWiped", "occupation", "removeCrown", "approach", "moveLeft"]);
  });

  it("continues into Sc. 3 after the door opens", () => {
    const state = run([{ type: "unlock" }, { type: "next" }]);
    expect(state.sceneId).toBe("exitRequest");
    expect(selectView(state).title).toBe("Permiteți ieșirea?");
  });

  it("shows short filming text by default and the full line on request", () => {
    const s = run([{ type: "goto", sceneId: "occupation" }]);
    expect(selectView(s).title).toBe("Identitate neconfirmată");
    const full = reduce(s, { type: "setSettings", settings: { screenText: "full" } });
    expect(selectView(full).title).toBe("Ocupația nu ține loc de identitate.");
    expect(selectView(full).subtitle).toBe("Ieri a venit un domn care era împărat. Vindea covoare.");
  });

  it("jumps directly to any scene", () => {
    for (const id of SCENE_IDS) {
      expect(reduce(createInitialState(), { type: "goto", sceneId: id }).sceneId).toBe(id);
    }
  });

  it("never unlocks on its own while waiting for the phone code", () => {
    let state = run([{ type: "goto", sceneId: "codeLoop" }]);
    for (const key of ["1", "2", "2", "5", "confirm"] as const) {
      state = reduce(state, { type: "keypadPress", key });
    }
    expect(state.sceneId).toBe("codeLoop");
    expect(selectView(state).led).toBe("failed");
  });

  it("unlocks when the operator commands it", () => {
    const state = run([{ type: "goto", sceneId: "codeLoop" }, { type: "unlock" }]);
    expect(state.sceneId).toBe("unlocked");
    expect(selectView(state).title).toBe("Acces permis");
    expect(selectView(state).led).toBe("unlocked");
  });

  it("increments revision on every change", () => {
    const a = createInitialState();
    const b = reduce(a, { type: "next" });
    expect(b.revision).toBe(a.revision + 1);
  });

  it("clears custom message and keypad input when the scene changes", () => {
    const state = run([
      { type: "setMessageOverride", message: { title: "Test", tone: "info" } },
      { type: "keypadPress", key: "4" },
      { type: "next" },
    ]);
    expect(state.messageOverride).toBeNull();
    expect(state.keypad.input).toBe("");
  });
});

describe("reset", () => {
  const dirty = () =>
    run([
      { type: "goto", sceneId: "codeLoop" },
      { type: "setLedOverride", mode: "success" },
      { type: "setLedPower", on: false },
      { type: "setMessageOverride", message: { title: "X", tone: "error" } },
      { type: "triggerEffect", kind: "failure" },
      { type: "keypadPress", key: "9" },
      { type: "setSettings", settings: { muted: true, highBrightness: true, autoSound: false } },
    ]);

  it("returns to standby with all overrides cleared", () => {
    const state = reduce(dirty(), { type: "reset" });
    expect(state.sceneId).toBe("standby");
    expect(state.ledOverride).toBeNull();
    expect(state.ledPower).toBe(true);
    expect(state.messageOverride).toBeNull();
    expect(state.effect).toBeNull();
    expect(state.keypad.input).toBe("");
    expect(state.keypad.failedCodeAttempts).toBe(0);
  });

  it("keeps crew settings between takes", () => {
    const state = reduce(dirty(), { type: "reset" });
    expect(state.settings).toMatchObject({ muted: true, highBrightness: true, autoSound: false });
  });

  it("still advances the revision so remote panels update", () => {
    const before = dirty();
    expect(reduce(before, { type: "reset" }).revision).toBeGreaterThan(before.revision);
  });

  it("is idempotent in visible result", () => {
    const once = reduce(dirty(), { type: "reset" });
    const twice = reduce(once, { type: "reset" });
    expect(selectView(twice)).toEqual(selectView(once));
  });
});

describe("operator commands", () => {
  it("turns the LED ring off and on", () => {
    const off = reduce(createInitialState(), { type: "setLedPower", on: false });
    expect(selectView(off).led).toBe("off");
    expect(selectView(reduce(off, { type: "setLedPower", on: true })).led).toBe("idle");
  });

  it("overrides the LED colour regardless of scene", () => {
    const state = run([{ type: "setLedOverride", mode: "success" }, { type: "goto", sceneId: "faceRejected" }]);
    expect(selectView(state).led).toBe("success");
    expect(selectView(reduce(state, { type: "setLedOverride", mode: null })).led).toBe("failed");
  });

  it("shows a custom message", () => {
    const state = reduce(createInitialState(), {
      type: "setMessageOverride",
      message: { title: "Majestatea Voastră?", subtitle: "Confirmați", tone: "warning" },
    });
    const view = selectView(state);
    expect(view.title).toBe("Majestatea Voastră?");
    expect(view.subtitle).toBe("Confirmați");
    expect(view.isCustomMessage).toBe(true);
  });

  it("triggers transient effects that colour the LED and can be cleared by id", () => {
    const fx = reduce(createInitialState(), { type: "triggerEffect", kind: "failure" });
    expect(fx.effect?.kind).toBe("failure");
    expect(selectView(fx).led).toBe("failed");
    const id = fx.effect!.id;
    expect(reduce(fx, { type: "clearEffect", id: id + 1 })).toBe(fx);
    expect(reduce(fx, { type: "clearEffect", id }).effect).toBeNull();
  });

  it("updates settings partially", () => {
    const state = reduce(createInitialState(), { type: "setSettings", settings: { highBrightness: true } });
    expect(state.settings.highBrightness).toBe(true);
    expect(state.settings.autoSound).toBe(true);
  });
});

describe("sounds", () => {
  const s0 = createInitialState();

  it("plays the scene cue when entering a scene", () => {
    const next = reduce(s0, { type: "goto", sceneId: "faceRejected" });
    expect(deriveSounds(s0, next, { type: "goto", sceneId: "faceRejected" })).toEqual(["failure"]);
  });

  it("plays the unlock sound when the door opens", () => {
    const cmd: IntercomCommand = { type: "unlock" };
    expect(deriveSounds(s0, reduce(s0, cmd), cmd)).toEqual(["unlock"]);
  });

  it("skips automatic cues when auto sound is off, but honours explicit ones", () => {
    const quiet = reduce(s0, { type: "setSettings", settings: { autoSound: false } });
    const goto: IntercomCommand = { type: "goto", sceneId: "faceRejected" };
    expect(deriveSounds(quiet, reduce(quiet, goto), goto)).toEqual([]);
    const play: IntercomCommand = { type: "playSound", sound: "success" };
    expect(deriveSounds(quiet, reduce(quiet, play), play)).toEqual(["success"]);
  });

  it("is completely silent when muted", () => {
    const muted = reduce(s0, { type: "setSettings", settings: { muted: true } });
    for (const cmd of [
      { type: "playSound", sound: "unlock" },
      { type: "keypadPress", key: "1" },
      { type: "unlock" },
    ] as IntercomCommand[]) {
      expect(deriveSounds(muted, reduce(muted, cmd), cmd)).toEqual([]);
    }
  });
});
