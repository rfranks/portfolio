import * as React from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";

type PathForgerToolbarProps = {
  hasStory: boolean;
  createStoryPanelOpen: boolean;
  statusIsRunning: boolean;
  chapterModalOpen: boolean;
  pathLedgerModalOpen: boolean;
  onOpenCreateStory: () => void;
  onToggleStory: () => void;
  onOpenJourney: () => void;
};

export default function PathForgerToolbar(props: PathForgerToolbarProps) {
  const {
    hasStory,
    createStoryPanelOpen,
    statusIsRunning,
    chapterModalOpen,
    pathLedgerModalOpen,
    onOpenCreateStory,
    onToggleStory,
    onOpenJourney,
  } = props;
  const isNewActionDisabled = statusIsRunning;
  const isStoryActionDisabled = !hasStory || statusIsRunning;
  const isJourneyActionDisabled = !hasStory || statusIsRunning;

  return (
    <Box
      className="fixed inset-x-0 bottom-[10px] md:bottom-[14px] pointer-events-none"
      sx={(theme) => ({
        zIndex: theme.zIndex.appBar - 1,
      })}
    >
      <Container maxWidth="xl" className="flex justify-center">
        <Paper
          variant="outlined"
          className="pointer-events-auto px-3 py-2.5"
          sx={(theme) => ({
            backdropFilter: "blur(8px)",
            backgroundColor: theme.palette.background.paper,
            border: "none",
          })}
        >
          <Box className="flex flex-col gap-2 sm:flex-row">
            <Tooltip title="Show story">
              <span>
                <Button
                  variant="outlined"
                  size="large"
                  aria-label="Show story"
                  onClick={onToggleStory}
                  disabled={isStoryActionDisabled}
                  color={chapterModalOpen ? "primary" : "inherit"}
                  sx={{
                    textTransform: "none",
                    px: 4,
                    py: 1.2,
                    minHeight: 56,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    borderWidth: 2,
                    "& .MuiButton-startIcon": {
                      mr: 1,
                    },
                  }}
                  startIcon={
                    <Typography
                      component="span"
                      sx={{ fontSize: "1.35rem", lineHeight: 1 }}
                    >
                      📖
                    </Typography>
                  }
                >
                  Story
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Show path details">
              <span>
                <Button
                  variant="outlined"
                  size="large"
                  aria-label="Show path details"
                  onClick={onOpenJourney}
                  disabled={isJourneyActionDisabled}
                  color={pathLedgerModalOpen ? "primary" : "inherit"}
                  sx={{
                    textTransform: "none",
                    px: 4,
                    py: 1.2,
                    minHeight: 56,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    borderWidth: 2,
                    "& .MuiButton-startIcon": {
                      mr: 1,
                    },
                  }}
                  startIcon={
                    <Typography
                      component="span"
                      sx={{ fontSize: "1.35rem", lineHeight: 1 }}
                    >
                      🧭
                    </Typography>
                  }
                >
                  Journey
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Create your story!">
              <span>
                <Button
                  variant="outlined"
                  size="large"
                  aria-label="Open create story panel"
                  onClick={onOpenCreateStory}
                  disabled={isNewActionDisabled}
                  color={createStoryPanelOpen ? "primary" : "inherit"}
                  sx={{
                    textTransform: "none",
                    px: 3.4,
                    py: 1.2,
                    minHeight: 56,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    borderWidth: 2,
                    "& .MuiButton-startIcon": {
                      mr: 1,
                    },
                  }}
                  startIcon={
                    <Typography
                      component="span"
                      sx={{ fontSize: "1.35rem", lineHeight: 1 }}
                    >
                      ⭐
                    </Typography>
                  }
                >
                  New
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
