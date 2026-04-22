"use client";

import * as React from "react";
import { alpha } from "@mui/material/styles";
import {
  ArchitectureDiagramsSlide as SharedArchitectureDiagramsSlide,
  type ArchitectureDiagramsSlideProps,
} from "@/components/shared";

export default function ArchitectureDiagramsSlide(props: ArchitectureDiagramsSlideProps) {
  return (
    <SharedArchitectureDiagramsSlide
      {...props}
      rootId="architecture-diagrams"
      rootClassName="blackjack-diagrams-panel blackjack-carousel-slide"
      panelClassName="mx-auto"
      panelSx={{
        width: "100%",
        maxWidth: "1200px",
        minHeight: 0,
        height: "100%",
        flex: "1 1 auto",
        display: "flex",
        flexDirection: "column",
        mx: "auto",
        overflow: "hidden",
        p: 0,
        mb: 0,
        borderColor: "transparent",
        bgcolor: "transparent",
        backgroundImage: "none",
        boxShadow: "none",
      }}
      menuId="blackjack-architecture-diagram-selector"
      previousAriaLabel="Previous architecture diagram"
      nextAriaLabel="Next architecture diagram"
      selectorAriaLabel="Open architecture diagram selector"
      selectedValueAsTitle
      selectedVisualSize={34}
      topRailSx={{
        mx: 0,
        mt: 0,
        position: "relative",
        zIndex: 6,
        color: (theme) => alpha(theme.palette.common.white, 0.84),
        bgcolor: "transparent !important",
        backgroundColor: "transparent !important",
        backgroundImage: "none !important",
        borderBottom: "0 !important",
        borderColor: "transparent !important",
        backdropFilter: "none !important",
        filter: "none !important",
        boxShadow: "none !important",
        "& .MuiTypography-root": {
          color: (theme) => `${alpha(theme.palette.common.white, 0.84)} !important`,
        },
        "& .MuiChip-root": {
          color: (theme) => `${alpha(theme.palette.common.white, 0.84)} !important`,
        },
        "& .MuiIconButton-root, & .MuiSvgIcon-root": {
          color: (theme) => `${alpha(theme.palette.common.white, 0.84)} !important`,
        },
      }}
      contentSx={{
        minHeight: 0,
        flex: "1 1 auto",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        pt: 0,
        pb: 0,
      }}
      hostClassName="blackjack-diagram-host"
      hostSx={{
        px: { xs: 1, md: 1.5 },
        pt: { xs: 0.75, md: 1 },
        pb: { xs: 1, md: 1.5 },
        minHeight: 0,
        flex: "1 1 auto",
      }}
      mediaCyclerShowChevronNavigation={false}
      mediaCyclerLoopNavigation={false}
      mediaCyclerStackSx={{ minHeight: 0, height: "100%" }}
      fallbackTitle="Architecture Diagram"
      emptyMessage="Architecture diagrams are not available for this project yet."
    />
  );
}

export type { ArchitectureDiagramsSlideProps };
