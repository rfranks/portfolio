import * as React from "react";
import Box from "@mui/material/Box";
import {
  SECTION_TRANSITION_MS,
  sectionSlideInFromLeft,
  sectionSlideInFromRight,
  sectionSlideOutToLeft,
  sectionSlideOutToRight,
} from "@/app/homePageClient.config";

type SectionSurfaceTransitionProps = {
  sectionId?: string;
  displaySectionId: string;
  outgoingSectionId: string | null;
  sectionDirection: 1 | -1;
  isSectionTransitioning: boolean;
  onTouchStart: (event: React.TouchEvent<HTMLElement>) => void;
  onTouchMove: (event: React.TouchEvent<HTMLElement>) => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
  renderSectionContent: (sectionId: string) => React.ReactNode;
};

export default function SectionSurfaceTransition({
  sectionId,
  displaySectionId,
  outgoingSectionId,
  sectionDirection,
  isSectionTransitioning,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  renderSectionContent,
}: SectionSurfaceTransitionProps) {
  return (
    <Box
      component="section"
      id={sectionId}
      sx={{
        minHeight: 0,
        height: "100%",
        flex: "1 1 auto",
        overflow: "hidden",
        pr: { xs: 0, md: 0.5 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        sx={{
          minHeight: 0,
          height: "100%",
          flex: "1 1 auto",
          overflow: "hidden",
          position: "relative",
          "& > .home-section-surface": {
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            minHeight: 0,
            height: "100%",
            overflowY: "auto",
            marginBottom: "0 !important",
          },
        }}
      >
        {outgoingSectionId ? (
          <Box
            className="home-section-surface"
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
              animation: `${sectionDirection > 0 ? sectionSlideOutToLeft : sectionSlideOutToRight} ${SECTION_TRANSITION_MS}ms cubic-bezier(.22,.82,.28,.98) both`,
            }}
          >
            {renderSectionContent(outgoingSectionId)}
          </Box>
        ) : null}
        <Box
          className="home-section-surface"
          key={`incoming-${displaySectionId}-${sectionDirection}`}
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            animation: isSectionTransitioning
              ? `${sectionDirection > 0 ? sectionSlideInFromRight : sectionSlideInFromLeft} ${SECTION_TRANSITION_MS}ms cubic-bezier(.22,.82,.28,.98) both`
              : "none",
          }}
        >
          {renderSectionContent(displaySectionId)}
        </Box>
      </Box>
    </Box>
  );
}
