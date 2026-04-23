import type { PortfolioTelemetryChannel } from "@/types/observability/telemetryEvents";
import type { TimelineEventKind } from "@/types/observability/navigationTelemetry";

export function getTimestampMs(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

export function truncateLabel(value: string, maxLength = 88): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

export function getTargetLabel(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const interactiveElement = target.closest("button,a,[role='button'],[aria-label]");
  if (!interactiveElement) {
    return null;
  }

  const ariaLabel = interactiveElement.getAttribute("aria-label")?.trim();
  if (ariaLabel) {
    return truncateLabel(ariaLabel);
  }

  const textContent = interactiveElement.textContent?.replace(/\s+/g, " ").trim();
  return textContent ? truncateLabel(textContent) : null;
}

export function getMediaActionLabelFromControlLabel(controlLabel: string | null): string | null {
  if (!controlLabel) {
    return null;
  }

  const normalized = controlLabel.toLowerCase();
  if (normalized.includes("open full")) {
    return "media:expand";
  }
  if (normalized.includes("copy mermaid")) {
    return "media:copy-source";
  }
  if (normalized.includes("zoom in")) {
    return "media:zoom-in";
  }
  if (normalized.includes("zoom out")) {
    return "media:zoom-out";
  }
  if (normalized.includes("reset transform")) {
    return "media:reset-transform";
  }
  if (normalized.includes("pan up")) {
    return "media:pan-up";
  }
  if (normalized.includes("pan down")) {
    return "media:pan-down";
  }
  if (normalized.includes("pan left")) {
    return "media:pan-left";
  }
  if (normalized.includes("pan right")) {
    return "media:pan-right";
  }
  if (normalized.includes("show source")) {
    return "media:show-source";
  }

  return null;
}

export function mapTelemetryChannelToTimelineKind(
  channel: PortfolioTelemetryChannel,
): TimelineEventKind {
  if (channel === "media") {
    return "media";
  }
  if (channel === "pager") {
    return "pager";
  }
  return "navigation";
}
