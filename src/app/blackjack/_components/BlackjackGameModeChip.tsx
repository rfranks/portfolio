"use client";

import * as React from "react";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";
import type { BlackjackRenderState } from "../_types/messages";
import { getGameModeChipClass, getGameModeChipSrc } from "../_utils/helpers";

type BlackjackGameModeChipProps = {
  engineState: BlackjackRenderState;
  onToggleGameMode: () => void;
  className?: string;
  allowWhenLocked?: boolean;
};

export default function BlackjackGameModeChip({
  engineState,
  onToggleGameMode,
  className,
  allowWhenLocked = false,
}: BlackjackGameModeChipProps) {
  const chipClassName = [
    getGameModeChipClass(engineState.gameMode),
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const isInteractive = engineState.canToggleGameMode || allowWhenLocked;

  return (
    <button
      type="button"
      className={chipClassName}
      disabled={!isInteractive}
      onClick={onToggleGameMode}
      title={
        engineState.canToggleGameMode
          ? "Cycle blackjack game mode"
          : allowWhenLocked
            ? "View current game mode details"
            : "Finish the current round before changing mode"
      }
    >
      <Image
        className="blackjack-chip-adornment"
        src={withBasePath(getGameModeChipSrc(engineState.gameMode))}
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
      />
      <span className="blackjack-game-mode-chip-label">Mode</span>
      <span className="blackjack-game-mode-chip-value">
        {engineState.gameModeLabel}
      </span>
    </button>
  );
}
