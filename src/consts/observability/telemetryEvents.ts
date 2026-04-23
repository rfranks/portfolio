import type {
  PortfolioMediaTelemetryAction,
  PortfolioNavigationTelemetryAction,
  PortfolioPagerTelemetryAction,
  PortfolioWindowShortcutEventName,
  PortfolioWindowTelemetryEventName,
} from "@/types/observability/telemetryEvents";

export const PORTFOLIO_SHORTCUT_EVENT = {
  HOME_PREV: "portfolio:shortcut:home-prev",
  HOME_NEXT: "portfolio:shortcut:home-next",
  SUB_PREV: "portfolio:shortcut:sub-prev",
  SUB_NEXT: "portfolio:shortcut:sub-next",
  MEDIA_PREV: "portfolio:shortcut:media-prev",
  MEDIA_NEXT: "portfolio:shortcut:media-next",
  MEDIA_LOOP: "portfolio:shortcut:media-loop",
} as const satisfies Record<string, PortfolioWindowShortcutEventName>;

export const PORTFOLIO_TELEMETRY_EVENT = {
  EMIT: "portfolio:telemetry:event",
} as const satisfies Record<string, PortfolioWindowTelemetryEventName>;

export const PORTFOLIO_NAVIGATION_TELEMETRY_ACTION = {
  COMMAND_PALETTE_OPEN: "navigation:command-palette-open",
  SHORTCUT_HELP_OPEN: "navigation:shortcut-help-open",
} as const satisfies Record<string, PortfolioNavigationTelemetryAction>;

export const PORTFOLIO_PAGER_TELEMETRY_ACTION = {
  HOME_PREV_SHORTCUT: "pager:home-prev-shortcut",
  HOME_NEXT_SHORTCUT: "pager:home-next-shortcut",
  SUB_PREV_SHORTCUT: "pager:sub-prev-shortcut",
  SUB_NEXT_SHORTCUT: "pager:sub-next-shortcut",
} as const satisfies Record<string, PortfolioPagerTelemetryAction>;

export const PORTFOLIO_MEDIA_TELEMETRY_ACTION = {
  PREVIOUS_PANEL: "media:previous-panel",
  NEXT_PANEL: "media:next-panel",
  LOOP: "media:loop",
  DETAILS_OPEN: "media:details-open",
  DETAILS_CLOSE: "media:details-close",
  OPEN: "media:open",
  COPY: "media:copy",
  EXPORT: "media:export",
  ZOOM: "media:zoom",
} as const satisfies Record<string, PortfolioMediaTelemetryAction>;
