export type DeepLinkKeyTitleEntry<T extends string> = {
  key: T;
  title: string;
};

export const normalizeDeepLinkToken = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export const slugifyLooseToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function resolveSectionKeyFromParam<T extends string>(
  paramValue: string | undefined,
  sections: ReadonlyArray<DeepLinkKeyTitleEntry<T>>,
): T | undefined {
  const normalized = normalizeDeepLinkToken(paramValue);
  if (!normalized) {
    return undefined;
  }

  const byKey = sections.find((section) => section.key === normalized);
  if (byKey) {
    return byKey.key;
  }

  const byTitleSlug = sections.find((section) => {
    const sectionTitleSlug = slugifyLooseToken(section.title);
    return sectionTitleSlug === normalized || sectionTitleSlug.replace(/-/g, "") === normalized;
  });
  if (byTitleSlug) {
    return byTitleSlug.key;
  }

  const numericIndex = Number.parseInt(normalized, 10);
  if (Number.isFinite(numericIndex) && numericIndex >= 1 && numericIndex <= sections.length) {
    return sections[numericIndex - 1]?.key;
  }

  return undefined;
}

export function resolveIndexedKeyFromParam(
  paramValue: string | undefined,
  keys: readonly string[],
): string | undefined {
  const normalized = normalizeDeepLinkToken(paramValue);
  if (!normalized) {
    return undefined;
  }

  const byKey = keys.find((key) => key.toLowerCase() === normalized);
  if (byKey) {
    return byKey;
  }

  const numericIndex = Number.parseInt(normalized, 10);
  if (Number.isFinite(numericIndex) && numericIndex >= 1 && numericIndex <= keys.length) {
    return keys[numericIndex - 1];
  }

  return undefined;
}

export function resolveEntryKeyFromParam<T extends string>(
  paramValue: string | undefined,
  entries: ReadonlyArray<DeepLinkKeyTitleEntry<T>>,
): T | undefined {
  const normalized = normalizeDeepLinkToken(paramValue);
  if (!normalized) {
    return undefined;
  }

  const byKey = entries.find((entry) => entry.key.toLowerCase() === normalized);
  if (byKey) {
    return byKey.key;
  }

  const byTitle = entries.find((entry) => {
    const titleSlug = slugifyLooseToken(entry.title);
    return titleSlug === normalized || titleSlug.replace(/-/g, "") === normalized;
  });
  if (byTitle) {
    return byTitle.key;
  }

  const numericIndex = Number.parseInt(normalized, 10);
  if (Number.isFinite(numericIndex) && numericIndex >= 1 && numericIndex <= entries.length) {
    return entries[numericIndex - 1]?.key;
  }

  return undefined;
}

export function resolveAliasedParamValue<T extends string>(
  paramValue: string | undefined,
  aliases: Record<T, readonly string[]>,
): T | undefined {
  const normalized = normalizeDeepLinkToken(paramValue);
  if (!normalized) {
    return undefined;
  }

  const direct = Object.keys(aliases).find((key) => key === normalized) as T | undefined;
  if (direct) {
    return direct;
  }

  for (const key of Object.keys(aliases) as T[]) {
    const aliasSet = aliases[key];
    if (aliasSet.includes(normalized)) {
      return key;
    }
  }

  return undefined;
}
