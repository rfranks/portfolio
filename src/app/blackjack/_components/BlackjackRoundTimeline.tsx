"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Dialog } from "@mui/material";
import { withBasePath } from "@/utils/basePath";
import type { BlackjackRoundTimelineEntry } from "../_types/page";
import { getCardImageSrc } from "../_utils/helpers";
import styles from "./BlackjackGameSlide.module.css";

type BlackjackCardLightboxImage = {
  alt: string;
  src: string;
};

type BlackjackRoundTimelineProps = {
  activeRoundNumber: number;
  entries: BlackjackRoundTimelineEntry[];
  onCardClick?: (cardImage: BlackjackCardLightboxImage) => void;
  variant: "panel" | "modal";
};

export default function BlackjackRoundTimeline({
  activeRoundNumber,
  entries,
  onCardClick,
  variant,
}: BlackjackRoundTimelineProps) {
  const [lightboxCard, setLightboxCard] = React.useState<{ alt: string; src: string } | null>(null);
  const usesLocalLightbox = !onCardClick;

  if (!entries.length) {
    return null;
  }

  const renderCardThumb = (card: NonNullable<BlackjackRoundTimelineEntry["card"]>) => {
    const alt = card.masked ? "Facedown card" : `${card.value} of ${card.suit}`;
    const src = withBasePath(getCardImageSrc(card));

    return (
      <button
        type="button"
        className={`${styles.roundTimelineCardThumb} ${styles.roundTimelineCardThumbButton}`}
        aria-label={`Open card image: ${alt}`}
        onClick={() => {
          const cardImage = { alt, src };
          if (onCardClick) {
            onCardClick(cardImage);
            return;
          }
          setLightboxCard(cardImage);
        }}
      >
        <Image src={src} alt={alt} width={22} height={32} />
      </button>
    );
  };

  return (
    <>
      <div
        className={`${styles.roundTimeline} ${
          variant === "modal" ? styles.roundTimelineModal : styles.roundTimelinePanel
        }`}
      >
        <div className={styles.roundTimelineHeading}>
          {activeRoundNumber > 0
            ? `How Round ${activeRoundNumber} resolved`
            : "How this hand resolved"}
        </div>
        <div
          className={`${styles.roundTimelineList}${variant === "modal" ? ` ${styles.roundTimelineListModal}` : ""}`}
        >
          {entries.map((entry) => {
            const card = entry.card;
            const marker =
              entry.kind === "action"
                ? "🕹️"
                : entry.kind === "decision"
                  ? "🧠"
                  : entry.kind === "payout"
                    ? "💰"
                    : "";
            const isPlayByPlayLine =
              Boolean(card) &&
              Boolean(entry.detail) &&
              (entry.kind === "state" ||
                entry.kind === "action" ||
                /dealt|revealed/i.test(entry.title));

            return (
              <div
                key={entry.id}
                className={`${styles.roundTimelineItem}${marker ? "" : ` ${styles.roundTimelineItemNoMarker}`}`}
              >
                {marker ? (
                  <span className={styles.roundTimelineMarker} aria-hidden>
                    {marker}
                  </span>
                ) : null}
                <div className={styles.roundTimelineBody}>
                  <span className={styles.roundTimelineTitle}>
                    {entry.title}
                    {entry.amountDisplay ? (
                      <span className={styles.roundTimelineAmount}> {entry.amountDisplay}</span>
                    ) : null}
                  </span>
                  {entry.detail && !isPlayByPlayLine ? (
                    <span className={styles.roundTimelineDetail}>{entry.detail}</span>
                  ) : null}
                  {isPlayByPlayLine && card ? (
                    <span className={styles.roundTimelinePlayByPlay}>
                      {renderCardThumb(card)}
                      {entry.detail ? <span>{entry.detail}</span> : null}
                    </span>
                  ) : card ? (
                    renderCardThumb(card)
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {usesLocalLightbox ? (
        <Dialog
          open={Boolean(lightboxCard)}
          onClose={() => setLightboxCard(null)}
          maxWidth={false}
          PaperProps={{
            sx: {
              bgcolor: "transparent",
              boxShadow: "none",
              overflow: "visible",
            },
          }}
        >
          {lightboxCard ? (
            <Box
              sx={{
                p: { xs: 1, md: 2 },
              }}
            >
              <Box
                sx={{
                  width: { xs: 220, sm: 300, md: 360 },
                  maxWidth: "80vw",
                  maxHeight: "80vh",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid rgba(148, 163, 184, 0.45)",
                  boxShadow: "0 16px 36px rgba(2, 8, 23, 0.55)",
                  background: "rgba(2, 6, 23, 0.6)",
                }}
              >
                <Image src={lightboxCard.src} alt={lightboxCard.alt} width={360} height={522} />
              </Box>
            </Box>
          ) : null}
        </Dialog>
      ) : null}
    </>
  );
}
