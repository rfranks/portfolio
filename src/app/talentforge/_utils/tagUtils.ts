export const MAX_TAG_LENGTH = 40;

export const INPUT_DELIMITERS = new Set(["Enter", ",", ";", "Tab"]);

export function normalizeTags(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of values) {
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    normalized.push(trimmed);
    seen.add(key);
  }
  return normalized;
}

export function tagsEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((tag, idx) => tag === b[idx]);
}

export function validateTag(
  value: string,
  existing: string[],
  options: { ignoreIndex?: number; maxLength?: number } = {},
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Tag cannot be empty.";
  }
  const maxLength = options.maxLength ?? MAX_TAG_LENGTH;
  if (trimmed.length > maxLength) {
    return `Tag must be ${maxLength} characters or fewer.`;
  }
  const duplicateIndex = existing.findIndex(
    (tag, idx) =>
      tag.toLowerCase() === trimmed.toLowerCase() && idx !== options.ignoreIndex,
  );
  if (duplicateIndex !== -1) {
    return "Tag already exists.";
  }
  return null;
}
