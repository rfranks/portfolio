import * as React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import MarkdownContent from "@/components/shared/MarkdownContent";
import EmojiGlyph from "@/app/pathforger/_components/EmojiGlyph";
import type {
  PathForgerBranchChoice,
  PathForgerGeneratedImage,
} from "@/app/pathforger/_types/pipeline";

type ActiveRunAction =
  | "name"
  | "premise"
  | "style"
  | "pitch"
  | "chapter"
  | "nextChapter"
  | "pipeline"
  | "forgePath"
  | null;

type PathForgerOutcomePanelProps = {
  open: boolean;
  title: string;
  activeOptionBranch: PathForgerBranchChoice | null;
  outcomeImage?: PathForgerGeneratedImage;
  outcomeMarkdown: string;
  statusIsRunning: boolean;
  onOpenJourney: () => void;
  onGenerateNextChapter: () => void | Promise<void>;
  canGenerateNextChapter: boolean;
  activeRunAction: ActiveRunAction;
  nextChapterNumberLabel: string;
  kenBurnsImageSx: Record<string, unknown>;
};

export default function PathForgerOutcomePanel(
  props: PathForgerOutcomePanelProps,
) {
  const {
    open,
    title,
    activeOptionBranch,
    outcomeImage,
    outcomeMarkdown,
    statusIsRunning,
    onOpenJourney,
    onGenerateNextChapter,
    canGenerateNextChapter,
    activeRunAction,
    nextChapterNumberLabel,
    kenBurnsImageSx,
  } = props;

  if (!open) {
    return null;
  }

  return (
    <Box
      sx={(theme) => ({
        position: "fixed",
        inset: 0,
        zIndex: theme.zIndex.modal + 3,
        p: { xs: 1.25, md: 2.5 },
        display: "flex",
      })}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 1200,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
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
          <Typography variant="h6">{title}</Typography>
        </Box>

        <Box
          sx={{
            px: { xs: 1.5, md: 2.5 },
            py: 1.5,
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {activeOptionBranch && outcomeImage ? (
            <Box
              component="img"
              src={outcomeImage.imageDataUrl}
              alt={`Outcome ${activeOptionBranch} render`}
              sx={{
                width: "100%",
                maxHeight: { xs: "30vh", md: "36vh" },
                objectFit: "cover",
                flexShrink: 0,
                ...kenBurnsImageSx,
              }}
            />
          ) : null}
          {outcomeMarkdown.trim() ? (
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}>
              <MarkdownContent content={outcomeMarkdown} variant="body1" />
            </Box>
          ) : null}
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
          <Stack direction="row" spacing={1.25}>
            <Button
              variant="outlined"
              onClick={onOpenJourney}
              disabled={statusIsRunning}
              startIcon={<EmojiGlyph glyph="🧭" />}
            >
              View Journey
            </Button>
            <Button
              variant="contained"
              onClick={onGenerateNextChapter}
              disabled={statusIsRunning || !canGenerateNextChapter}
              startIcon={<EmojiGlyph glyph="📘" />}
              endIcon={<ChevronRight />}
            >
              {activeRunAction === "nextChapter"
                ? `Forging Chapter ${nextChapterNumberLabel}...`
                : `Onto Chapter ${nextChapterNumberLabel}`}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
