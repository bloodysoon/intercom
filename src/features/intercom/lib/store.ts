import type { IntercomCommand, IntercomState } from "../types";
import { reduce } from "./state-machine";

export interface DispatchResult {
  state: IntercomState;
  changed: boolean;
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
 * from timers, sockets and touch handlers all see the latest state.
 */
export function createIntercomStore(initial: IntercomState): IntercomStore {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  return {
    getState: () => state,
    dispatch(command) {
      const next = reduce(state, command);
      const changed = next !== state;
      if (changed) {
        state = next;
        emit();
      }
      return { state: next, changed };
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
