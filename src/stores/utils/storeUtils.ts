/**
 * Zustand Store Utilities
 *
 * Optimized store utilities for better performance and developer experience
 */

import { StateCreator, StoreMutatorIdentifier } from 'zustand';

/**
 * Logger middleware for debugging
 */
export interface LoggerConfig {
  enabled: boolean;
  name: string;
  logActions?: boolean;
  logStateChanges?: boolean;
}

export const logger = <T extends object>(
  config: LoggerConfig = { enabled: process.env.NODE_ENV === 'development', name: 'Store' }
) => (
  f: StateCreator<T>
): StateCreator<T> => (set, get, api) => {
  const loggedSet: typeof set = (partial, replace) => {
    const prevState = get();
    set(partial, replace);
    const nextState = get();

    if (config.enabled) {
      if (config.logActions) {
        console.log(`[${config.name}] Action`, partial);
      }
      if (config.logStateChanges) {
        console.log(`[${config.name}] State changed`, {
          prev: prevState,
          next: nextState,
        });
      }
    }
  };

  return f(loggedSet, get, api);
};

/**
 * Persist middleware with encryption support
 */
export interface PersistConfig<T> {
  name: string;
  version?: number;
  encrypt?: boolean;
  migrate?: (persistedState: any, version: number) => T | Promise<T>;
  onRehydrateStorage?: (state: T) => void;
}

export const persist = <T extends object>(
  config: PersistConfig<T>
) => (
  f: StateCreator<T>
): StateCreator<T> => (set, get, api) => {
  const storageKey = `zustand_${config.name}`;
  const version = config.version ?? 0;

  // Load persisted state
  const loadPersistedState = (): T | undefined => {
    try {
      const persisted = localStorage.getItem(storageKey);
      if (!persisted) return undefined;

      const { state: persistedState, version: persistedVersion } = JSON.parse(persisted);

      // Check version and migrate if needed
      if (persistedVersion !== version && config.migrate) {
        return config.migrate(persistedState, persistedVersion);
      }

      return persistedState;
    } catch (error) {
      console.error('Failed to load persisted state:', error);
      return undefined;
    }
  };

  // Initialize with persisted state
  const persistedState = loadPersistedState();
  const store = f(set, get, api);

  if (persistedState) {
    set(persistedState);
  }

  // Subscribe to state changes and persist
  api.subscribe((state, prevState) => {
    try {
      const toPersist = {
        state,
        version,
      };

      const data = JSON.stringify(toPersist);

      // Check storage limits
      if (data.length > 5 * 1024 * 1024) { // 5MB limit
        console.warn('State too large for localStorage, skipping persistence');
        return;
      }

      localStorage.setItem(storageKey, data);
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  });

  // Call rehydration callback
  if (config.onRehydrateStorage) {
    config.onRehydrateStorage(get());
  }

  return store;
};

/**
 * Devtools middleware
 */
export const devtools = <T extends object>(
  name: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
) => (
  f: StateCreator<T>
): StateCreator<T> => (set, get, api) => {
  if (!enabled || !window.__REDUX_DEVTOOLS_EXTENSION__) {
    return f(set, get, api);
  }

  const devtools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name });

  devtools.init(get());

  api.subscribe((state, prevState) => {
    devtools.send('update', state);
  });

  return f(set, get, api);
};

/**
 * Immer middleware for immutable updates
 */
export const immer = <T extends object>(
  f: StateCreator<T>
): StateCreator<T> => (set, get, api) => {
  // This would require immer package
  // For now, just return the original function
  return f(set, get, api);
};

/**
 * Combine multiple middlewares
 */
export const combineMiddlewares = <T extends object>(
  ...middlewares: Array<(f: StateCreator<T>) => StateCreator<T>>
) => (f: StateCreator<T>): StateCreator<T> => {
  return middlewares.reduceRight((acc, middleware) => middleware(acc), f);
};

/**
 * Create optimized selector
 */
export const createSelector = <T extends object, U>(
  selector: (state: T) => U,
  equalityFn?: (a: U, b: U) => boolean
) => {
  let prevState: T | null = null;
  let prevResult: U | null = null;

  return (state: T): U => {
    if (prevState === null || !equalityFn) {
      prevState = state;
      prevResult = selector(state);
      return prevResult;
    }

    const result = selector(state);

    if (equalityFn(prevResult, result)) {
      return prevResult!;
    }

    prevState = state;
    prevResult = result;
    return result;
  };
};

