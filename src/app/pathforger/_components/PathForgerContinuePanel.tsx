import * as React from "react";
import { Box, Button, Grid, IconButton, Paper, Stack, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import { MarkdownContent } from "@/components/shared";
import { ImageLightbox } from "@/components/shared";
import {
  PathForgerBranchChoice,
  PathForgerChapterResult,
  PathForgerGeneratedImage,
} from "../_types/pipeline";

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

type PathForgerContinuePanelProps = {
  open: boolean;
  statusIsRunning: boolean;
  pathForgingGifSrc: string;
  showOptionSelection: boolean;
  continuePromptMarkdown: string;
  optionBranchOrder: PathForgerBranchChoice[];
  branchChoiceA: PathForgerChapterResult["choices"][number] | null;
  branchChoiceB: PathForgerChapterResult["choices"][number] | null;
  activeOptionBranch: PathForgerBranchChoice | null;
  revealedOptionBranches: Record<PathForgerBranchChoice, boolean>;
  optionRevealTick: Record<PathForgerBranchChoice, number>;
  optionPanelImages: Partial<Record<PathForgerBranchChoice, PathForgerGeneratedImage | undefined>>;
  continueOptionsScrollRef: React.RefObject<HTMLDivElement | null>;
  continueOptionPanelRefs: React.MutableRefObject<
    Partial<Record<PathForgerBranchChoice, HTMLDivElement | null>>
  >;
  onClose: () => void;
  onSelectOptionPanel: (branch: PathForgerBranchChoice) => void;
  onForgeMyPath: () => void | Promise<void>;
  activeRunAction: ActiveRunAction;
  forgeDisabled: boolean;
  kenBurnsImageSx: Record<string, unknown>;
};

export default function PathForgerContinuePanel(props: PathForgerContinuePanelProps) {
  const {
    open,
    statusIsRunning,
    pathForgingGifSrc,
    showOptionSelection,
    continuePromptMarkdown,
    optionBranchOrder,
    branchChoiceA,
    branchChoiceB,
    activeOptionBranch,
    revealedOptionBranches,
    optionRevealTick,
    optionPanelImages,
    continueOptionsScrollRef,
    continueOptionPanelRefs,
    onClose,
    onSelectOptionPanel,
    onForgeMyPath,
    activeRunAction,
    forgeDisabled,
    kenBurnsImageSx,
  } = props;

  if (!open) {
    return null;
  }

  const showPathForgingAnimation =
    statusIsRunning && activeRunAction === "forgePath" && Boolean(activeOptionBranch);

  return (
    <Box
      sx={(theme) => ({
        position: "fixed",
        inset: 0,
        zIndex: theme.zIndex.modal + 2,
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
          <Typography variant="h6">Choose Your Path</Typography>
          <IconButton
            aria-label="Close choose-your-path panel"
            onClick={onClose}
            size="small"
            disabled={statusIsRunning}
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
          {showPathForgingAnimation ? (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, md: 2.5 },
                height: "100%",
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Stack spacing={1.25} alignItems="center">
                <Box
                  component="img"
                  src={pathForgingGifSrc}
                  alt="Forging selected path"
                  sx={{
                    width: { xs: 180, md: 240 },
                    maxWidth: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
                <Typography variant="subtitle2" color="text.secondary">
                  Forging your path...
                </Typography>
              </Stack>
            </Paper>
          ) : null}
          {showOptionSelection ? (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <MarkdownContent content={continuePromptMarkdown} variant="body1" />
              <Grid
                container
                spacing={1.25}
                ref={continueOptionsScrollRef}
                sx={{ mt: 0.5, flex: 1, minHeight: 0, overflowY: "auto" }}
              >
                {optionBranchOrder.map((branch, index) => {
                  const choice = branch === "A" ? branchChoiceA : branchChoiceB;
                  const isActive = activeOptionBranch === branch;
                  const isRevealed = revealedOptionBranches[branch];
                  const revealKey = `${branch}-${optionRevealTick[branch]}`;
                  const panelImage = optionPanelImages[branch];

                  return (
                    <React.Fragment key={`continue-modal-${branch}`}>
                      <Grid item xs={12}>
                        <Paper
                          ref={(node: HTMLDivElement | null) => {
                            continueOptionPanelRefs.current[branch] = node;
                          }}
                          variant="outlined"
                          role="button"
                          aria-disabled={statusIsRunning}
                          tabIndex={statusIsRunning ? -1 : 0}
                          onClick={() => {
                            if (statusIsRunning) {
                              return;
                            }
                            onSelectOptionPanel(branch);
                          }}
                          onKeyDown={(event) => {
                            if (statusIsRunning) {
                              return;
                            }
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onSelectOptionPanel(branch);
                            }
                          }}
                          sx={(theme) => ({
                            p: 1.25,
                            minHeight: 128,
                            cursor: statusIsRunning ? "not-allowed" : "pointer",
                            opacity: statusIsRunning ? 0.72 : 1,
                            borderColor: isActive ? theme.palette.primary.main : "divider",
                            boxShadow: isActive
                              ? `0 0 0 1px ${theme.palette.primary.main}`
                              : "none",
                            transition:
                              "border-color 220ms ease, box-shadow 220ms ease, transform 200ms ease",
                            "&:hover": {
                              transform: statusIsRunning ? "none" : "translateY(-2px)",
                            },
                          })}
                        >
                          <Stack spacing={0.85}>
                            <Box
                              sx={{
                                animation:
                                  "pathforgerSlotReveal 680ms cubic-bezier(0.18, 0.9, 0.22, 1) both",
                                display: "flex",
                              }}
                            >
                              <Typography variant="h6">Option {branch}</Typography>
                              {choice?.label ? (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    alignSelf: "center",
                                    flex: 1,
                                    ml: 1,
                                    textAlign: "right",
                                  }}
                                >
                                  {choice.label}
                                </Typography>
                              ) : null}
                            </Box>
                            <Paper
                              variant="outlined"
                              sx={{
                                width: "100%",
                                height: {
                                  xs: "clamp(132px, 42vw, 220px)",
                                  md: "clamp(180px, 32vh, 320px)",
                                },
                                borderRadius: 1.25,
                                overflow: "hidden",
                                position: "relative",
                                bgcolor: "background.paper",
                              }}
                            >
                              {panelImage ? (
                                <ImageLightbox
                                  src={panelImage.imageDataUrl}
                                  alt={`Option ${branch} preview`}
                                  title={`Option ${branch}`}
                                  caption={choice?.label?.trim() || "Path preview"}
                                  kenBurnsImageSx={kenBurnsImageSx}
                                  stopEventPropagation
                                  previewContainerSx={{
                                    position: "absolute",
                                    inset: 0,
                                  }}
                                />
                              ) : null}
                            </Paper>
                            {isRevealed ? (
                              <Stack key={revealKey} spacing={0.65}>
                                {choice ? (
                                  <Box
                                    sx={{
                                      borderTop: "1px solid",
                                      borderColor: "divider",
                                      pt: 0.65,
                                      animation:
                                        "pathforgerSlotReveal 720ms cubic-bezier(0.18, 0.9, 0.22, 1) both",
                                      animationDelay: "120ms",
                                      "@keyframes pathforgerSlotReveal": {
                                        "0%": {
                                          opacity: 0,
                                          transform: "translateY(120%)",
                                          filter: "blur(5px)",
                                        },
                                        "72%": {
                                          opacity: 1,
                                          transform: "translateY(-5%)",
                                          filter: "blur(0px)",
                                        },
                                        "100%": {
                                          opacity: 1,
                                          transform: "translateY(0%)",
                                          filter: "blur(0px)",
                                        },
                                      },
                                    }}
                                  >
                                    <MarkdownContent
                                      content={choice.riskHudMarkdown}
                                      variant="body2"
                                      riskHudColorize
                                    />
                                  </Box>
                                ) : null}
                              </Stack>
                            ) : null}
                          </Stack>
                        </Paper>
                      </Grid>
                      {index === 0 ? (
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              py: 0.5,
                            }}
                          >
                            <Typography
                              variant="h3"
                              sx={{
                                fontWeight: 800,
                                letterSpacing: "0.08em",
                                color: "text.secondary",
                                textTransform: "uppercase",
                              }}
                            >
                              or
                            </Typography>
                          </Box>
                        </Grid>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </Grid>
            </Paper>
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
          <Button
            variant="contained"
            onClick={onForgeMyPath}
            disabled={forgeDisabled}
            startIcon={
              <Typography component="span" sx={{ fontSize: "1.1rem", lineHeight: 1 }}>
                🛠️
              </Typography>
            }
          >
            {activeRunAction === "forgePath"
              ? `Forging Option ${activeOptionBranch ?? ""}...`
              : "Forge my path!"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
