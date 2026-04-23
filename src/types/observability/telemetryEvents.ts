export type PortfolioWindowShortcutEventName =
  | "portfolio:shortcut:home-prev"
  | "portfolio:shortcut:home-next"
  | "portfolio:shortcut:sub-prev"
  | "portfolio:shortcut:sub-next"
  | "portfolio:shortcut:media-prev"
  | "portfolio:shortcut:media-next"
  | "portfolio:shortcut:media-loop";

export type PortfolioWindowTelemetryEventName = "portfolio:telemetry:event";

export type PortfolioWindowEventName =
  | PortfolioWindowShortcutEventName
  | PortfolioWindowTelemetryEventName;

export type PortfolioTelemetryChannel = "navigation" | "pager" | "media";

export type PortfolioTelemetryTrigger =
  | "pointer"
  | "keyboard"
  | "keyboard-shortcut"
  | "programmatic";

export type PortfolioNavigationTelemetryAction =
  | "navigation:command-palette-open"
  | "navigation:shortcut-help-open";

export type PortfolioPagerTelemetryAction =
  | "pager:home-prev-shortcut"
  | "pager:home-next-shortcut"
  | "pager:sub-prev-shortcut"
  | "pager:sub-next-shortcut";

export type PortfolioMediaTelemetryAction =
  | "media:previous-panel"
  | "media:next-panel"
  | "media:loop"
  | "media:details-open"
  | "media:details-close"
  | "media:open"
  | "media:copy"
  | "media:export"
  | "media:zoom";

export type PortfolioTelemetryAction =
  | PortfolioNavigationTelemetryAction
  | PortfolioPagerTelemetryAction
  | PortfolioMediaTelemetryAction;

export type PortfolioTelemetryEventDetail = {
  channel: PortfolioTelemetryChannel;
  action: PortfolioTelemetryAction;
  trigger?: PortfolioTelemetryTrigger;
  itemKey?: string;
  mediaType?: string;
  title?: string;
  source?: string;
  control?: string;
};

export type PortfolioWindowEventDetailMap = {
  "portfolio:shortcut:home-prev": undefined;
  "portfolio:shortcut:home-next": undefined;
  "portfolio:shortcut:sub-prev": undefined;
  "portfolio:shortcut:sub-next": undefined;
  "portfolio:shortcut:media-prev": undefined;
  "portfolio:shortcut:media-next": undefined;
  "portfolio:shortcut:media-loop": undefined;
  "portfolio:telemetry:event": PortfolioTelemetryEventDetail;
};
