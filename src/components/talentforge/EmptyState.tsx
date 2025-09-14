"use client";

import Image from "next/image";
import { Box, Typography } from "@mui/material";

interface EmptyStateProps {
  text: string;
  illustration?: string;
}

export default function EmptyState({
  text,
  illustration = "/images/projects/bookworm.svg",
}: EmptyStateProps) {
  return (
    <Box textAlign="center" sx={{ mt: 4 }} aria-live="polite">
      <Image
        src={illustration}
        alt=""
        width={120}
        height={120}
        aria-hidden
      />
      <Typography variant="body1" sx={{ mt: 2 }}>
        {text}
      </Typography>
    </Box>
  );
}

