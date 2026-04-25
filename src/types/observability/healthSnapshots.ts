export type HealthStatus = "pass" | "warn" | "fail" | "unknown";

export type HealthSnapshotKey =
  | "bundleBudget"
  | "fileBudgets"
  | "schemaValidation"
  | "testRunner"
  | "a11yRunner"
  | "typecheckRunner";

export type HealthSnapshotEnvelope = {
  key: HealthSnapshotKey;
  status: HealthStatus;
  generatedAt?: string;
  summary?: string;
  details: Record<string, unknown>;
};

export type AggregateHealthSnapshot = {
  generatedAt?: string;
  overallStatus?: HealthStatus;
  checks: Partial<Record<HealthSnapshotKey, HealthStatus>>;
  snapshots: Partial<Record<HealthSnapshotKey, HealthSnapshotEnvelope>>;
};

export type BundleRouteSnapshot = {
  route: string;
  withinBudget: boolean;
  totalKb?: number;
  largestKb?: number;
};

export type HealthRouteStatusDetail = {
  status: HealthStatus;
  detail: string;
};
