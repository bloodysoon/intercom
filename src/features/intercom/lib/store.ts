import type { IntercomCommand, IntercomState, SoundId } from "../types";
import { deriveSounds, reduce } from "./state-machine";

export interface DispatchResult {
  state: IntercomState;
  changed: boolean;
  sounds: SoundId[];
}

export interface IntercomStore {
  getState(): IntercomState;
  dispatch(command: IntercomCommand): DispatchResult;
  /** Replace the state wholesale (e.g. restore from storage). */
  replace(state: IntercomState): void;
  subscribe(listener: () => void): () => void;
}

/**
 * Minimal synchronous store. Used with `useSyncExternalStore` so dispatches
 * from timers, sockets and touch handlers all see the latest state and
 * sounds can be derived without side effects inside React updaters.
 */
export function createIntercomStore(initial: IntercomState): IntercomStore {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  return {
    getState: () => state,
    dispatch(command) {
      const prev = state;
      const next = reduce(prev, command);
      const sounds = deriveSounds(prev, next, command);
      const changed = next !== prev;
      if (changed) {
        state = next;
        emit();
      }
      return { state: next, changed, sounds };
    },
    replace(next) {
      state = next;
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
