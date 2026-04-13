import * as React from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

type PathForgerToolbarProps = {
  hasStory: boolean;
  chapterModalOpen: boolean;
  pathLedgerModalOpen: boolean;
  onToggleStory: () => void;
  onOpenJourney: () => void;
};

export default function PathForgerToolbar(props: PathForgerToolbarProps) {
  const {
    hasStory,
    chapterModalOpen,
    pathLedgerModalOpen,
    onToggleStory,
    onOpenJourney,
  } = props;

  return (
    <Box
      sx={(theme) => ({
        position: "fixed",
        left: 0,
        right: 0,
        bottom: { xs: 10, md: 14 },
        zIndex: theme.zIndex.appBar - 1,
        pointerEvents: "none",
      })}
    >
      <Container maxWidth="xl" sx={{ display: "flex", justifyContent: "center" }}>
        <Paper
          variant="outlined"
          sx={(theme) => ({
            px: 1.5,
            py: 1.25,
            pointerEvents: "auto",
            backdropFilter: "blur(8px)",
            backgroundColor: theme.palette.background.paper,
          })}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Tooltip title="Show story">
              <span>
                <Button
                  variant="outlined"
                  size="large"
                  aria-label="Show story"
                  onClick={onToggleStory}
                  disabled={!hasStory}
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
                    <Typography component="span" sx={{ fontSize: "1.35rem", lineHeight: 1 }}>
                      📖
                    </Typography>
                  }
                >
                  View Story
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
                  disabled={!hasStory}
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
                    <Typography component="span" sx={{ fontSize: "1.35rem", lineHeight: 1 }}>
                      🧭
                    </Typography>
                  }
                >
                  View Journey
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
