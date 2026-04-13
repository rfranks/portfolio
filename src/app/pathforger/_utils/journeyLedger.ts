import { JourneyLedgerTone, JourneyLedgerField } from "../_types/journeyLedger";

const journeyLedgerFieldMeta: Record<string, { label: string; emoji: string }> =
  {
    chapter: { label: "Chapter", emoji: "📖" },
    status: { label: "Status", emoji: "🩺" },
    injuries: { label: "Injuries", emoji: "🩹" },
    inventory: { label: "Inventory", emoji: "🎒" },
    resources: { label: "Resources", emoji: "🧰" },
    allies: { label: "Allies", emoji: "🤝" },
    threats: { label: "Threats", emoji: "⚠️" },
    majorChoices: { label: "Major Choices", emoji: "🧭" },
    currentObjective: { label: "Current Objective", emoji: "🎯" },
    location: { label: "Location", emoji: "🗺️" },
    unresolvedMysteries: { label: "Unresolved Mysteries", emoji: "❓" },
    clues: { label: "Clues", emoji: "🔎" },
    state: { label: "State", emoji: "🛡️" },
  };

const journeyLedgerFieldOrder = [
  "chapter",
  "location",
  "state",
  "status",
  "injuries",
  "inventory",
  "resources",
  "allies",
  "threats",
  "majorChoices",
  "currentObjective",
  "unresolvedMysteries",
  "clues",
] as const;

function normalizeJourneyLedgerKey(rawLabel: string): string {
  const normalized = rawLabel
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized === "chapter") {
    return "chapter";
  }
  if (normalized.includes("objective") || normalized === "mission") {
    return "currentObjective";
  }
  if (normalized.includes("major choice") || normalized === "choices") {
    return "majorChoices";
  }
  if (
    normalized.includes("unresolved") ||
    normalized.includes("mysterie") ||
    normalized === "mysteries"
  ) {
    return "unresolvedMysteries";
  }
  if (normalized.includes("inventory")) {
    return "inventory";
  }
  if (normalized.includes("resource")) {
    return "resources";
  }
  if (normalized.includes("allies") || normalized.includes("ally")) {
    return "allies";
  }
  if (
    normalized.includes("threat") ||
    normalized.includes("enemy") ||
    normalized.includes("danger")
  ) {
    return "threats";
  }
  if (normalized.includes("injur") || normalized.includes("wound")) {
    return "injuries";
  }
  if (normalized.includes("status") || normalized.includes("condition")) {
    return "status";
  }
  if (normalized.includes("location")) {
    return "location";
  }
  if (normalized.includes("clue")) {
    return "clues";
  }
  if (normalized === "state") {
    return "state";
  }

  return normalized.replace(/\s+/g, "");
}

function inferJourneyLedgerTone(key: string, value: string): JourneyLedgerTone {
  const normalized = value.toLowerCase();

  const dangerPattern =
    /\b(dead|dying|critical|severe|bleeding|wounded|injured|captured|corrupted|hostile|flood|dragnet|depleted|collapse|fatal|threat)\b/;
  const warningPattern =
    /\b(risky|uncertain|low|strained|damaged|unstable|limited|scarce|exposed|tense)\b/;
  const positivePattern =
    /\b(stable|safe|secure|trusted|equipped|supplied|recovered|healthy|victorious|mobile)\b/;

  if (key === "threats") {
    return dangerPattern.test(normalized) ? "danger" : "warning";
  }
  if (key === "allies") {
    if (positivePattern.test(normalized)) {
      return "positive";
    }
    if (warningPattern.test(normalized)) {
      return "warning";
    }
    return "neutral";
  }
  if (dangerPattern.test(normalized)) {
    return "danger";
  }
  if (positivePattern.test(normalized)) {
    return "positive";
  }
  if (warningPattern.test(normalized)) {
    return "warning";
  }

  return "neutral";
}

