import { PORTFOLIO_TELEMETRY_EVENT } from "@/consts/observability/telemetryEvents";
import { PORTFOLIO_TELEMETRY_SAMPLE_RATE } from "@/consts/observability/telemetrySampling";
import type {
  PortfolioTelemetryChannel,
  PortfolioTelemetryEventDetail,
} from "@/types/observability/telemetryEvents";

const shouldSampleTelemetryEvent = (channel: PortfolioTelemetryChannel) => {
  const rate = PORTFOLIO_TELEMETRY_SAMPLE_RATE[channel] ?? 1;
  if (rate >= 1) {
    return true;
  }
  if (rate <= 0) {
    return false;
  }
  return Math.random() <= rate;
};

export function emitPortfolioTelemetryEventThroughBus(detail: PortfolioTelemetryEventDetail): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!shouldSampleTelemetryEvent(detail.channel)) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<PortfolioTelemetryEventDetail>(PORTFOLIO_TELEMETRY_EVENT.EMIT, {
      detail,
    }),
  );
}
