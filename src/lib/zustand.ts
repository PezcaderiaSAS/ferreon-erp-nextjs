'use client';

import { useSyncExternalStore } from 'react';

export type StateCreator<T> = (
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T
) => T;

export interface PersistOptions<T> {
  name: string;
  partialize?: (state: T) => any;
  storage?: any;
}

export function persist<T>(
  config: StateCreator<T>,
  options: PersistOptions<T>
): StateCreator<T> {
  return (set, get) => {
    let initialSavedState: any = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const item = localStorage.getItem(options.name);
        if (item) {
          const parsed = JSON.parse(item);
          initialSavedState = parsed.state || parsed;
        }
      } catch (err) {
        console.warn(`[persist] Error loading ${options.name}:`, err);
      }
    }

    const state = config(
      (partial) => {
        set(partial);
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const currentState = get();
            const toSave = options.partialize ? options.partialize(currentState) : currentState;
            localStorage.setItem(options.name, JSON.stringify({ state: toSave }));
          } catch (err) {
            console.warn(`[persist] Error saving ${options.name}:`, err);
          }
        }
      },
      get
    );

    if (initialSavedState && typeof initialSavedState === 'object') {
      return { ...state, ...initialSavedState };
    }

    return state;
  };
}

export function createJSONStorage(getStorage: () => Storage) {
  return {
    getItem: (name: string) => (typeof window !== 'undefined' ? getStorage().getItem(name) : null),
    setItem: (name: string, value: string) => {
      if (typeof window !== 'undefined') getStorage().setItem(name, value);
    },
    removeItem: (name: string) => {
      if (typeof window !== 'undefined') getStorage().removeItem(name);
    }
  };
}

export function create<T>() {
  return (initializer: StateCreator<T>) => {
    let state: T;
    const listeners = new Set<() => void>();

    const getState = () => state;

    const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
      const nextPartial = typeof partial === 'function' ? (partial as any)(state) : partial;
      if (nextPartial !== null && typeof nextPartial === 'object') {
        const nextState = Object.assign({}, state, nextPartial);
        if (nextState !== state) {
          state = nextState;
          listeners.forEach((listener) => {
            try {
              listener();
            } catch (err) {
              console.error('[Store] Error in listener:', err);
            }
          });
        }
      }
    };

    const subscribe = (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    // Initialize state
    state = initializer(setState, getState);

    // Create the hook
    const useStore = Object.assign(
      function useStoreHook<U = T>(selector?: (state: T) => U): U {
        const slice = useSyncExternalStore(
          subscribe,
          () => (selector ? selector(state) : (state as any)),
          () => (selector ? selector(state) : (state as any))
        );
        return slice;
      },
      {
        getState,
        setState,
        subscribe
      }
    );

    return useStore;
  };
}
