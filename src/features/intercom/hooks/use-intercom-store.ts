"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { readJson, writeJson } from "@/shared/lib/storage";
import { createInitialState } from "../lib/state-machine";
import { createIntercomStore, type IntercomStore } from "../lib/store";
import { parseState } from "../lib/validation";
import type { IntercomCommand, IntercomState } from "../types";

const STORAGE_KEY = "dochita.intercom.state.v1";

const EFFECT_DURATION_MS = { scan: 2600, success: 2000, failure: 2000 } as const;
const FEEDBACK_DURATION_MS = 3200;

/**
 * Owns the intercom state on the tablet: restores it after a reload (so a
 * crash or accidental refresh mid-take comes back on the same beat), persists
 * every change and expires transient effects.
 */
export function useIntercomStore() {
  const [store] = useState<IntercomStore>(() =>
    createIntercomStore(parseState(readJson(STORAGE_KEY)) ?? createInitialState()),
  );
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  const dispatch = useCallback(
    (command: IntercomCommand) => {
      store.dispatch(command);
    },
    [store],
  );

  // Persist.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const save = () => writeJson(STORAGE_KEY, store.getState());
    const unsubscribe = store.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, 150);
    });
    window.addEventListener("pagehide", save);
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [store]);

  // Expire transient effect.
  const effect = state.effect;
  useEffect(() => {
    if (!effect) return;
    const t = setTimeout(() => dispatch({ type: "clearEffect", id: effect.id }), EFFECT_DURATION_MS[effect.kind]);
    return () => clearTimeout(t);
  }, [effect, dispatch]);

  // Expire keypad feedback.
  const feedback = state.keypad.feedback;
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => dispatch({ type: "clearKeypadFeedback", id: feedback.id }), FEEDBACK_DURATION_MS);
    return () => clearTimeout(t);
  }, [feedback, dispatch]);

  return { state, dispatch, store } as {
    state: IntercomState;
    dispatch: (command: IntercomCommand) => void;
    store: IntercomStore;
  };
}
