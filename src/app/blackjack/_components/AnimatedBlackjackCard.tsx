"use client";

import * as React from "react";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";
import type { BlackjackCardView } from "../_types/messages";
import { CARD_BACK_SRC } from "../_consts/blackjack";
import { getCardImageSrc } from "../_utils/helpers";

type AnimatedBlackjackCardProps = {
  card: BlackjackCardView;
  alt: string;
  dealIndex: number;
};

export default function AnimatedBlackjackCard({
  card,
  alt,
  dealIndex,
}: AnimatedBlackjackCardProps) {
  const [entered, setEntered] = React.useState(false);
  const [revealed, setRevealed] = React.useState(card.masked);

  React.useEffect(() => {
    setEntered(false);
    setRevealed(card.masked);

    let revealTimeout = 0;
    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
      if (!card.masked) {
        revealTimeout = window.setTimeout(
          () => {
            setRevealed(true);
          },
          220 + dealIndex * 70,
        );
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (revealTimeout) {
        window.clearTimeout(revealTimeout);
      }
    };
  }, [card.masked, card.suit, card.value, dealIndex]);

  return (
    <div
      className={`card blackjack-card${entered ? " blackjack-card--entered" : ""}${revealed ? " blackjack-card--revealed" : ""}`}
    >
      <div className="blackjack-card-inner">
        <div className="blackjack-card-face blackjack-card-face--back">
          <Image
            src={withBasePath(CARD_BACK_SRC)}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 768px) 96px, 120px"
          />
        </div>
        <div className="blackjack-card-face blackjack-card-face--front">
          <Image
            src={withBasePath(getCardImageSrc(card))}
            alt={alt}
            fill
            sizes="(max-width: 768px) 96px, 120px"
          />
        </div>
      </div>
    </div>
  );
}
