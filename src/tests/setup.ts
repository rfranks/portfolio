export {};

process.env.NEXT_PUBLIC_OPENAI_API_KEY =
  process.env.NEXT_PUBLIC_OPENAI_API_KEY || "test-openai-key";

const createStorage = () => {
  const storage: Record<string, string> = {};
  return {
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
  } as const;
};

const localStorageMock = createStorage();
const sessionStorageMock = createStorage();

const g = globalThis as unknown as {
  localStorage: typeof localStorageMock;
  sessionStorage: typeof sessionStorageMock;
  window: {
    localStorage: typeof localStorageMock;
    sessionStorage: typeof sessionStorageMock;
  };
};

g.localStorage = localStorageMock;
g.sessionStorage = sessionStorageMock;
g.window = { localStorage: localStorageMock, sessionStorage: sessionStorageMock };
