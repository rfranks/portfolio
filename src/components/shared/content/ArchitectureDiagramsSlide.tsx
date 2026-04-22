"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import SubsectionPager, {
  type SubsectionPagerItem,
} from "@/components/portfolio/layout/SubsectionPager";
import { MediaCycler } from "@/components/shared/media";
import type { MediaCyclerItem } from "@/components/shared/media";
import PortfolioPanelShell from "./PortfolioPanelShell";

type ArchitectureDiagramsSlideProps = {
  activeDiagramKey?: string;
  diagramPagerItems: SubsectionPagerItem[];
  diagramItems: MediaCyclerItem[];
  hasMultipleDiagrams?: boolean;
  onSelectDiagram: (key: string) => void;
  onPreviousDiagram: () => void;
  onNextDiagram: () => void;
  setSlideRef?: (node: HTMLElement | null) => void;
  rootId?: string;
  rootClassName?: string;
  rootSx?: SxProps<Theme>;
  panelClassName?: string;
  panelSx?: SxProps<Theme>;
  topRailSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  hostClassName?: string;
  hostSx?: SxProps<Theme>;
  menuId?: string;
  previousAriaLabel?: string;
  nextAriaLabel?: string;
  selectorAriaLabel?: string;
  fallbackTitle?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  selectedValueAsTitle?: boolean;
  selectedVisualSize?: number;
  mediaCyclerStackSx?: SxProps<Theme>;
  mediaCyclerShowChevronNavigation?: boolean;
  mediaCyclerLoopNavigation?: boolean;
  mediaCyclerAllowSwipe?: boolean;
  mediaCyclerNavigationControlSx?: SxProps<Theme>;
  mediaCyclerExpandControlSx?: SxProps<Theme>;
  suppressMediaHeading?: boolean;
};

const toSxArray = (value?: SxProps<Theme>) => {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

export default function ArchitectureDiagramsSlide({
  activeDiagramKey,
  diagramPagerItems,
  diagramItems,
  hasMultipleDiagrams,
  onSelectDiagram,
  onPreviousDiagram,
  onNextDiagram,
  setSlideRef,
  rootId,
  rootClassName,
  rootSx,
  panelClassName,
  panelSx,
  topRailSx,
  contentSx,
  hostClassName,
  hostSx,
  menuId = "architecture-diagram-selector",
  previousAriaLabel = "Previous architecture diagram",
  nextAriaLabel = "Next architecture diagram",
  selectorAriaLabel = "Open architecture diagram selector",
  fallbackTitle = "Architecture Diagram",
  emptyMessage = "Architecture diagrams are not available for this project yet.",
  selectedValueAsTitle = true,
  selectedVisualSize = 34,
  mediaCyclerStackSx,
  mediaCyclerShowChevronNavigation = false,
  mediaCyclerLoopNavigation = false,
  mediaCyclerAllowSwipe = false,
  mediaCyclerNavigationControlSx,
  mediaCyclerExpandControlSx,
  suppressMediaHeading = false,
}: ArchitectureDiagramsSlideProps) {
  const resolvedHasMultipleDiagrams =
    hasMultipleDiagrams ?? Math.max(diagramPagerItems.length, diagramItems.length) > 1;
  const rootSxArray = toSxArray(rootSx);
  const panelSxArray = toSxArray(panelSx);
  const topRailSxArray = toSxArray(topRailSx);
  const contentSxArray = toSxArray(contentSx);
  const hostSxArray = toSxArray(hostSx);
  const mediaCyclerStackSxArray = toSxArray(mediaCyclerStackSx);
  const renderedDiagramItems = React.useMemo(
    () =>
      suppressMediaHeading
        ? diagramItems.map((item) => ({
            ...item,
            mediaLightboxTitle: item.mediaLightboxTitle || item.title,
            title: "",
            description: undefined,
          }))
        : diagramItems,
    [diagramItems, suppressMediaHeading],
  );

  return (
    <Box
      component="section"
      id={rootId}
      ref={setSlideRef}
      className={rootClassName}
      sx={[
        {
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "transparent",
          backgroundColor: "transparent",
          backgroundImage: "none",
          boxShadow: "none",
          backdropFilter: "none",
          filter: "none",
        },
        ...rootSxArray,
      ]}
    >
      <PortfolioPanelShell
        panelClassName={panelClassName}
        panelSx={[
          {
            width: "100%",
            minHeight: 0,
            height: "100%",
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "transparent",
            backgroundColor: "transparent",
            backgroundImage: "none",
            borderColor: "transparent",
            boxShadow: "none",
            backdropFilter: "none",
            filter: "none",
          },
          ...panelSxArray,
        ]}
        topRail={
          resolvedHasMultipleDiagrams ? (
            <SubsectionPager
              menuId={menuId}
              items={diagramPagerItems}
              currentKey={activeDiagramKey}
              selectedValueAsTitle={selectedValueAsTitle}
              selectedVisualSize={selectedVisualSize}
              selectedIconFrameStyle="none"
              borderlessIconButtons
              flatIconButtons
              previousAriaLabel={previousAriaLabel}
              nextAriaLabel={nextAriaLabel}
              selectorAriaLabel={selectorAriaLabel}
              onSelect={onSelectDiagram}
              onPrevious={onPreviousDiagram}
              onNext={onNextDiagram}
            />
          ) : (
            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 1.25 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {fallbackTitle}
              </Typography>
            </Box>
          )
        }
        useNegativeTopRailMargins={false}
        topRailSx={[
          {
            mx: 0,
            mt: 0,
            position: "relative",
            zIndex: 2,
            bgcolor: "transparent !important",
            backgroundColor: "transparent !important",
            backgroundImage: "none !important",
            borderBottom: "0 !important",
            borderColor: "transparent !important",
            boxShadow: "none !important",
            backdropFilter: "none !important",
            filter: "none !important",
          },
          ...topRailSxArray,
        ]}
        contentSx={[
          {
            minHeight: 0,
            flex: "1 1 auto",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            pt: 0,
            pb: 0,
            bgcolor: "transparent",
            backgroundColor: "transparent",
            backgroundImage: "none",
            boxShadow: "none",
            backdropFilter: "none",
            filter: "none",
          },
          ...contentSxArray,
        ]}
      >
        <Box
          className={hostClassName}
          sx={[
            {
              px: { xs: 1, md: 1.5 },
              pt: { xs: 0.75, md: 1 },
              pb: { xs: 1, md: 1.5 },
              minHeight: 0,
              flex: "1 1 auto",
              bgcolor: "transparent",
              backgroundColor: "transparent",
              backgroundImage: "none",
              boxShadow: "none",
              backdropFilter: "none",
              filter: "none",
            },
            ...hostSxArray,
          ]}
        >
          {renderedDiagramItems.length > 0 ? (
            <MediaCycler
              items={renderedDiagramItems}
              singlePanel
              singlePanelActiveKey={activeDiagramKey}
              showChevronNavigation={mediaCyclerShowChevronNavigation}
              loopNavigation={mediaCyclerLoopNavigation}
              allowSwipe={mediaCyclerAllowSwipe}
              navigationControlSx={mediaCyclerNavigationControlSx}
              expandControlSx={mediaCyclerExpandControlSx}
              stackSx={[{ minHeight: 0, height: "100%" }, ...mediaCyclerStackSxArray]}
            />
          ) : (
            <Box
              sx={{
                minHeight: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {emptyMessage}
              </Typography>
            </Box>
          )}
        </Box>
      </PortfolioPanelShell>
    </Box>
  );
}

export type { ArchitectureDiagramsSlideProps };
