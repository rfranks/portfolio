"use client";

import * as React from "react";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";
import {
  CHIP_GREEN_WHITE_SRC,
  CHIP_WHITE_BLUE_SRC,
} from "../_consts/blackjack";
import type { BlackjackRenderState } from "../_types/messages";
import ChipDecoratedValue from "./ChipDecoratedValue";

type BlackjackBonusWagerChipProps = {
  engineState: BlackjackRenderState;
  onCycleBonusWager: () => void;
  fallbackWager?: number;
  className?: string;
  label?: string;
  presentation?: "compact" | "mode-chip";
  showChipIcon?: boolean;
  showBorder?: boolean;
};

export default function BlackjackBonusWagerChip({
  engineState,
  onCycleBonusWager,
  fallbackWager,
  className,
  label,
  presentation = "compact",
  showChipIcon = false,
  showBorder = true,
}: BlackjackBonusWagerChipProps) {
  const selectedBonusWager =
    engineState.player?.selectedBonusWager ?? fallbackWager ?? 10;
  const canCycleBonusWager = engineState.askingToDeal;
  const formattedWager = `$${selectedBonusWager}`;

  if (presentation === "mode-chip") {
    const chipClassName = [
      "blackjack-game-mode-chip",
      "blackjack-bonus-wager-chip",
      !showBorder ? "blackjack-wager-chip--borderless" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        type="button"
        className={chipClassName}
        disabled={!canCycleBonusWager}
        onClick={onCycleBonusWager}
        aria-label={`Cycle bonus wager amount. Current bonus wager ${selectedBonusWager} dollars`}
        title={
          canCycleBonusWager
            ? "Cycle bonus wager between $0, $5, and $10"
            : "Finish the current round before changing bonus wager"
        }
      >
        {showChipIcon ? (
          <Image
            className="blackjack-chip-adornment"
            src={withBasePath(CHIP_GREEN_WHITE_SRC)}
            alt=""
            aria-hidden="true"
            width={20}
            height={20}
          />
        ) : null}
        {label ? (
          <span className="blackjack-game-mode-chip-label">{label}</span>
        ) : null}
        <span className="blackjack-game-mode-chip-value">{formattedWager}</span>
      </button>
    );
  }

  const chip = (
    <ChipDecoratedValue
      className={[
        className,
        "blackjack-hand-note blackjack-money-chip",
        canCycleBonusWager ? "blackjack-money-chip--interactive" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      chipSrc={selectedBonusWager > 0 ? CHIP_GREEN_WHITE_SRC : CHIP_WHITE_BLUE_SRC}
    >
      {formattedWager}
    </ChipDecoratedValue>
  );

  if (!canCycleBonusWager) {
    return chip;
  }

  return (
    <button
      type="button"
      className="blackjack-chip-button"
      onClick={onCycleBonusWager}
      aria-label={`Cycle bonus wager amount. Current bonus wager ${selectedBonusWager} dollars`}
      title="Cycle bonus wager between $0, $5, and $10"
    >
      {chip}
    </button>
  );
}