export function splitJourneyLedgerValue(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previousChar = index > 0 ? value[index - 1] : "";

    if (char === "'" && previousChar !== "\\" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && previousChar !== "\\" && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (char === "(") {
        parenDepth += 1;
      } else if (char === ")" && parenDepth > 0) {
        parenDepth -= 1;
      } else if (char === "[") {
        bracketDepth += 1;
      } else if (char === "]" && bracketDepth > 0) {
        bracketDepth -= 1;
      } else if (char === "{") {
        braceDepth += 1;
      } else if (char === "}" && braceDepth > 0) {
        braceDepth -= 1;
      }
    }

    const outsideGrouping =
      !inSingleQuote &&
      !inDoubleQuote &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0;
    const isSeparator =
      outsideGrouping &&
      (char === "," || char === ";" || char === "•" || char === "\n");

    if (isSeparator) {
      const part = current.trim();
      if (part.length > 0) {
        parts.push(part);
      }
      current = "";
      continue;
    }

    current += char;
  }

  const trailingPart = current.trim();
  if (trailingPart.length > 0) {
    parts.push(trailingPart);
  }

  return Array.from(new Set(parts));
}

function sanitizeJourneyLedgerLine(raw: string): string {
  return raw
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/^\s*[-+•]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((part) =>
      part.length > 0 ? `${part[0].toUpperCase()}${part.slice(1)}` : part,
    )
    .join(" ");
}

export function parseJourneyLedger(markdown: string): {
  fields: JourneyLedgerField[];
  remainderMarkdown: string;
} {
  const lines = markdown.split(/\r?\n/);
  const fieldEntries: Array<{ key: string; label: string; value: string }> = [];
  const remainder: string[] = [];

  for (const rawLine of lines) {
    const line = sanitizeJourneyLedgerLine(rawLine);
    if (line.length === 0) {
      continue;
    }

    if (/^#{0,6}\s*path ledger\b/i.test(line)) {
      continue;
    }

    const matched = line.match(/^([^:]{1,80}):\s*(.+)$/);

    if (!matched) {
      remainder.push(line);
      continue;
    }

    const rawLabel = sanitizeJourneyLedgerLine(matched[1]);
    const value = sanitizeJourneyLedgerLine(matched[2]);
    if (!rawLabel || !value) {
      remainder.push(line);
      continue;
    }

    const key = normalizeJourneyLedgerKey(rawLabel);
    fieldEntries.push({
      key,
      label: journeyLedgerFieldMeta[key]?.label ?? toTitleCase(rawLabel),
      value,
    });
  }

  const byKey = new Map<string, { label: string; value: string }>();
  for (const entry of fieldEntries) {
    if (byKey.has(entry.key)) {
      const prior = byKey.get(entry.key)!;
      byKey.set(entry.key, {
        label: prior.label,
        value: `${prior.value}; ${entry.value}`,
      });
      continue;
    }

    byKey.set(entry.key, { label: entry.label, value: entry.value });
  }

  const orderedKeys = [
    ...journeyLedgerFieldOrder,
    ...Array.from(byKey.keys()).filter(
      (key) =>
        !journeyLedgerFieldOrder.includes(
          key as (typeof journeyLedgerFieldOrder)[number],
        ),
    ),
  ];

  const fields: JourneyLedgerField[] = orderedKeys
    .map((key) => {
      const entry = byKey.get(key);
      if (!entry) {
        return null;
      }

      const meta = journeyLedgerFieldMeta[key];
      const label = meta?.label ?? entry.label;
      const emoji = meta?.emoji ?? "📌";
      return {
        key,
        label,
        value: entry.value,
        emoji,
        tone: inferJourneyLedgerTone(key, entry.value),
      };
    })
    .filter((field): field is JourneyLedgerField => Boolean(field));

  const remainderMarkdown = remainder
    .map((line) => sanitizeJourneyLedgerLine(line))
    .filter((line) => line.length > 0 && !/^#{0,6}\s*path ledger\b/i.test(line))
    .join("\n")
    .trim();

  return {
    fields,
    remainderMarkdown,
  };
}
