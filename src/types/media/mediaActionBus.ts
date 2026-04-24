import type { MediaActionContract } from "@/types/media/mediaActionContract";
import { PORTFOLIO_MEDIA_ACTION_BUS_EVENT } from "@/consts/media/mediaActionBus";

export type PortfolioMediaActionBusEventName = typeof PORTFOLIO_MEDIA_ACTION_BUS_EVENT;

export type MediaActionBusSource =
  | "media-cycler"
  | "diagram"
  | "image-renderer"
  | "video-renderer"
  | "pdf-renderer";

export type MediaActionBusEventDetail = {
  action: MediaActionContract;
  source: MediaActionBusSource;
  timestamp: number;
};
