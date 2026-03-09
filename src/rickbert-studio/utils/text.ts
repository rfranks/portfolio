export function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
}

export function wrapText(text: string, maxCharsPerLine: number): string[] {
  if (text.length <= maxCharsPerLine) {
    return [text];
  }

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length > maxCharsPerLine) {
      const chunks = word.match(new RegExp(`.{1,${maxCharsPerLine}}`, "g"));
      if (chunks) {
        lines.push(...chunks.slice(0, -1));
        current = chunks[chunks.length - 1] ?? "";
      } else {
        current = word;
      }
    } else {
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

export function includesAny(haystack: string, needles: string[]): boolean {
  const lowered = haystack.toLowerCase();
  return needles.some((needle) => lowered.includes(needle.toLowerCase()));
}
