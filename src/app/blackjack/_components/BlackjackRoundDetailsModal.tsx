"use client";

import * as React from "react";
import Image from "next/image";
import { Box, Dialog } from "@mui/material";
import { createPortal } from "react-dom";
import type { BlackjackRoundSnapshot, BlackjackRoundTimelineEntry } from "../_types/page";
import BlackjackRoundHandsSnapshot from "./BlackjackRoundHandsSnapshot";
import BlackjackRoundTimeline from "./BlackjackRoundTimeline";

type BlackjackCardLightboxImage = {
  alt: string;
  src: string;
};

type BlackjackRoundDetailsModalProps = {
  activeRoundNumber: number;
  closing: boolean;
  entries: BlackjackRoundTimelineEntry[];
  onClose: () => void;
  onModalOk: () => void;
  open: boolean;
  snapshot: BlackjackRoundSnapshot | null;
};

export default function BlackjackRoundDetailsModal({
  activeRoundNumber,
  closing,
  entries,
  onClose,
  onModalOk,
  open,
  snapshot,
}: BlackjackRoundDetailsModalProps) {
  const [lightboxCard, setLightboxCard] = React.useState<BlackjackCardLightboxImage | null>(null);

  React.useEffect(() => {
    if (!open) {
      setLightboxCard(null);
    }
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`blackjack-round-end-modal blackjack-hint-modal${closing ? " blackjack-round-end-modal--closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blackjack-round-details-modal-title"
    >
      <button
        type="button"
        className="blackjack-round-end-modal__backdrop"
        aria-label="Close round details"
        onClick={onClose}
      />
      <div className="blackjack-round-end-modal__panel blackjack-hint-modal__panel blackjack-round-details-modal__panel">
        <h3 id="blackjack-round-details-modal-title" className="blackjack-hint-modal__title">
          Round Details
        </h3>
        <BlackjackRoundHandsSnapshot snapshot={snapshot} onCardClick={setLightboxCard} />
        <div className="blackjack-round-details-modal__timeline-wrap">
          <BlackjackRoundTimeline
            activeRoundNumber={activeRoundNumber}
            entries={entries}
            onCardClick={setLightboxCard}
            variant="modal"
          />
        </div>
        <div className="blackjack-hint-modal__actions">
          <button
            type="button"
            className="blackjack-button blackjack-button-subtle"
            onClick={() => {
              onModalOk();
              onClose();
            }}
          >
            OK
          </button>
        </div>
      </div>
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
    </div>,
    document.body,
  );
}
