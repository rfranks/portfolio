export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const defaultLevel: LogLevel = process.env.NODE_ENV === "production" ? "warn" : "debug";

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

function emit(level: LogLevel, scope: string, message: string, metadata?: unknown): void {
  const tag = `[${scope}]`;

  if (level === "error") {
    console.error(tag, message, metadata ?? "");
    return;
  }

  if (level === "warn") {
    console.warn(tag, message, metadata ?? "");
    return;
  }

  if (level === "info") {
    console.info(tag, message, metadata ?? "");
    return;
  }

  console.debug(tag, message, metadata ?? "");
}

export function createLogger(scope: string, minLevel: LogLevel = defaultLevel) {
  return {
    debug: (message: string, metadata?: unknown) => {
      if (shouldLog("debug", minLevel)) emit("debug", scope, message, metadata);
    },
    info: (message: string, metadata?: unknown) => {
      if (shouldLog("info", minLevel)) emit("info", scope, message, metadata);
    },
    warn: (message: string, metadata?: unknown) => {
      if (shouldLog("warn", minLevel)) emit("warn", scope, message, metadata);
    },
    error: (message: string, metadata?: unknown) => {
      if (shouldLog("error", minLevel)) emit("error", scope, message, metadata);
    },
  };
}
