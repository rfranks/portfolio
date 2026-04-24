const supportsColor =
  Boolean(process.stdout.isTTY) && !("NO_COLOR" in process.env) && process.env.TERM !== "dumb";

const supportsEmoji = !("NO_EMOJI" in process.env) && process.env.CI !== "true";

const ansi = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
} as const;

type AnsiKey = keyof typeof ansi;

const glyphs = {
  section: "🧭",
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  chart: "📊",
  sparkle: "✨",
};

function styleText(text: string, styles: AnsiKey[] = []): string {
  if (!supportsColor || styles.length === 0) {
    return text;
  }

  const prefix = styles.map((style) => ansi[style]).join("");
  return `${prefix}${text}${ansi.reset}`;
}

function icon(symbol: string, fallback = "*"): string {
  return supportsEmoji ? symbol : fallback;
}

function line(label: string, message: string, styles: AnsiKey[] = []): string {
  return `${styleText(label, styles)} ${message}`;
}

export function createCliOutput(prefix?: string) {
  const withPrefix = (message: string) => (prefix ? `${prefix} ${message}` : message);

  return {
    section: (message: string) =>
      console.log(
        withPrefix(line(`${icon(glyphs.section, "#")} SECTION`, message, ["bold", "magenta"])),
      ),
    info: (message: string) =>
      console.log(withPrefix(line(`${icon(glyphs.info, "i")} INFO`, message, ["cyan"]))),
    success: (message: string) =>
      console.log(withPrefix(line(`${icon(glyphs.success, "+")} OK`, message, ["green"]))),
    warning: (message: string) =>
      console.warn(withPrefix(line(`${icon(glyphs.warning, "!")} WARN`, message, ["yellow"]))),
    error: (message: string) =>
      console.error(withPrefix(line(`${icon(glyphs.error, "x")} ERROR`, message, ["red"]))),
    metric: (message: string) =>
      console.log(withPrefix(line(`${icon(glyphs.chart, ">")} METRIC`, message, ["bold", "cyan"]))),
    listItem: (message: string) =>
      console.log(withPrefix(`${styleText(icon("•", "-"), ["dim"])} ${message}`)),
    sparkle: (message: string) =>
      console.log(withPrefix(line(`${icon(glyphs.sparkle, "*")} NOTE`, message, ["dim"]))),
  };
}
