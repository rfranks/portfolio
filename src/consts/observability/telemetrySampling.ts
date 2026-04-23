import type { PortfolioTelemetryChannel } from "@/types/observability/telemetryEvents";

export const PORTFOLIO_TELEMETRY_SAMPLE_RATE: Record<PortfolioTelemetryChannel, number> = {
  navigation: 1,
  pager: 1,
  media: 1,
};
