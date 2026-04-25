import { LATEST_RESUME_DATA_SCHEMA_VERSION } from "@/utils/data/migrations/resumeDataMigrations";

export const RESUME_SCHEMA_BREAKING_FIELDS_APPROVAL_ENV = "ALLOW_RESUME_SCHEMA_BREAKING_FIELDS";

export type ResumeSchemaChangeLogEntry = {
  version: number;
  date: string;
  summary: string;
  migration: string;
  breakingFields: string[];
};

export const RESUME_DATA_SCHEMA_CHANGELOG: ResumeSchemaChangeLogEntry[] = [
  {
    version: 1,
    date: "2026-04-20",
    summary: "Established strict resumeData schema contract and migration framework baseline.",
    migration: "baseline",
    breakingFields: [],
  },
  {
    version: 2,
    date: "2026-04-22",
    summary:
      "Normalized legacy GitHub achievement path typo in migrated payloads without field removals.",
    migration: "migrateV1ToV2",
    breakingFields: [],
  },
  {
    version: 3,
    date: "2026-04-23",
    summary:
      "Introduced presentation orchestration config with migration defaults and prefetch hints for presentation projects.",
    migration: "migrateV2ToV3",
    breakingFields: [],
  },
  {
    version: 4,
    date: "2026-04-24",
    summary:
      "Normalized diagram auto-fit settings into a structured autoFit contract for data-driven viewport presets.",
    migration: "migrateV3ToV4",
    breakingFields: [],
  },
  {
    version: 5,
    date: "2026-04-24",
    summary:
      "Introduced sectionCapabilities policy map for presentation pages to control availability, pager behavior, audio profiles, and deep-link restore rules.",
    migration: "migrateV4ToV5",
    breakingFields: [],
  },
  {
    version: 6,
    date: "2026-04-24",
    summary:
      "Normalized portfolioApps into explicit per-route metadata contracts and added non-presentation app route coverage.",
    migration: "migrateV5ToV6",
    breakingFields: [],
  },
];

export function assertResumeSchemaGovernance(): void {
  if (RESUME_DATA_SCHEMA_CHANGELOG.length === 0) {
    throw new Error("Schema governance misconfigured: changelog must contain at least one entry.");
  }

  const sorted = [...RESUME_DATA_SCHEMA_CHANGELOG].sort(
    (left, right) => left.version - right.version,
  );
  const seenMigrationNames = new Set<string>();

  for (let index = 0; index < sorted.length; index += 1) {
    const entry = sorted[index];
    if (!Number.isInteger(entry.version) || entry.version < 1) {
      throw new Error(
        `Schema governance misconfigured: changelog version '${entry.version}' must be a positive integer.`,
      );
    }

    if (index > 0) {
      const previous = sorted[index - 1];
      if (entry.version === previous.version) {
        throw new Error(
          `Schema governance misconfigured: duplicate changelog version ${entry.version}.`,
        );
      }
      if (entry.version !== previous.version + 1) {
        throw new Error(
          `Schema governance misconfigured: changelog versions must be contiguous. Missing version ${previous.version + 1}.`,
        );
      }

      const previousDateMs = Date.parse(previous.date);
      const entryDateMs = Date.parse(entry.date);
      if (!Number.isFinite(previousDateMs) || !Number.isFinite(entryDateMs)) {
        throw new Error(
          `Schema governance misconfigured: changelog dates must be valid ISO strings ('${previous.date}' -> '${entry.date}').`,
        );
      }
      if (entryDateMs < previousDateMs) {
        throw new Error(
          `Schema governance misconfigured: changelog dates must be monotonic by version (${previous.version}=${previous.date}, ${entry.version}=${entry.date}).`,
        );
      }
    }

    const normalizedMigrationName = entry.migration.trim();
    if (!normalizedMigrationName) {
      throw new Error(
        `Schema governance misconfigured: changelog version ${entry.version} must declare a migration name.`,
      );
    }
    if (seenMigrationNames.has(normalizedMigrationName)) {
      throw new Error(
        `Schema governance misconfigured: duplicate migration name '${normalizedMigrationName}' in changelog.`,
      );
    }
    seenMigrationNames.add(normalizedMigrationName);
  }

  const latestEntry = sorted[sorted.length - 1];
  if (latestEntry.version !== LATEST_RESUME_DATA_SCHEMA_VERSION) {
    throw new Error(
      `Schema governance misconfigured: latest changelog version ${latestEntry.version} does not match migration schema version ${LATEST_RESUME_DATA_SCHEMA_VERSION}.`,
    );
  }

  if (!latestEntry.migration.trim()) {
    throw new Error(
      "Schema governance misconfigured: latest changelog entry must include migration.",
    );
  }

  const dedupedBreakingFields = new Set(latestEntry.breakingFields.map((value) => value.trim()));
  if (dedupedBreakingFields.size !== latestEntry.breakingFields.length) {
    throw new Error(
      `Schema governance misconfigured: duplicate breaking field paths in version ${latestEntry.version}.`,
    );
  }
}

export function getLatestResumeSchemaChangeLogEntry(): ResumeSchemaChangeLogEntry {
  const sorted = [...RESUME_DATA_SCHEMA_CHANGELOG].sort(
    (left, right) => left.version - right.version,
  );
  return sorted[sorted.length - 1];
}
