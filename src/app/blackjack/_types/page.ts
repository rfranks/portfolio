import { DiagramProps } from "@/types/components/shared";
import type { BlackjackCardView } from "./messages";

export type BlackjackCarouselSlideId =
  | "game-card"
  | "why-this-project"
  | "terminal-demo"
  | "architecture-diagrams";

export type BlackjackDiagramVisualType = "material" | "emoji" | "image";

export type BlackjackDiagramVisualConfig = {
  type: BlackjackDiagramVisualType;
  icon?: string;
  src?: string;
  alt?: string;
};

export type BlackjackDiagramConfig = Pick<
  DiagramProps,
  | "diagram"
  | "height"
  | "title"
  | "type"
  | "autoFitPadding"
  | "autoFitScaleMultiplier"
  | "autoFitVerticalAlign"
  | "autoFitOffsetX"
  | "autoFitOffsetY"
> & {
  autoFit?: {
    padding?: number;
    scaleMultiplier?: number;
    verticalAlign?: "top" | "center";
    offsetX?: number;
    offsetY?: number;
  };
  shortText?: string;
  description?: string;
  selectorOptionVisual?: BlackjackDiagramVisualConfig;
  selectorSelectedVisual?: BlackjackDiagramVisualConfig;
};

export type WinningChipFx = {
  id: string;
  chipSrc: string;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  arcY: number;
  size: number;
  delayMs: number;
  durationMs: number;
  startRotate: number;
  endRotate: number;
  startScale: number;
};

export type BlackjackConfettiPiece = {
  id: string;
  left: number;
  delayMs: number;
  durationMs: number;
  size: number;
  driftX: number;
  rotateStart: number;
  rotateEnd: number;
  color: string;
  shape: "rect" | "circle";
};

export type BlackjackRoundTimelineEntryKind = "action" | "decision" | "payout" | "state";

export type BlackjackRoundTimelineEntry = {
  id: string;
  round: number;
  kind: BlackjackRoundTimelineEntryKind;
  title: string;
  detail?: string;
  amountDisplay?: string;
  card?: BlackjackCardView;
};

export type BlackjackRoundHandSnapshot = {
  cards: BlackjackCardView[];
  index: number;
  outcomeLabel: string;
  split: boolean;
  totalLabel: string;
};

export type BlackjackRoundSnapshot = {
  dealer: {
    cards: BlackjackCardView[];
    outcomeLabel: string;
    totalLabel: string;
  };
  hands: BlackjackRoundHandSnapshot[];
};

export type BlackjackRoundOutcome = "loss" | "push" | "win";

export type BlackjackAnalyticsRound = {
  blackjackWin: boolean;
  bustedHands: number;
  dealerBusted: boolean;
  netDelta: number;
  outcome: BlackjackRoundOutcome;
  round: number;
};
