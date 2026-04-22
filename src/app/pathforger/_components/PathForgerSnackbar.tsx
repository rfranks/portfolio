import * as React from "react";
import { Alert, Box, CircularProgress, Snackbar } from "@mui/material";

type PathForgerSnackbarProps = {
  open: boolean;
  isRunning: boolean;
  message: string;
};

export default function PathForgerSnackbar(props: PathForgerSnackbarProps) {
  const { open, isRunning, message } = props;

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      onClose={() => {
        // Status is controlled by pipeline lifecycle and is not user-dismissible.
      }}
    >
      <Alert
        severity="info"
        variant="filled"
        icon={
          <Box
            component="span"
            sx={(theme) => ({
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              animation: isRunning ? "pathforgerStatusShimmer 1.35s ease-in-out infinite" : "none",
              willChange: isRunning ? "opacity, color" : "auto",
              "@keyframes pathforgerStatusShimmer": {
                "0%": {
                  opacity: 0.8,
                  color: "rgba(255,255,255,0.82)",
                },
                "50%": {
                  opacity: 1,
                  color: theme.palette.common.white,
                },
                "100%": {
                  opacity: 0.8,
                  color: "rgba(255,255,255,0.82)",
                },
              },
            })}
          >
            <CircularProgress size={16} thickness={6} sx={{ color: "currentColor" }} />
          </Box>
        }
        sx={{ alignItems: "center" }}
      >
        <Box
          component="span"
          sx={(theme) => ({
            display: "inline-block",
            overflowWrap: "anywhere",
            animation: isRunning ? "pathforgerStatusShimmer 1.35s ease-in-out infinite" : "none",
            willChange: isRunning ? "opacity, color" : "auto",
            "@keyframes pathforgerStatusShimmer": {
              "0%": {
                opacity: 0.8,
                color: "rgba(255,255,255,0.82)",
              },
              "50%": {
                opacity: 1,
                color: theme.palette.common.white,
              },
              "100%": {
                opacity: 0.8,
                color: "rgba(255,255,255,0.82)",
              },
            },
          })}
        >
          {message}
        </Box>
      </Alert>
    </Snackbar>
  );
}
