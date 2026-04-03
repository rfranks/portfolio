import {
  CHIP_BLACK_WHITE_SRC,
  CHIP_BLUE_WHITE_SRC,
  CHIP_GREEN_WHITE_SRC,
  CHIP_RED_WHITE_SRC,
  CHIP_WHITE_BLUE_SRC,
} from "../_consts/blackjack";
import type {
  BlackjackConfettiPiece,
  WinningChipFx,
} from "../_types/page";

const WINNING_CHIP_SOURCES = [
  CHIP_BLUE_WHITE_SRC,
  CHIP_WHITE_BLUE_SRC,
  CHIP_RED_WHITE_SRC,
  CHIP_GREEN_WHITE_SRC,
  CHIP_BLACK_WHITE_SRC,
] as const;

const BLACKJACK_CONFETTI_COLORS = [
  "#facc15",
  "#fb7185",
  "#60a5fa",
  "#4ade80",
  "#f59e0b",
  "#e879f9",
  "#f8fafc",
] as const;

export function createWinningChipFx({
  chipCount,
  tableWidth,
  tableHeight,
  targetX,
  targetY,
}: {
  chipCount: number;
  tableWidth: number;
  tableHeight: number;
  targetX: number;
  targetY: number;
}): WinningChipFx[] {
  return Array.from({ length: chipCount }, (_, index) => {
    const startX = tableWidth * (0.12 + Math.random() * 0.62);
    const startY = tableHeight * (0.16 + Math.random() * 0.42);
    const size = 34 + Math.random() * 18;
    const deltaX = targetX - startX + (Math.random() * 24 - 12);
    const deltaY = targetY - startY + (Math.random() * 18 - 9);

    return {
      id: `winning-chip-${Date.now()}-${index}`,
      chipSrc:
        WINNING_CHIP_SOURCES[
          Math.floor(Math.random() * WINNING_CHIP_SOURCES.length)
        ],
      startX,
      startY,
      deltaX,
      deltaY,
      arcY: -(18 + Math.random() * 34),
      size,
      delayMs: index * 45 + Math.random() * 50,
      durationMs: 720 + Math.random() * 280,
      startRotate: Math.random() * 120 - 60,
      endRotate: Math.random() * 360 + 120,
      startScale: 0.82 + Math.random() * 0.42,
    };
  });
}

export function createBlackjackConfettiPieces(pieceCount: number) {
  return Array.from({ length: pieceCount }, (_, index) => {
    const size = 8 + Math.random() * 12;
    return {
      id: `blackjack-confetti-${Date.now()}-${index}`,
      left: 2 + Math.random() * 96,
      delayMs: Math.random() * 220,
      durationMs: 2100 + Math.random() * 900,
      size,
      driftX: Math.random() * 180 - 90,
      rotateStart: Math.random() * 180 - 90,
      rotateEnd: Math.random() * 900 - 450,
      color:
        BLACKJACK_CONFETTI_COLORS[
          Math.floor(Math.random() * BLACKJACK_CONFETTI_COLORS.length)
        ],
      shape: Math.random() > 0.72 ? "circle" : "rect",
    } satisfies BlackjackConfettiPiece;
  });
}
