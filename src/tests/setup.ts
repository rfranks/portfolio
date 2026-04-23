export {};
import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from "node:util";
import { MessageChannel as NodeMessageChannel } from "node:worker_threads";

jest.mock("next/navigation");
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children?: unknown }) => children ?? null,
}));

expect.extend(toHaveNoViolations);

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

type MessagePortLike = {
  close?: () => void;
  unref?: () => void;
};
const trackedMessagePorts = new Set<MessagePortLike>();

const MessageChannelBase =
  typeof globalThis.MessageChannel === "function"
    ? (globalThis.MessageChannel as unknown as typeof NodeMessageChannel)
    : NodeMessageChannel;

class JestMessageChannel extends MessageChannelBase {
  constructor() {
    super();
    const portOne = (this as { port1?: { unref?: () => void } }).port1;
    const portTwo = (this as { port2?: { unref?: () => void } }).port2;
    // Prevent worker-thread message ports from holding the Jest process open.
    portOne?.unref?.();
    portTwo?.unref?.();
    if (portOne) {
      trackedMessagePorts.add(portOne);
    }
    if (portTwo) {
      trackedMessagePorts.add(portTwo);
    }
  }
}

Object.defineProperty(globalThis, "MessageChannel", {
  configurable: true,
  writable: true,
  value: JestMessageChannel,
});

afterAll(() => {
  trackedMessagePorts.forEach((port) => {
    try {
      port.unref?.();
    } catch {
      // noop
    }
    try {
      port.close?.();
    } catch {
      // noop
    }
  });
  trackedMessagePorts.clear();
});

if (typeof globalThis.TextEncoder === "undefined") {
  Object.defineProperty(globalThis, "TextEncoder", {
    configurable: true,
    writable: true,
    value: NodeTextEncoder,
  });
}

if (typeof globalThis.TextDecoder === "undefined") {
  Object.defineProperty(globalThis, "TextDecoder", {
    configurable: true,
    writable: true,
    value: NodeTextDecoder,
  });
}
