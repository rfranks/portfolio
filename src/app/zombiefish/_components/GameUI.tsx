import React from "react";
import Box from "@mui/material/Box";
import { withBasePath } from "@/utils/basePath";
import type { ClickEvent } from "@/types/game/events";
import type { GameUIState } from "../_types";
import { useWindowSize } from "@/hooks/window/useWindowSize";
import { BASE_DIMS } from "@/consts/game/dimensions";

export interface GameUIProps {
  ui: GameUIState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleClick: (e: ClickEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
}

// Minimal in-game UI
export function GameUI({
  ui,
  canvasRef,
  handleClick,
  handleContext,
  handleMouseMove,
}: GameUIProps) {
  const { phase, cursor } = ui;
  const screenDims = useWindowSize();
  const scale = screenDims.width / BASE_DIMS.width || 1;

  return (
    <Box position="relative" width="100vw" height="100dvh">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContext}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleClick({
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
        }}
        onMouseMove={handleMouseMove}
        style={{ display: "block", width: "100%", height: "100%", cursor }}
      />
      {phase === "gameover" && (
        <Box
          component="img"
          src={withBasePath("/assets/shooting-gallery/PNG/HUD/text_gameover.png")}
          alt="Game Over"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 300 * scale,
            height: "auto",
            pointerEvents: "none",
          }}
        />
      )}
    </Box>
  );
}

export default GameUI;
