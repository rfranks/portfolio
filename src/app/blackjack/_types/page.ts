import { DiagramProps } from "@/types/components/shared";

export type BlackjackCarouselSlideId =
  | "game-card"
  | "why-this-project"
  | "terminal-demo"
  | "architecture-diagrams";

export type BlackjackDiagramConfig = Pick<
  DiagramProps,
  "diagram" | "height" | "title" | "type"
>;

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
