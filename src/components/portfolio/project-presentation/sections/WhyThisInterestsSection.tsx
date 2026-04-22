"use client";

import Box from "@mui/material/Box";
import { DemoSlide, MarkdownContent } from "@/components/shared";

type WhyThisInterestsSectionProps = {
  content: string;
};

export default function WhyThisInterestsSection({ content }: WhyThisInterestsSectionProps) {
  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <DemoSlide
        title=""
        subtitle=""
        contentSx={{
          minHeight: 0,
          height: "100%",
          overflow: "auto",
          pr: 0.3,
        }}
      >
        <MarkdownContent
          content={content}
          variant="body1"
          sx={{
            "& p": { mb: 1.2, lineHeight: 1.6 },
            "& p:last-of-type": { mb: 0 },
          }}
        />
      </DemoSlide>
    </Box>
  );
}
