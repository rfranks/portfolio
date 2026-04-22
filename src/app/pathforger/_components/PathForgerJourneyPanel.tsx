import * as React from "react";
import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import { MarkdownContent } from "@/components/shared";
import PathForgerJourneyLedgerCarousel from "@/app/pathforger/_components/PathForgerJourneyLedgerCarousel";
import {
  type JourneyLedgerField,
  type JourneyTabPanel,
} from "@/app/pathforger/_types/journeyLedger";
import { buildJourneyLedgerPlaybackEntries } from "@/app/pathforger/_utils/journeyLedger";

type PathForgerJourneyPanelProps = {
  open: boolean;
  onClose: () => void;
  pathLedgerMarkdown: string;
  journeyTabPanels: JourneyTabPanel[];
  journeyTabValue: string;
  onJourneyTabValueChange: (nextValue: string) => void;
  activeJourneyPanel: JourneyTabPanel | null;
  journeySnapshotFields: JourneyLedgerField[];
};

export default function PathForgerJourneyPanel(props: PathForgerJourneyPanelProps) {
  const { open, onClose, pathLedgerMarkdown } = props;

  const carouselEntries = React.useMemo(
    () =>
      buildJourneyLedgerPlaybackEntries({
        previousMarkdown: "",
        nextMarkdown: pathLedgerMarkdown,
      }),
    [pathLedgerMarkdown],
  );
  const [carouselIndex, setCarouselIndex] = React.useState(0);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    setCarouselIndex(0);
  }, [open, pathLedgerMarkdown]);

  const total = carouselEntries.length;
  const currentIndex = total > 0 ? Math.min(carouselIndex, Math.max(total - 1, 0)) : 0;
  const currentEntry = total > 0 ? carouselEntries[currentIndex] : null;
  const isLastEntry = total > 0 && currentIndex >= total - 1;
  const canGoPrevious = total > 0 && currentIndex > 0;
  const canGoNext = total > 0 && currentIndex < total - 1;

  const handlePrevious = React.useCallback(() => {
    setCarouselIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = React.useCallback(() => {
    setCarouselIndex((prev) => Math.min(Math.max(total - 1, 0), prev + 1));
  }, [total]);

  const handleRestart = React.useCallback(() => {
    setCarouselIndex(0);
  }, []);

  if (!open) {
    return null;
  }

  return (
    <Box
      sx={(theme) => ({
        position: "fixed",
        inset: 0,
        zIndex: theme.zIndex.modal + 4,
        display: "flex",
      })}
    >
      <Paper
        variant="outlined"
        sx={{
          border: "none",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 1.5, md: 2.5 },
            py: 1.25,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography variant="h6">🧭 Your Journey So Far...</Typography>
          <IconButton aria-label="Close journey panel" onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            px: { xs: 1.5, md: 2.5 },
            py: 1.5,
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
          }}
        >
          {total > 0 ? (
            <PathForgerJourneyLedgerCarousel
              currentEntry={currentEntry}
              currentIndex={currentIndex}
              total={total}
              chapterNumber={null}
              waitingForChapter={false}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              isLastEntry={isLastEntry}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onLastAction={handleRestart}
              rightActionMode="restart-chevron"
              preparingMessage="Preparing journey details..."
              maxWidth="100%"
              fillHeight
              transparent
              showProgressTitle={false}
            />
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                border: "none",
                backgroundColor: "transparent",
              }}
            >
              <MarkdownContent content={pathLedgerMarkdown} variant="body1" />
            </Paper>
          )}
        </Box>

        <Box
          sx={{
            px: { xs: 1.5, md: 2.5 },
            py: 1.25,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose}>OK</Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
