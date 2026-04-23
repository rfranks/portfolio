"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type HealthStatus = "pass" | "warn" | "fail" | "unknown";
type HealthSnapshotKey =
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

const aggregateSnapshotUrl = "/personal/data/health/app-health.snapshot.json";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function statusToChipColor(status: HealthStatus): "success" | "warning" | "error" | "default" {
  if (status === "pass") {
    return "success";
  }
  if (status === "warn") {
    return "warning";
  }
  if (status === "fail") {
    return "error";
  }
  return "default";
}

function formatTimestamp(value: string | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function readNestedStatus(details: Record<string, unknown>, key: string): HealthStatus {
  const nested = asRecord(details[key]);
  const status = nested?.status;
  if (status === "pass" || status === "warn" || status === "fail" || status === "unknown") {
    return status;
  }
  return "unknown";
}

function readNestedCount(
  details: Record<string, unknown>,
  key: string,
  countKey: string,
): number | null {
  const nested = asRecord(details[key]);
  const countValue = nested?.[countKey];
  if (typeof countValue === "number" && Number.isFinite(countValue)) {
    return countValue;
  }
  return null;
}

function StatusChip({ status }: { status: HealthStatus }) {
  return (
    <Chip
      label={status.toUpperCase()}
      color={statusToChipColor(status)}
      size="small"
      sx={{ fontWeight: 700 }}
    />
  );
}

function SnapshotCard({
  title,
  status,
  summary,
  updatedAt,
  extraLines,
}: {
  title: string;
  status: HealthStatus;
  summary: string;
  updatedAt: string;
  extraLines?: string[];
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <StatusChip status={status} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {summary}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Updated: {updatedAt}
        </Typography>
        {extraLines?.map((line) => (
          <Typography key={line} variant="caption" color="text.secondary">
            {line}
          </Typography>
        ))}
      </Stack>
    </Paper>
  );
}

export default function HealthDashboardPageClient() {
  const [snapshot, setSnapshot] = React.useState<AggregateHealthSnapshot | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadSnapshot = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${aggregateSnapshotUrl}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Unable to load health snapshot (${response.status})`);
      }

      const nextSnapshot = (await response.json()) as AggregateHealthSnapshot;
      setSnapshot(nextSnapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const bundleSnapshot = snapshot?.snapshots.bundleBudget;
  const fileBudgetSnapshot = snapshot?.snapshots.fileBudgets;
  const schemaSnapshot = snapshot?.snapshots.schemaValidation;
  const typecheckSnapshot = snapshot?.snapshots.typecheckRunner;
  const testRunnerSnapshot = snapshot?.snapshots.testRunner;
  const a11yRunnerSnapshot = snapshot?.snapshots.a11yRunner;
  const fileBudgetDetails = asRecord(fileBudgetSnapshot?.details) ?? {};
  const testStatus =
    testRunnerSnapshot?.status ?? readNestedStatus(fileBudgetDetails, "testHealth");
  const a11yStatus =
    a11yRunnerSnapshot?.status ?? readNestedStatus(fileBudgetDetails, "a11yHealth");
  const totalTests = readNestedCount(fileBudgetDetails, "testHealth", "totalTestFiles");
  const totalA11yTests = readNestedCount(fileBudgetDetails, "a11yHealth", "totalA11yTestFiles");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 3 },
        py: { xs: 2.5, md: 4 },
      }}
    >
      <Stack spacing={2.25}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          gap={1.5}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Health Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Route and app quality snapshots generated by local quality scripts.
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" gap={1}>
            <StatusChip status={snapshot?.overallStatus ?? "unknown"} />
            <Button variant="outlined" size="small" onClick={() => void loadSnapshot()}>
              Refresh
            </Button>
          </Stack>
        </Stack>

        {isLoading ? (
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
          >
            <Typography variant="body2" color="text.secondary">
              Loading health snapshots...
            </Typography>
          </Paper>
        ) : null}

        {!isLoading && errorMessage ? (
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Snapshots unavailable
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {errorMessage}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Run `npm run check:bundle-budget`, `npm run check:file-budgets`, and `npm run
              validate:resume:strict` to generate snapshots.
            </Typography>
          </Paper>
        ) : null}

        {!isLoading && !errorMessage ? (
          <Stack spacing={1.5}>
            <SnapshotCard
              title="Bundle Budget"
              status={bundleSnapshot?.status ?? "unknown"}
              summary={bundleSnapshot?.summary ?? "No bundle budget snapshot yet."}
              updatedAt={formatTimestamp(bundleSnapshot?.generatedAt)}
            />
            <SnapshotCard
              title="Typecheck Health"
              status={typecheckSnapshot?.status ?? "unknown"}
              summary={typecheckSnapshot?.summary ?? "No typecheck snapshot yet."}
              updatedAt={formatTimestamp(typecheckSnapshot?.generatedAt)}
            />
            <SnapshotCard
              title="Test Health"
              status={testStatus}
              summary={
                testRunnerSnapshot?.summary ??
                (totalTests == null
                  ? "No test-health inventory available yet."
                  : `Detected ${totalTests} test file(s) in repository scan.`)
              }
              updatedAt={formatTimestamp(
                testRunnerSnapshot?.generatedAt ?? fileBudgetSnapshot?.generatedAt,
              )}
            />
            <SnapshotCard
              title="Accessibility (a11y) Health"
              status={a11yStatus}
              summary={
                a11yRunnerSnapshot?.summary ??
                (totalA11yTests == null
                  ? "No a11y-health inventory available yet."
                  : `Detected ${totalA11yTests} accessibility test file(s).`)
              }
              updatedAt={formatTimestamp(
                a11yRunnerSnapshot?.generatedAt ?? fileBudgetSnapshot?.generatedAt,
              )}
            />
            <SnapshotCard
              title="Schema Validation"
              status={schemaSnapshot?.status ?? "unknown"}
              summary={schemaSnapshot?.summary ?? "No schema validation snapshot yet."}
              updatedAt={formatTimestamp(schemaSnapshot?.generatedAt)}
            />
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Aggregate updated: {formatTimestamp(snapshot?.generatedAt)}
              </Typography>
            </Paper>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
