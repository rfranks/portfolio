"use client";

import * as React from "react";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";
import type { BlackjackRoundSnapshot } from "../_types/page";
import { getCardImageSrc } from "../_utils/helpers";
import styles from "./BlackjackGameSlide.module.css";

type BlackjackCardLightboxImage = {
  alt: string;
  src: string;
};

type BlackjackRoundHandsSnapshotProps = {
  onCardClick?: (cardImage: BlackjackCardLightboxImage) => void;
  snapshot: BlackjackRoundSnapshot | null;
};

function renderCards(
  cards: BlackjackRoundSnapshot["dealer"]["cards"],
  scopeLabel: string,
  onCardClick?: (cardImage: BlackjackCardLightboxImage) => void,
) {
  if (!cards.length) {
    return <span className={styles.roundHandsMetaChip}>No cards</span>;
  }

  return (
    <div className={styles.roundHandsCards}>
      {cards.map((card, cardIndex) => {
        const alt = card.masked ? "Facedown card" : `${card.value} of ${card.suit}`;
        const src = withBasePath(getCardImageSrc(card));

        if (onCardClick) {
          return (
            <button
              key={`${scopeLabel}-card-${cardIndex}`}
              type="button"
              className={`${styles.roundHandsCard} ${styles.roundHandsCardButton}`}
              aria-label={`Open card image: ${alt}`}
              onClick={() => onCardClick({ alt, src })}
            >
              <Image src={src} alt={alt} width={30} height={44} />
            </button>
          );
        }

        return (
          <span key={`${scopeLabel}-card-${cardIndex}`} className={styles.roundHandsCard}>
            <Image src={src} alt={alt} width={30} height={44} />
          </span>
        );
      })}
    </div>
  );
}

export default function BlackjackRoundHandsSnapshot({
  onCardClick,
  snapshot,
}: BlackjackRoundHandsSnapshotProps) {
  if (!snapshot) {
    return null;
  }

  return (
    <div className={styles.roundHandsSnapshot}>
      <div className={styles.roundHandsSnapshotHeading}>Final Hands</div>
      <div className={styles.roundHandsList}>
        <div className={styles.roundHandsItem}>
          <div className={styles.roundHandsMeta}>
            <span className={styles.roundHandsLabel}>Dealer</span>
            <span className={styles.roundHandsMetaChip}>{snapshot.dealer.totalLabel}</span>
            {snapshot.dealer.outcomeLabel ? (
              <span className={styles.roundHandsMetaChip}>{snapshot.dealer.outcomeLabel}</span>
            ) : null}
          </div>
          {renderCards(snapshot.dealer.cards, "dealer", onCardClick)}
        </div>
        {snapshot.hands.map((hand) => (
          <div key={`round-hand-${hand.index}`} className={styles.roundHandsItem}>
            <div className={styles.roundHandsMeta}>
              <span className={styles.roundHandsLabel}>
                Hand {hand.index + 1}
                {hand.split ? " (Split)" : ""}
              </span>
              <span className={styles.roundHandsMetaChip}>{hand.totalLabel}</span>
              {hand.outcomeLabel ? (
                <span className={styles.roundHandsMetaChip}>{hand.outcomeLabel}</span>
              ) : null}
            </div>
            {renderCards(hand.cards, `hand-${hand.index}`, onCardClick)}
          </div>
        ))}
      </div>
    </div>
  );
}
