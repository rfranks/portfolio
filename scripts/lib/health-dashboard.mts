import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

export const HEALTH_SNAPSHOT_PUBLIC_BASE_PATH = "/personal/data/health";
export const HEALTH_SNAPSHOT_DIR = path.join(repoRoot, "public", "personal", "data", "health");
const AGGREGATE_SNAPSHOT_PATH = path.join(HEALTH_SNAPSHOT_DIR, "app-health.snapshot.json");

export type HealthStatus = "pass" | "warn" | "fail" | "unknown";
export type HealthSnapshotKey =
  | "bundleBudget"
  | "fileBudgets"
  | "schemaValidation"
  | "testRunner"
  | "a11yRunner"
  | "typecheckRunner";

type HealthSnapshotEnvelope = {
  key: HealthSnapshotKey;
  status: HealthStatus;
  generatedAt: string;
  summary: string;
  details: Record<string, unknown>;
};

type AggregateHealthSnapshot = {
  generatedAt: string;
  overallStatus: HealthStatus;
  checks: Partial<Record<HealthSnapshotKey, HealthStatus>>;
  snapshots: Partial<Record<HealthSnapshotKey, HealthSnapshotEnvelope>>;
};

const statusPriority: Record<HealthStatus, number> = {
  fail: 4,
  warn: 3,
  unknown: 2,
  pass: 1,
};

function withPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function toPublicPath(filename: string): string {
  return `${HEALTH_SNAPSHOT_PUBLIC_BASE_PATH}/${filename}`.replace(/\/{2,}/g, "/");
}

function computeOverallStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.length === 0) {
    return "unknown";
  }

  const sortedStatuses = [...statuses].sort(
    (left, right) => statusPriority[right] - statusPriority[left],
  );
  return sortedStatuses[0] ?? "unknown";
}

async function readAggregateSnapshot(): Promise<AggregateHealthSnapshot | null> {
  try {
    const raw = await fs.readFile(AGGREGATE_SNAPSHOT_PATH, "utf8");
    return JSON.parse(raw) as AggregateHealthSnapshot;
  } catch {
    return null;
  }
}

export async function writeHealthSnapshot(args: {
  key: HealthSnapshotKey;
  status: HealthStatus;
  summary: string;
  details: Record<string, unknown>;
}): Promise<{ absolutePath: string; publicPath: string; aggregatePublicPath: string }> {
  await fs.mkdir(HEALTH_SNAPSHOT_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();
  const snapshotFilename = `${args.key}.snapshot.json`;
  const snapshotAbsolutePath = path.join(HEALTH_SNAPSHOT_DIR, snapshotFilename);
  const snapshotEnvelope: HealthSnapshotEnvelope = {
    key: args.key,
    status: args.status,
    generatedAt,
    summary: args.summary,
    details: args.details,
  };

  await fs.writeFile(
    snapshotAbsolutePath,
    `${JSON.stringify(snapshotEnvelope, null, 2)}\n`,
    "utf8",
  );

  const existingAggregate = (await readAggregateSnapshot()) ?? {
    generatedAt,
    overallStatus: "unknown",
    checks: {},
    snapshots: {},
  };
  const nextSnapshots: AggregateHealthSnapshot["snapshots"] = {
    ...existingAggregate.snapshots,
    [args.key]: snapshotEnvelope,
  };

  const nextChecks: AggregateHealthSnapshot["checks"] = Object.fromEntries(
    Object.entries(nextSnapshots).map(([key, snapshot]) => [key, snapshot?.status ?? "unknown"]),
  ) as AggregateHealthSnapshot["checks"];

  const nextAggregate: AggregateHealthSnapshot = {
    generatedAt,
    overallStatus: computeOverallStatus(
      Object.values(nextChecks).filter((status): status is HealthStatus => Boolean(status)),
    ),
    checks: nextChecks,
    snapshots: nextSnapshots,
  };

  await fs.writeFile(
    AGGREGATE_SNAPSHOT_PATH,
    `${JSON.stringify(nextAggregate, null, 2)}\n`,
    "utf8",
  );

  return {
    absolutePath: withPosixPath(snapshotAbsolutePath),
    publicPath: toPublicPath(snapshotFilename),
    aggregatePublicPath: toPublicPath(path.basename(AGGREGATE_SNAPSHOT_PATH)),
  };
}
