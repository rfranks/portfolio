import { DiagramProps } from "@/types/components/shared";

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
  | "autoFitOffsetX"
  | "autoFitOffsetY"
> & {
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
