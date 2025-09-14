const storage: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => (key in storage ? storage[key] : null),
  setItem: (key: string, value: string) => {
    storage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key of Object.keys(storage)) {
      delete storage[key];
    }
  },
  key: (index: number) => Object.keys(storage)[index] ?? null,
  get length() {
    return Object.keys(storage).length;
  },
};

(globalThis as { localStorage?: typeof localStorageMock }).localStorage =
  localStorageMock;
(globalThis as { window?: { localStorage: typeof localStorageMock } }).window = {
  localStorage: localStorageMock,
};
