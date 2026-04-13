import * as React from "react";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronRight, Close } from "@mui/icons-material";
import MarkdownContent from "@/components/shared/MarkdownContent";
import EmojiGlyph from "@/app/pathforger/_components/EmojiGlyph";
import PathForgerGeneratedImageLightbox from "@/app/pathforger/_components/PathForgerGeneratedImageLightbox";
import type { PathForgerGeneratedImage } from "@/app/pathforger/_types/pipeline";
import { Thinking } from "@/components/shared/Thinking";

type PathForgerChapterPanelProps = {
  open: boolean;
  title: string;
  subtitle: string;
  chapterSpreadImage?: PathForgerGeneratedImage;
  chapterMarkdown: string;
  chapterBodyScrollRef: React.RefObject<HTMLDivElement | null>;
  onChapterBodyScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  chapterReachedEnd: boolean;
  onClose: () => void;
  onProceed: () => void;
  proceedDisabled: boolean;
  kenBurnsImageSx: Record<string, unknown>;
};

export default function PathForgerChapterPanel(
  props: PathForgerChapterPanelProps,
) {
  const {
    open,
    title,
    subtitle,
    chapterSpreadImage,
    chapterMarkdown,
    chapterBodyScrollRef,
    onChapterBodyScroll,
    chapterReachedEnd,
    onClose,
    onProceed,
    proceedDisabled,
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
        zIndex: theme.zIndex.modal + 1,
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
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          <IconButton
            aria-label="Close chapter panel"
            onClick={onClose}
            size="small"
          >
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
            <Box
              sx={(theme) => ({
                width: "100%",
                mb: 2,
                borderRadius: 1,
                flexShrink: 0,
                overflow: "hidden",
                position: "relative",
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: alpha(theme.palette.background.paper, 0.42),
                aspectRatio: { xs: "16 / 9", md: "21 / 9" },
                maxHeight: { xs: "28vh", md: "34vh" },
                minHeight: { xs: 148, md: 208 },
              })}
            >
              {chapterSpreadImage ? (
                <PathForgerGeneratedImageLightbox
                  src={chapterSpreadImage.imageDataUrl}
                  alt="Chapter setup image"
                  kenBurnsImageSx={kenBurnsImageSx}
                  previewContainerSx={{
                    position: "absolute",
                    inset: 0,
                  }}
                />
              ) : (
                <Stack
                  sx={{
                    position: "absolute",
                    inset: 0,
                    px: 1.5,
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <Thinking showIndicator text="Loading chapter art..." />
                </Stack>
              )}
            </Box>
            <Box
              ref={chapterBodyScrollRef}
              onScroll={onChapterBodyScroll}
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                pr: 0.5,
              }}
            >
              <MarkdownContent content={chapterMarkdown} variant="body1" />
            </Box>
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              flexWrap: "wrap",
              justifyContent: "flex-end",
              justifyItems: "flex-end",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {chapterReachedEnd
                ? "Chapter complete. Press Proceed to choose your path."
                : "Scroll to the end of the chapter to Proceed."}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              onClick={onProceed}
              disabled={proceedDisabled}
              variant="contained"
              startIcon={<EmojiGlyph glyph="🧭" />}
              endIcon={<ChevronRight />}
            >
              Proceed
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
