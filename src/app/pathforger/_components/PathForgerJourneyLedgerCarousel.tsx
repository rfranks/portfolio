import * as React from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import type { JourneyLedgerPlaybackEntry } from "@/app/pathforger/_types/journeyLedger";

type PathForgerJourneyLedgerCarouselProps = {
  currentEntry: JourneyLedgerPlaybackEntry | null;
  currentIndex: number;
  total: number;
  chapterNumber?: number | null;
  waitingForChapter?: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastEntry: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onLastAction: () => void;
  rightActionMode?: "continue-button" | "restart-chevron";
  lastActionLabel?: string;
  disableLastAction?: boolean;
  preparingMessage?: string;
  maxWidth?: number | string;
  transparent?: boolean;
  fillHeight?: boolean;
  showProgressTitle?: boolean;
};

export default function PathForgerJourneyLedgerCarousel(
  props: PathForgerJourneyLedgerCarouselProps,
) {
  const {
    currentEntry,
    currentIndex,
    total,
    chapterNumber,
    waitingForChapter = false,
    canGoPrevious,
    canGoNext,
    isLastEntry,
    onPrevious,
    onNext,
    onLastAction,
    rightActionMode = "continue-button",
    lastActionLabel = "Continue",
    disableLastAction = false,
    preparingMessage = "Preparing the latest journey ledger updates...",
    maxWidth = 760,
    transparent = false,
    fillHeight = false,
    showProgressTitle = true,
  } = props;

  const playbackKey =
    currentEntry && total > 0
      ? `${currentEntry.key}-${currentIndex}`
      : `ledger-pending-${chapterNumber ?? 0}`;
  const totalLabel = Math.max(total, 1);
  const currentLabel = Math.min(currentIndex + 1, totalLabel);
  const toneColor =
    currentEntry?.tone === "danger"
      ? "error.main"
      : currentEntry?.tone === "warning"
        ? "warning.main"
        : currentEntry?.tone === "positive"
          ? "success.main"
          : "info.main";

  return (
    <Paper
      key={playbackKey}
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth,
        height: fillHeight ? "100%" : "auto",
        minHeight: fillHeight ? 0 : undefined,
        p: { xs: 1.3, md: 1.8 },
        border: transparent ? "none" : undefined,
        backgroundColor: transparent ? "transparent" : undefined,
        boxShadow: transparent ? "none" : undefined,
        animation:
          "pathforgerLedgerPanelIn 240ms cubic-bezier(0.2, 0.9, 0.35, 1) both",
        "@keyframes pathforgerLedgerPanelIn": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Stack spacing={1} sx={{ height: fillHeight ? "100%" : "auto" }}>
        {showProgressTitle ? (
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              {waitingForChapter
                ? "🧭 Tracking Journey Changes..."
                : `🧭 Journey Update ${currentLabel}/${totalLabel}`}
            </Typography>
            {chapterNumber ? (
              <Typography variant="caption" color="text.secondary">
                Chapter {chapterNumber}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
        <Box
          sx={{
            flex: fillHeight ? 1 : undefined,
            minHeight: fillHeight ? 0 : undefined,
            overflowY: fillHeight ? "auto" : undefined,
          }}
        >
          {currentEntry ? (
            <Stack spacing={0.8}>
              <Typography variant="h6" sx={{ color: toneColor }}>
                {currentEntry.emoji} {currentEntry.label}
              </Typography>
              <Stack spacing={0.55}>
                {currentEntry.removedItems.map((item) => (
                  <Typography
                    key={`${playbackKey}-removed-${item}`}
                    variant="body2"
                    sx={{
                      textDecoration: "line-through",
                      color: "text.secondary",
                      opacity: 0.78,
                      animation: "pathforgerLedgerRemoved 260ms ease-out both",
                      "@keyframes pathforgerLedgerRemoved": {
                        from: {
                          opacity: 0,
                          transform: "translateX(8px)",
                        },
                        to: {
                          opacity: 0.78,
                          transform: "translateX(0)",
                        },
                      },
                    }}
                  >
                    {item}
                  </Typography>
                ))}
                {currentEntry.unchangedItems.map((item) => (
                  <Typography
                    key={`${playbackKey}-unchanged-${item}`}
                    variant="body2"
                    color="text.secondary"
                    sx={{ opacity: 0.88 }}
                  >
                    {item}
                  </Typography>
                ))}
                {currentEntry.addedItems.map((item) => (
                  <Typography
                    key={`${playbackKey}-added-${item}`}
                    variant="body2"
                    sx={{
                      color: "success.main",
                      fontWeight: 600,
                      animation:
                        "pathforgerLedgerAdded 380ms cubic-bezier(0.2, 0.9, 0.35, 1) both",
                      "@keyframes pathforgerLedgerAdded": {
                        from: {
                          opacity: 0,
                          transform: "translateY(12px) scale(0.96)",
                        },
                        to: {
                          opacity: 1,
                          transform: "translateY(0) scale(1)",
                        },
                      },
                    }}
                  >
                    {item}
                  </Typography>
                ))}
                {currentEntry.afterItems.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ opacity: 0.85 }}
                  >
                    No active entries.
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {preparingMessage}
            </Typography>
          )}
        </Box>
        <Stack direction="row" justifyContent="space-between">
          <IconButton
            aria-label="Previous journey update"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            size="small"
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          {rightActionMode === "continue-button" && isLastEntry ? (
            <Button
              variant="contained"
              size="small"
              endIcon={<ChevronRight />}
              onClick={onLastAction}
              disabled={disableLastAction}
            >
              {lastActionLabel}
            </Button>
          ) : (
            <IconButton
              aria-label={
                rightActionMode === "restart-chevron" && isLastEntry
                  ? "Restart journey updates"
                  : "Next journey update"
              }
              onClick={isLastEntry ? onLastAction : onNext}
              disabled={isLastEntry ? disableLastAction : !canGoNext}
              size="small"
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
