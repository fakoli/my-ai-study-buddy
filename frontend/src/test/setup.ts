import '@testing-library/jest-dom/vitest';

// Node ≥22 ships an experimental global `localStorage` that only works with
// --localstorage-file; without it, the getter yields `undefined` and shadows
// jsdom's implementation inside vitest's environment. Guard so the suite
// runs on any modern Node (this machine: Node 26.5.0).
// https://nodejs.org/api/globals.html#localstorage
function makeStorage(store = new Map<string, string>()): Storage {
  return {
    get length() {
      return store.size;
    },
    key(index: number): string | null {
      return [...store.keys()][index] ?? null;
    },
    getItem(key: string): string | null {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
  };
}

function installGlobalStorage(globalName: 'localStorage' | 'sessionStorage'): void {
  if (
    typeof (globalThis as Record<string, unknown>)[globalName] === 'undefined' ||
    (globalThis as Record<string, unknown>)[globalName] === null
  ) {
    Object.defineProperty(globalThis, globalName, {
      value: makeStorage(),
      configurable: true,
      writable: true,
    });
  }
}

installGlobalStorage('localStorage');
installGlobalStorage('sessionStorage');
