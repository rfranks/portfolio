import type { ApplicationStatus, JobApplication } from "@/types";
import { STATUSES } from "@/app/talentforge/_utils/keyboard";

export const SLA_THRESHOLDS_DAYS: Readonly<Record<ApplicationStatus, number>> = {
  applied: 7,
  interview: 5,
  offer: 3,
  rejected: 2,
};

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const numberFormatter = new Intl.NumberFormat();
const percentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});
const daysFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});
const hoursFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});
const minutesFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

function parseTimestamp(value: string): number | null {
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

function formatDuration(days: number): string {
  if (!Number.isFinite(days) || days < 0) {
    return "—";
  }
  if (days >= 2) {
    return `${daysFormatter.format(days)} days`;
  }
  const hours = days * 24;
  if (hours >= 2) {
    return `${hoursFormatter.format(hours)} hours`;
  }
  const minutes = Math.round(hours * 60);
  return `${minutesFormatter.format(minutes)} minutes`;
}

function getThresholdLabel(status: ApplicationStatus): string | null {
  const threshold = SLA_THRESHOLDS_DAYS[status];
  return typeof threshold === "number" ? formatDuration(threshold) : null;
}

function buildAssistiveSummary(
  metric: StageMetric,
  conversionLabel: string,
  averageLabel: string | null,
  thresholdLabel: string | null,
): string {
  const parts = [`${metric.label} stage`];
  parts.push(`${numberFormatter.format(metric.currentCount)} in stage`);
  if (metric.conversionRate !== null) {
    parts.push(`conversion ${conversionLabel}`);
  }
  if (averageLabel) {
    parts.push(`average dwell ${averageLabel}`);
  }
  if (thresholdLabel) {
    parts.push(
      metric.slaBreached
        ? `exceeds SLA of ${thresholdLabel}`
        : `SLA ${thresholdLabel}`,
    );
  }
  return parts.join(". ");
}

export interface StageMetric {
  status: ApplicationStatus;
  label: string;
  currentCount: number;
  reachedCount: number;
  conversionRate: number | null;
  averageDurationDays: number | null;
  slaBreached: boolean;
}

interface StageMetricAccumulator {
  status: ApplicationStatus;
  label: string;
  currentCount: number;
  reachedCount: number;
  totalDurationMs: number;
  durationSamples: number;
}

export function calculateStageMetrics(
  applications: JobApplication[],
  now: number = Date.now(),
): StageMetric[] {
  const metricMap = new Map<ApplicationStatus, StageMetricAccumulator>(
    STATUSES.map((status) => [
      status,
      {
        status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        currentCount: 0,
        reachedCount: 0,
        totalDurationMs: 0,
        durationSamples: 0,
      },
    ]),
  );

  applications.forEach((app) => {
    const currentMetric = metricMap.get(app.status);
    if (currentMetric) {
      currentMetric.currentCount += 1;
    }

    const history = [...(app.history ?? [])].sort((a, b) => {
      const aTime = parseTimestamp(a.changedAt);
      const bTime = parseTimestamp(b.changedAt);
      if (aTime === null && bTime === null) return 0;
      if (aTime === null) return -1;
      if (bTime === null) return 1;
      return aTime - bTime;
    });

    const reachedStatuses = new Set<ApplicationStatus>();

    history.forEach((entry, index) => {
      const metric = metricMap.get(entry.status);
      if (!metric) {
        return;
      }
      if (!reachedStatuses.has(entry.status)) {
        metric.reachedCount += 1;
        reachedStatuses.add(entry.status);
      }

      const startTime = parseTimestamp(entry.changedAt);
      if (startTime === null) {
        return;
      }

      let endTime: number | null = null;
      for (let nextIndex = index + 1; nextIndex < history.length; nextIndex += 1) {
        const nextTime = parseTimestamp(history[nextIndex].changedAt);
        if (nextTime !== null) {
          endTime = nextTime;
          break;
        }
      }

      if (endTime === null && app.status === entry.status) {
        endTime = now;
      }

      if (endTime !== null && endTime >= startTime) {
        metric.totalDurationMs += endTime - startTime;
        metric.durationSamples += 1;
      }
    });

    if (!reachedStatuses.has(app.status)) {
      const metric = metricMap.get(app.status);
      if (metric) {
        metric.reachedCount += 1;
      }
    }
  });

  return STATUSES.map((status) => {
    const metric = metricMap.get(status)!;
    const averageDurationDays =
      metric.durationSamples > 0
        ? metric.totalDurationMs / metric.durationSamples / MS_IN_DAY
        : null;

    const threshold = SLA_THRESHOLDS_DAYS[status];
    const slaBreached =
      averageDurationDays !== null &&
      typeof threshold === "number" &&
      averageDurationDays > threshold;

    return {
      status,
      label: metric.label,
      currentCount: metric.currentCount,
      reachedCount: metric.reachedCount,
      conversionRate:
        applications.length > 0
          ? metric.reachedCount / applications.length
          : null,
      averageDurationDays,
      slaBreached,
    };
  });
}

export interface StageMetricDisplay {
  countLabel: string;
  conversionLabel: string;
  averageLabel: string | null;
  thresholdLabel: string | null;
  assistiveText: string;
}

export function getMetricDisplay(metric: StageMetric): StageMetricDisplay {
  const averageLabel =
    metric.averageDurationDays !== null
      ? formatDuration(metric.averageDurationDays)
      : null;
  const thresholdLabel = getThresholdLabel(metric.status);
  const conversionLabel =
    metric.conversionRate === null
      ? "—"
      : percentFormatter.format(metric.conversionRate);
  const assistiveText = buildAssistiveSummary(
    metric,
    conversionLabel,
    averageLabel,
    thresholdLabel,
  );
  const countLabel = numberFormatter.format(metric.currentCount);
  return { countLabel, conversionLabel, averageLabel, thresholdLabel, assistiveText };
}
