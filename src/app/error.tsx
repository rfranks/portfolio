"use client";

import { useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { createLogger } from "@/utils/observability/logger";

const logger = createLogger("app-error");

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Unhandled application error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        px: 2,
      }}
    >
      <Stack spacing={1.5} sx={{ maxWidth: 560, textAlign: "center" }}>
        <Typography variant="h5">Something went wrong.</Typography>
        <Typography variant="body2" color="text.secondary">
          The app hit an unexpected error. You can retry this view without losing your route.
        </Typography>
        <Box>
          <Button variant="contained" onClick={reset}>
            Retry
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
