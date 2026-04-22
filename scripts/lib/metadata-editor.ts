export type JsonRecord = Record<string, unknown>;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumericPathSegment(segment: string): boolean {
  return /^\d+$/.test(segment);
}

export function parseMetadataPath(pathInput: string): string[] {
  return pathInput
    .trim()
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function formatValueForDisplay(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function getValueAtPath(root: unknown, segments: string[]): unknown {
  let current: unknown = root;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      if (!isNumericPathSegment(segment)) {
        return undefined;
      }
      const index = Number(segment);
      current = current[index];
      continue;
    }

    if (isPlainObject(current)) {
      current = current[segment];
      continue;
    }

    return undefined;
  }

  return current;
}

export function setValueAtPath(root: JsonRecord, segments: string[], value: unknown): boolean {
  if (!segments.length) {
    return false;
  }

  let current: unknown = root;

  for (let idx = 0; idx < segments.length - 1; idx += 1) {
    const segment = segments[idx];
    const nextSegment = segments[idx + 1];
    const shouldCreateArray = isNumericPathSegment(nextSegment);

    if (Array.isArray(current)) {
      if (!isNumericPathSegment(segment)) {
        return false;
      }
      const index = Number(segment);
      const existing = current[index];
      if (!isPlainObject(existing) && !Array.isArray(existing)) {
        current[index] = shouldCreateArray ? [] : {};
      }
      current = current[index];
      continue;
    }

    if (isPlainObject(current)) {
      const existing = current[segment];
      if (!isPlainObject(existing) && !Array.isArray(existing)) {
        current[segment] = shouldCreateArray ? [] : {};
      }
      current = current[segment];
      continue;
    }

    return false;
  }

  const last = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (!isNumericPathSegment(last)) {
      return false;
    }
    current[Number(last)] = value;
    return true;
  }

  if (isPlainObject(current)) {
    current[last] = value;
    return true;
  }

  return false;
}

export function deleteValueAtPath(root: JsonRecord, segments: string[]): boolean {
  if (!segments.length) {
    return false;
  }

  let current: unknown = root;
  for (let idx = 0; idx < segments.length - 1; idx += 1) {
    const segment = segments[idx];
    if (Array.isArray(current)) {
      if (!isNumericPathSegment(segment)) {
        return false;
      }
      current = current[Number(segment)];
      continue;
    }
    if (isPlainObject(current)) {
      current = current[segment];
      continue;
    }
    return false;
  }

  const last = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (!isNumericPathSegment(last)) {
      return false;
    }
    const index = Number(last);
    if (index < 0 || index >= current.length) {
      return false;
    }
    current.splice(index, 1);
    return true;
  }

  if (isPlainObject(current)) {
    if (!(last in current)) {
      return false;
    }
    delete current[last];
    return true;
  }

  return false;
}
