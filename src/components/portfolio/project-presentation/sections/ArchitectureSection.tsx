"use client";

import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { SubsectionPagerItem } from "@/components/portfolio/layout/SubsectionPager";
import { ArchitectureDiagramsSlide, MediaCycler } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";

type ArchitectureSectionProps = {
  useSharedArchitectureDiagramsSlide: boolean;
  activeDiagramKey?: string;
  diagramPagerItems: SubsectionPagerItem[];
  diagramItems: MediaCyclerItem[];
  hasMultipleArchitectureDiagrams: boolean;
  onSelectArchitectureDiagram: (key: string) => void;
  onPreviousArchitectureDiagram: () => void;
  onNextArchitectureDiagram: () => void;
  projectArchitectureMenuId: string;
  navigationControlSx?: SxProps<Theme>;
  expandControlSx?: SxProps<Theme>;
  onCopyDeepLink?: () => void;
  copyDeepLinkSucceeded?: boolean;
};

export default function ArchitectureSection({
  useSharedArchitectureDiagramsSlide,
  activeDiagramKey,
  diagramPagerItems,
  diagramItems,
  hasMultipleArchitectureDiagrams,
  onSelectArchitectureDiagram,
  onPreviousArchitectureDiagram,
  onNextArchitectureDiagram,
  projectArchitectureMenuId,
  navigationControlSx,
  expandControlSx,
  onCopyDeepLink,
  copyDeepLinkSucceeded,
}: ArchitectureSectionProps) {
  return (
    <Box
      sx={{
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        overflow: "hidden",
      }}
    >
      {useSharedArchitectureDiagramsSlide ? (
        <ArchitectureDiagramsSlide
          activeDiagramKey={activeDiagramKey}
          diagramPagerItems={diagramPagerItems}
          diagramItems={diagramItems}
          suppressMediaHeading
          hasMultipleDiagrams={hasMultipleArchitectureDiagrams}
          onSelectDiagram={onSelectArchitectureDiagram}
          onPreviousDiagram={onPreviousArchitectureDiagram}
          onNextDiagram={onNextArchitectureDiagram}
          rootSx={{
            minHeight: 0,
            height: "100%",
            flex: "1 1 auto",
          }}
          panelSx={{
            width: "100%",
            maxWidth: "1200px",
            minHeight: 0,
            height: "100%",
            flex: "1 1 auto",
            mx: "auto",
            p: 0,
            borderColor: "transparent",
            bgcolor: "transparent",
            backgroundImage: "none",
            boxShadow: "none",
          }}
          menuId={projectArchitectureMenuId}
          previousAriaLabel="Previous architecture diagram"
          nextAriaLabel="Next architecture diagram"
          selectorAriaLabel="Open architecture diagram selector"
          selectedValueAsTitle
          selectedVisualSize={34}
          fallbackTitle="Architecture Diagram"
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
          hostSx={{
            px: { xs: 1, md: 1.5 },
            pt: { xs: 0.75, md: 1 },
            pb: { xs: 1, md: 1.5 },
            minHeight: 0,
            flex: "1 1 auto",
            "& .MuiToolbar-root": {
              border: "1px solid rgba(96, 165, 250, 0.22)",
              borderBottom: 0,
              borderTopLeftRadius: "14px",
              borderTopRightRadius: "14px",
              background:
                "linear-gradient(180deg, rgba(30, 41, 59, 0.94), rgba(15, 23, 42, 0.9)), rgba(15, 23, 42, 0.92)",
              color: "#dbeafe",
            },
            "& .MuiIconButton-root": {
              color: "#dbeafe",
            },
            "& .MuiIconButton-root.Mui-disabled": {
              color: "rgba(148, 163, 184, 0.38)",
            },
            "& .MuiDivider-root": {
              borderColor: "rgba(96, 165, 250, 0.24)",
            },
            "& [id$='-container']": {
              width: "100% !important",
              borderColor: "rgba(96, 165, 250, 0.24)",
              borderRadius: "14px",
              overflow: "hidden",
            },
            "& .diagram-mermaid": {
              width: "100%",
            },
            "& .diagram-mermaid svg": {
              display: "block",
              width: "100%",
              maxWidth: "100%",
              height: "auto",
            },
          }}
          mediaCyclerShowChevronNavigation={false}
          mediaCyclerLoopNavigation={false}
          mediaCyclerAllowSwipe={false}
          mediaCyclerNavigationControlSx={navigationControlSx}
          mediaCyclerExpandControlSx={expandControlSx}
          mediaCyclerStackSx={{ minHeight: 0, height: "100%" }}
          showCopyLinkButton
          onCopyLink={onCopyDeepLink}
          copyLinkCopied={copyDeepLinkSucceeded}
          copyLinkAriaLabel="Copy shareable deep link"
        />
      ) : (
        <Box sx={{ minHeight: 0, flex: "1 1 auto" }}>
          <MediaCycler
            items={diagramItems}
            singlePanel
            singlePanelActiveKey={activeDiagramKey}
            allowSwipe
            showChevronNavigation
            loopNavigation={diagramItems.length > 1}
            navigationControlSx={navigationControlSx}
            stackSx={{ minHeight: 0, height: "100%" }}
          />
        </Box>
      )}
    </Box>
  );
}
