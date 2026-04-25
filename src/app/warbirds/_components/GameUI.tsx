import React from "react";
import Box from "@mui/material/Box";
import type { ClickEvent } from "@/types/game/events";
import { PowerupType } from "@/types/game/objects";
import {
  SCORE_LABEL_SRC,
  SCORE_DIGIT_PATH,
  SCORE_DIGIT_WIDTH,
  SCORE_DIGIT_HEIGHT,
} from "@/consts/game/ui";
import { ENEMY_COLORS } from "@/consts/game/vehicles";
import { MAX_AMMO, DEFAULT_CURSOR } from "../_constants";
import { useWindowSize } from "@/hooks/window/useWindowSize";
import { BASE_DIMS } from "@/consts/game/dimensions";
import { withBasePath } from "@/utils/basePath";
import { GameUIState } from "../_types";
import { WARBIRDS_POWERUP_DEFAULT_FALLBACK_ASSET_PATH } from "../_utils/powerupSprites";

/**
 * Props for GameUI component.
 */
export interface GameUIProps {
  ui: GameUIState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleClick: (e: ClickEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
  resetGame: () => void;
  getImg: (
    key: string,
  ) =>
    | HTMLImageElement
    | HTMLImageElement[]
    | HTMLImageElement[][]
    | Record<string, HTMLImageElement>
    | Record<string, HTMLImageElement[]>
    | undefined;
}

/**
 * Renders the main in-game UI overlay: ammo, medals, ducks, enemies, score, powerups, and game-over.
 */
export function GameUI({
  ui,
  canvasRef,
  handleClick,
  handleContext,
  resetGame,
  getImg,
}: GameUIProps) {
  const {
    ammo,
    medalCount,
    duckCount,
    enemyCount,
    score,
    crashed,
    frameCount,
    activePowerups,
    cursor,
    phase,
  } = ui;

  const medalFrames = getImg("medalFrames") as HTMLImageElement[][];
  const screenDims = useWindowSize();
  const scale = screenDims.width / BASE_DIMS.width || 1;

  return (
    <Box position="relative" width="100vw" height="100dvh">
      {/* Ammo icons */}
      <Box
        position="absolute"
        top={16 * scale}
        left={16 * scale}
        display="flex"
        zIndex={1}
        onClick={handleContext}
      >
        {Array.from({ length: MAX_AMMO }).map((_, i) => (
          <Box
            key={i}
            component="img"
            src={
              i < ammo
                ? withBasePath("/assets/tanks/PNG/Retina/tank_bullet5.png")
                : withBasePath("/assets/tanks/PNG/Retina/tank_bullet1.png")
            }
            width={64 * scale}
            height={64 * scale}
            sx={{ mr: 1.5 * scale, rotate: "-90deg", cursor: DEFAULT_CURSOR }}
          />
        ))}
      </Box>
      {/* Medal counter */}
      {medalCount > 0 && (
        <Box
          position="absolute"
          top={16 * scale + 32 * scale + 8 * scale}
          left={16 * scale}
          display="flex"
          alignItems="center"
          zIndex={1}
          sx={{ cursor: DEFAULT_CURSOR }}
        >
          <Box
            component="img"
            src={medalFrames[0]?.[0]?.src || withBasePath("/assets/medals/PNG/flat_medal1.png")}
            width={48 * scale}
            height={48 * scale}
            sx={{ mr: 2 * scale }}
          />
          <Box component="span" sx={{ fontSize: 48 * scale, color: "white", fontWeight: "bold" }}>
            x{medalCount}
          </Box>
        </Box>
      )}

      {/* Duck counter */}
      {duckCount > 0 && (
        <Box
          position="absolute"
          top={16 * scale + 32 * scale + 8 * scale + (48 * scale + 8 * scale)}
          left={16 * scale}
          display="flex"
          alignItems="center"
          zIndex={1}
          sx={{ cursor: DEFAULT_CURSOR }}
        >
          <Box
            component="img"
            src={withBasePath("/assets/shooting-gallery/PNG/Objects/duck_brown.png")}
            width={48 * scale}
            height={48 * scale}
            sx={{ mr: 2 * scale }}
          />
          <Box sx={{ fontSize: 48 * scale, color: "white", fontWeight: "bold" }}>x{duckCount}</Box>
        </Box>
      )}

      {/* Enemy-plane counter */}
      {enemyCount > 0 && (
        <Box
          position="absolute"
          top={16 * scale + 32 * scale + 8 * scale + 2 * (48 * scale + 8 * scale)}
          left={16 * scale}
          display="flex"
          alignItems="center"
          zIndex={1}
          sx={{ cursor: DEFAULT_CURSOR }}
        >
          <Box
            component="img"
            src={withBasePath(ENEMY_COLORS[0])}
            width={48 * scale}
            height={48 * scale}
            sx={{ mr: 2 * scale }}
          />
          <Box sx={{ fontSize: 48 * scale, color: "white", fontWeight: "bold" }}>x{enemyCount}</Box>
        </Box>
      )}
      {/* Score display */}
      <Box
        position="absolute"
        top={16 * scale}
        right={16 * scale}
        display="flex"
        alignItems="center"
        zIndex={1}
      >
        <Box
          component="img"
          src={withBasePath(SCORE_LABEL_SRC)}
          alt="Score"
          sx={{ mr: 1 * scale }}
        />
        {String(score)
          .split("")
          .map((d, i) => (
            <Box
              key={i}
              component="img"
              src={withBasePath(`${SCORE_DIGIT_PATH}${d}.png`)}
              alt={d}
              width={SCORE_DIGIT_WIDTH * scale}
              height={SCORE_DIGIT_HEIGHT * scale}
              sx={{ mr: 0.5 * scale }}
            />
          ))}
      </Box>
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
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor,
        }}
      />
      {/* Game Over overlay */}
      {crashed && phase === "playing" && (
        <Box
          component="img"
          src={withBasePath("/assets/shooting-gallery/PNG/HUD/text_gameover.png")}
          alt="Game Over"
          onClick={resetGame}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 450 * scale,
            height: "auto",
            cursor: DEFAULT_CURSOR,
          }}
        />
      )}
      {/* Active Powerups */}
      {!crashed && (
        <Box
          position="absolute"
          bottom={16 * scale}
          right={16 * scale}
          display="flex"
          gap={1 * scale}
          zIndex={2}
        >
          {(Object.keys(activePowerups) as PowerupType[])
            .filter((t) => activePowerups[t].expires > frameCount)
            .map((t) => {
              const timeLeft = activePowerups[t].expires - frameCount;
              const flash = timeLeft < 60 && timeLeft % 10 < 5;
              const powerupImgs = getImg("powerupImgs") as Record<string, HTMLImageElement>;
              const fallbackImgSrc =
                powerupImgs.shield?.src ||
                withBasePath(WARBIRDS_POWERUP_DEFAULT_FALLBACK_ASSET_PATH);
              const imgSrc = powerupImgs[t]?.src || fallbackImgSrc;

              return (
                <Box
                  key={t}
                  component="img"
                  src={imgSrc}
                  width={64 * scale}
                  height={64 * scale}
                  sx={{ opacity: flash ? 0.3 : 1 }}
                />
              );
            })}
        </Box>
      )}
    </Box>
  );
}

export default GameUI;
