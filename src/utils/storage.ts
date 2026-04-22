/**
 * Utility helpers for working with `localStorage` using JSON serialization
 * and versioned payloads so values can be migrated in the future.
 */

export interface Versioned<T> {
  version: number;
  data: T;
}

/**
 * Persist a value to `localStorage` under the provided key.
 * The value is wrapped with a version number to allow future migrations.
 */
export function saveItem<T>(key: string, value: T, version = 1): void {
  if (typeof window === "undefined") return;

  const payload: Versioned<T> = { version, data: value };
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Silently ignore write errors (e.g. storage quota exceeded)
  }
}

/**
 * Retrieve a value from `localStorage`.
 *
 * When the stored version differs from `currentVersion`, an optional `migrate`
 * function can transform the data. The migrated value is saved back using the
 * new version.
 */
export function loadItem<T>(
  key: string,
  currentVersion = 1,
  migrate?: (data: unknown, version: number) => T,
): T | undefined {
  if (typeof window === "undefined") return undefined;

  const raw = window.localStorage.getItem(key);
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as Partial<Versioned<unknown>>;
    const storedVersion = parsed.version ?? 0;
    if (storedVersion === currentVersion) {
      return parsed.data as T;
    }
    if (migrate) {
      const migrated = migrate(parsed.data, storedVersion);
      saveItem(key, migrated, currentVersion);
      return migrated;
    }
  } catch {
    // Ignore parse errors
  }
  return undefined;
}

/**
 * Remove a value from `localStorage`.
 */
export function deleteItem(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

/**
 * Return a map of key–value pairs from `localStorage` filtered by key prefix
 * and version. Only entries whose keys start with `prefix` and whose stored
 * version equals `currentVersion` are included.
 */
export function listItems<T>(prefix = "", currentVersion = 1): Record<string, T> {
  const results: Record<string, T> = {};
  if (typeof window === "undefined") return results;

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const value = loadItem<T>(key, currentVersion);
      if (value !== undefined) {
        results[key] = value;
      }
    }
  }
  return results;
}
