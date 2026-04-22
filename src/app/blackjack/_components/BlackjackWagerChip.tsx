"use client";

import * as React from "react";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";
import { CHIP_BLACK_WHITE_SRC } from "../_consts/blackjack";
import type { BlackjackRenderState } from "../_types/messages";
import ChipDecoratedValue from "./ChipDecoratedValue";

type BlackjackWagerChipProps = {
  engineState: BlackjackRenderState;
  onCycleWager: () => void;
  fallbackWager?: number;
  className?: string;
  label?: string;
  presentation?: "compact" | "mode-chip";
  showChipIcon?: boolean;
  showBorder?: boolean;
};

export default function BlackjackWagerChip({
  engineState,
  onCycleWager,
  fallbackWager,
  className,
  label,
  presentation = "compact",
  showChipIcon = false,
  showBorder = true,
}: BlackjackWagerChipProps) {
  const selectedWager =
    engineState.player?.selectedWager ?? fallbackWager ?? engineState.player?.hands[0]?.wager ?? 25;
  const canCycleWager = engineState.askingToDeal;
  const formattedWager = `$${selectedWager}`;

  if (presentation === "mode-chip") {
    const chipClassName = [
      "blackjack-game-mode-chip",
      "blackjack-wager-chip",
      !showBorder ? "blackjack-wager-chip--borderless" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        type="button"
        className={chipClassName}
        disabled={!canCycleWager}
        onClick={onCycleWager}
        aria-label={`Cycle wager amount. Current wager ${selectedWager} dollars`}
        title={
          canCycleWager
            ? "Cycle wager between $25, $50, and $100"
            : "Finish the current round before changing wager"
        }
      >
        {showChipIcon ? (
          <Image
            className="blackjack-chip-adornment"
            src={withBasePath(CHIP_BLACK_WHITE_SRC)}
            alt=""
            aria-hidden="true"
            width={20}
            height={20}
          />
        ) : null}
        {label ? <span className="blackjack-game-mode-chip-label">{label}</span> : null}
        <span className="blackjack-game-mode-chip-value">{formattedWager}</span>
      </button>
    );
  }

  const chip = (
    <ChipDecoratedValue
      className={[
        className,
        "blackjack-hand-meta blackjack-money-chip",
        canCycleWager ? "blackjack-money-chip--interactive" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      chipSrc={CHIP_BLACK_WHITE_SRC}
    >
      {formattedWager}
    </ChipDecoratedValue>
  );

  if (!canCycleWager) {
    return chip;
  }

  return (
    <button
      type="button"
      className="blackjack-chip-button"
      onClick={onCycleWager}
      aria-label={`Cycle wager amount. Current wager ${selectedWager} dollars`}
      title="Cycle wager between $25, $50, and $100"
    >
      {chip}
    </button>
  );
}
