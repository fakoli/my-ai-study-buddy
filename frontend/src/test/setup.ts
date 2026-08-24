import '@testing-library/jest-dom/vitest';

// Node ≥22 ships an experimental global `localStorage` that only works with
// --localstorage-file; without it, the getter yields `undefined` and shadows
// jsdom's implementation inside vitest's environment. Guard so the suite
// runs on any modern Node (this machine: Node 26.5.0).
// https://nodejs.org/api/globals.html#localstorage
if (typeof localStorage === 'undefined' || localStorage === null) {
  const store = new Map<string, string>();
  const storage = {
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
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
}

// Same for sessionStorage (used by some API clients).
if (typeof sessionStorage === 'undefined' || sessionStorage === null) {
  const store = new Map<string, string>();
  const storage = {
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
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
}
