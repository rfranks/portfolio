"use client";

import InboxIcon from "@mui/icons-material/Inbox";
import { Box, Typography } from "@mui/material";

interface EmptyStateProps {
  message: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  message,
  helperText,
  icon = <InboxIcon sx={{ fontSize: 64 }} aria-hidden="true" />,
}: EmptyStateProps) {
  return (
    <Box textAlign="center" sx={{ py: 6 }} role="status" aria-live="polite">
      <Box>{icon}</Box>
      <Typography variant="h6" sx={{ mt: 2 }}>
        {message}
      </Typography>
      {helperText && (
        <Typography variant="body2" color="text.secondary">
          {helperText}
        </Typography>
      )}
    </Box>
  );
}

