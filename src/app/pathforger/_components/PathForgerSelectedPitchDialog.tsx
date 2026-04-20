import * as React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { MarkdownContent } from "@/components/shared";
import { toPitchSubtitle } from "@/app/pathforger/_utils/pitchHelpers";
import type { PathForgerPitchChoice } from "@/app/pathforger/_types/pitch";
import type { PathForgerPitchResult } from "@/app/pathforger/_types/pipeline";

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

type PathForgerSelectedPitchDialogProps = {
  open: boolean;
  onClose: () => void;
  visiblePitches: PathForgerPitchResult | null;
  activePitchForModal: PathForgerPitchResult["pitches"][number] | null;
  visibleSelectedPitch: PathForgerPitchChoice | "";
  pitchListContainerRef: React.RefObject<HTMLDivElement | null>;
  pitchCardRefs: React.MutableRefObject<
    Partial<Record<PathForgerPitchChoice, HTMLDivElement | null>>
  >;
  pitchSelectionOutline: {
    top: number;
    height: number;
    opacity: number;
  };
  pitchPanelBorderRadius: number | string;
  onSelectPitch: (pitch: PathForgerPitchChoice) => void;
  onReprompt: () => void | Promise<void>;
  onStart: () => void | Promise<void>;
  isRunning: boolean;
  activeRunAction: ActiveRunAction;
};

export default function PathForgerSelectedPitchDialog(
  props: PathForgerSelectedPitchDialogProps,
) {
  const {
    open,
    onClose,
    visiblePitches,
    activePitchForModal,
    visibleSelectedPitch,
    pitchListContainerRef,
    pitchCardRefs,
    pitchSelectionOutline,
    pitchPanelBorderRadius,
    onSelectPitch,
    onReprompt,
    onStart,
    isRunning,
    activeRunAction,
  } = props;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Select Your Adventure</DialogTitle>
      <DialogContent dividers>
        {visiblePitches ? (
          <>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              {activePitchForModal
                ? activePitchForModal.title
                : visiblePitches.adventureTitle}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 2 }}
            >
              Protagonist: {visiblePitches.protagonistName}
              {visibleSelectedPitch
                ? ` | Selected: ${visibleSelectedPitch}`
                : ""}
            </Typography>

            <Grid container spacing={1.5}>
              <Grid item xs={12} md={5}>
                <Box ref={pitchListContainerRef} sx={{ position: "relative" }}>
                  <Box
                    sx={(theme) => ({
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: pitchSelectionOutline.top,
                      height: pitchSelectionOutline.height,
                      border: "2px solid",
                      borderColor: theme.palette.primary.main,
                      borderRadius: pitchPanelBorderRadius,
                      boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                      opacity: pitchSelectionOutline.opacity,
                      transition:
                        "top 320ms cubic-bezier(0.22, 1, 0.36, 1), " +
                        "height 320ms cubic-bezier(0.22, 1, 0.36, 1), " +
                        "opacity 180ms ease-out",
                      pointerEvents: "none",
                      zIndex: 2,
                    })}
                  />
                  <Stack spacing={1.25}>
                    {visiblePitches.pitches.map((pitch) => {
                      const isSelected = visibleSelectedPitch === pitch.id;
                      return (
                        <Paper
                          key={pitch.id}
                          ref={(node) => {
                            pitchCardRefs.current[pitch.id] = node;
                          }}
                          variant="outlined"
                          onClick={() => {
                            onSelectPitch(pitch.id);
                          }}
                          sx={(theme) => ({
                            p: 1.5,
                            cursor: "pointer",
                            position: "relative",
                            zIndex: 1,
                            borderRadius: pitchPanelBorderRadius,
                            borderColor: "divider",
                            backgroundColor: isSelected
                              ? theme.palette.mode === "dark"
                                ? "rgba(79, 180, 255, 0.12)"
                                : "rgba(79, 180, 255, 0.08)"
                              : "transparent",
                            transition:
                              "background-color 240ms cubic-bezier(0.22, 1, 0.36, 1)",
                          })}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Box
                              sx={(theme) => ({
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                border: "1px solid",
                                borderColor: isSelected
                                  ? theme.palette.primary.main
                                  : "divider",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "1rem",
                                color: isSelected
                                  ? "primary.main"
                                  : "text.primary",
                                flexShrink: 0,
                                animation: isSelected
                                  ? "pathforgerActivePitchBadgeBulge 1.6s ease-in-out infinite"
                                  : "none",
                                "@keyframes pathforgerActivePitchBadgeBulge": {
                                  "0%": {
                                    transform: "scale(1)",
                                  },
                                  "35%": {
                                    transform: "scale(1.12)",
                                  },
                                  "60%": {
                                    transform: "scale(0.96)",
                                  },
                                  "100%": {
                                    transform: "scale(1)",
                                  },
                                },
                              })}
                            >
                              {pitch.id}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle1">
                                {pitch.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {toPitchSubtitle(pitch.markdown)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} md={7}>
                <Paper variant="outlined" sx={{ p: 1.5, minHeight: "100%" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Description:
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: { xs: 280, md: 420 },
                      overflowY: "auto",
                      pr: 0.5,
                    }}
                  >
                    {activePitchForModal ? (
                      <MarkdownContent
                        content={activePitchForModal.markdown}
                        variant="body1"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Select a pitch to view its full description.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 2, py: 1.25 }}>
        <Tooltip title="Reprompt">
          <span>
            <IconButton
              size="small"
              aria-label="Reprompt"
              onClick={onReprompt}
              disabled={isRunning}
              color={activeRunAction === "pitch" ? "primary" : "default"}
              sx={{
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Refresh />
            </IconButton>
          </span>
        </Tooltip>
        <Button variant="outlined" onClick={onStart} disabled={isRunning}>
          Start
        </Button>
      </DialogActions>
    </Dialog>
  );
}
