const randomUuid = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `uuid-${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
};

export const v4 = randomUuid;