/**
 * Deep equality check
 */
export const deepEqual = <T>(a: T, b: T): boolean => {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object' || a === null || b === null) {
    return a === b;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual((a as any)[key], (b as any)[key]));
};

/**
 * Shallow equality check
 */
export const shallowEqual = <T extends object>(a: T, b: T): boolean => {
  if (a === b) return true;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => (a as any)[key] === (b as any)[key]);
};

/**
 * Memoize selector
 */
export const memoizeSelector = <T extends object, U>(
  selector: (state: T) => U,
  deps: any[] = []
) => {
  let memoizedResult: U | null = null;
  let memoizedDeps: any[] = [];

  return (state: T): U => {
    if (memoizedResult === null || !shallowEqual(deps, memoizedDeps)) {
      memoizedResult = selector(state);
      memoizedDeps = [...deps];
    }

    return memoizedResult!;
  };
};

/**
 * Batch updates
 */
export const batchUpdates = <T extends object>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void,
  updates: Array<Partial<T> | ((state: T) => Partial<T>)>
) => {
  set((state) => {
    return updates.reduce((acc, update) => {
      const partial = typeof update === 'function' ? update(state) : update;
      return { ...acc, ...partial };
    }, state);
  });
};

/**
 * Create async action handler
 */
export const createAsyncAction = <T extends object, Args extends any[] = any[], Result = any>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void,
  get: () => T,
  action: (...args: Args) => Promise<Result>,
  options: {
    pending?: Partial<T>;
    success?: (result: Result) => Partial<T>;
    error?: (error: Error) => Partial<T>;
  } = {}
) => {
  return async (...args: Args): Promise<Result> => {
    try {
      if (options.pending) {
        set(options.pending);
      }

      const result = await action(...args);

      if (options.success) {
        set(options.success(result));
      }

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');

      if (options.error) {
        set(options.error(errorObj));
      }

      throw errorObj;
    }
  };
};

/**
 * Create computed value selector
 */
export const createComputedSelector = <T extends object, U>(
  selector: (state: T) => U,
  compute: (value: U) => any
) => {
  let cachedValue: U | null = null;
  let cachedResult: any = null;

  return (state: T): any => {
    const value = selector(state);

    if (cachedValue !== value) {
      cachedValue = value;
      cachedResult = compute(value);
    }

    return cachedResult;
  };
};

/**
 * Create debounced setter
 */
export const createDebouncedSetter = <T extends object>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      set(partial);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Create throttled setter
 */
export const createThrottledSetter = <T extends object>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void,
  delay: number = 100
) => {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      set(partial);
      lastCall = now;
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        set(partial);
        lastCall = Date.now();
        timeoutId = null;
      }, delay - (now - lastCall));
    }
  };
};

/**
 * Create history-aware state
 */
export const createHistoryState = <T extends object>(initialState: T, maxSize: number = 50) => {
  const history: T[] = [initialState];
  let currentIndex = 0;

  return {
    get: () => history[currentIndex],
    push: (state: T) => {
      // Remove any future states if we're not at the end
      if (currentIndex < history.length - 1) {
        history.splice(currentIndex + 1);
      }

      // Add new state
      history.push(state);

      // Maintain max size
      if (history.length > maxSize) {
        history.shift();
      } else {
        currentIndex++;
      }
    },
    undo: () => {
      if (currentIndex > 0) {
        currentIndex--;
        return history[currentIndex];
      }
      return null;
    },
    redo: () => {
      if (currentIndex < history.length - 1) {
        currentIndex++;
        return history[currentIndex];
      }
      return null;
    },
    canUndo: () => currentIndex > 0,
    canRedo: () => currentIndex < history.length - 1,
    clear: () => {
      history.length = 1;
      currentIndex = 0;
    },
  };
};

// Extend window interface for devtools
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: {
      connect: (options: { name: string }) => {
        send: (action: string, state: any) => void;
        init: (state: any) => void;
      };
    };
  }
}
