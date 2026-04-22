export const LATEST_RESUME_DATA_SCHEMA_VERSION = 2;

export type ResumeDataMigrationPayload = Record<string, unknown>;

type MigrationFn = (input: ResumeDataMigrationPayload) => ResumeDataMigrationPayload;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function replaceStringValue(value: unknown, fromValue: string, toValue: string): unknown {
  if (typeof value === "string") {
    return value.includes(fromValue) ? value.replaceAll(fromValue, toValue) : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceStringValue(item, fromValue, toValue));
  }

  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      next[key] = replaceStringValue(nested, fromValue, toValue);
    }
    return next;
  }

  return value;
}

const migrateV1ToV2: MigrationFn = (input) => {
  const withFixedPaths = replaceStringValue(
    input,
    "/personal/images/github/achievments/",
    "/personal/images/github/achievements/",
  );

  return {
    ...(withFixedPaths as ResumeDataMigrationPayload),
    schemaVersion: 2,
  };
};

const MIGRATIONS: Record<number, MigrationFn> = {
  1: migrateV1ToV2,
};

export function migrateResumeData(payload: ResumeDataMigrationPayload): ResumeDataMigrationPayload {
  const working = deepClone(payload);
  const currentVersionRaw =
    typeof working.schemaVersion === "number" && Number.isFinite(working.schemaVersion)
      ? working.schemaVersion
      : 1;

  let currentVersion = Math.max(1, Math.floor(currentVersionRaw));
  let migrated = working;

  while (currentVersion < LATEST_RESUME_DATA_SCHEMA_VERSION) {
    const migration = MIGRATIONS[currentVersion];
    if (!migration) {
      throw new Error(`Missing migration from schemaVersion ${currentVersion}.`);
    }

    migrated = migration(migrated);
    currentVersion += 1;
  }

  if (typeof migrated.schemaVersion !== "number") {
    migrated.schemaVersion = LATEST_RESUME_DATA_SCHEMA_VERSION;
  }

  return migrated;
}
