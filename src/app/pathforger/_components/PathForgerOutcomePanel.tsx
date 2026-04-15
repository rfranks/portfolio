import * as React from "react";
import { alpha } from "@mui/material/styles";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import MarkdownContent from "@/components/shared/MarkdownContent";
import EmojiGlyph from "@/app/pathforger/_components/EmojiGlyph";
import PathForgerGeneratedImageLightbox from "@/app/pathforger/_components/PathForgerGeneratedImageLightbox";
import type {
  PathForgerBranchChoice,
  PathForgerGeneratedImage,
} from "@/app/pathforger/_types/pipeline";

type ActiveRunAction =
  | "name"
  | "premise"
  | "style"
  | "tone"
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
  activeOptionLabel?: string;
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
    activeOptionLabel,
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
        display: "flex",
      })}
    >
      <Paper
        variant="outlined"
        sx={{
          border: "none",
          width: "100%",
          mx: "auto",
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
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6">{title}</Typography>
          </Box>
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
          <Box
            sx={{
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {activeOptionBranch && outcomeImage ? (
              <Box
                sx={(theme) => ({
                  width: "100%",
                  mb: 2,
                  borderRadius: 1,
                  flexShrink: 0,
                  overflow: "hidden",
                  contain: "paint",
                  position: "relative",
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: alpha(theme.palette.background.paper, 0.42),
                  aspectRatio: { xs: "16 / 9", md: "21 / 9" },
                  maxHeight: { xs: "28vh", md: "34vh" },
                  minHeight: { xs: 148, md: 208 },
                })}
              >
                <PathForgerGeneratedImageLightbox
                  src={outcomeImage.imageDataUrl}
                  alt={`Outcome ${activeOptionBranch} render`}
                  title={`Outcome`}
                  caption={activeOptionLabel?.trim() || "Forged outcome scene"}
                  kenBurnsImageSx={kenBurnsImageSx}
                  previewContainerSx={{
                    position: "absolute",
                    inset: 0,
                  }}
                />
              </Box>
            ) : null}
            {outcomeMarkdown.trim() ? (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  pr: 0.5,
                }}
              >
                <MarkdownContent content={outcomeMarkdown} variant="body1" />
              </Box>
            ) : null}
          </Box>
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
          <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              onClick={onOpenJourney}
              disabled={statusIsRunning}
              startIcon={<ChevronLeft />}
              endIcon={<EmojiGlyph glyph="🧭" />}
            >
              Journey
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
                : `Chapter ${nextChapterNumberLabel}`}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
