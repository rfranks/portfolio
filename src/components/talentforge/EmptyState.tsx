"use client";

import Image from "next/image";
import { Box, Typography } from "@mui/material";

interface EmptyStateProps {
  imgSrc: string;
  alt: string;
  message: string;
  helperText?: string;
}

export default function EmptyState({ imgSrc, alt, message, helperText }: EmptyStateProps) {
  return (
    <Box textAlign="center" sx={{ mt: 4 }} aria-label="empty state">
      <Image src={imgSrc} alt={alt} width={200} height={160} />
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

