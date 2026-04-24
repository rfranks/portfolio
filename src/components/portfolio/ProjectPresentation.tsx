"use client";

import { Suspense, lazy, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SubsectionPager from "@/components/portfolio/layout/SubsectionPager";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import { PanelFrame } from "@/components/shared";
import type { ProjectData, ProjectPresentationSectionKey } from "@/types/components/portfolio";
import { useProjectPresentationController } from "./project-presentation/hooks/useProjectPresentationController";
import { resolveRouteAwareMediaPrefetch } from "./project-presentation/prefetchPlanner";
import { prefetchMediaTypeByIntent } from "@/components/shared/media/media-cycler/rendererRegistry";

const ArchitectureSection = lazy(
  () => import("./project-presentation/sections/ArchitectureSection"),
);
const DemoSection = lazy(() => import("./project-presentation/sections/DemoSection"));
const OverviewSection = lazy(() => import("./project-presentation/sections/OverviewSection"));
const SpecificationsSection = lazy(
  () => import("./project-presentation/sections/SpecificationsSection"),
);
const TechnologiesSection = lazy(
  () => import("./project-presentation/sections/TechnologiesSection"),
);
const WhyThisInterestsSection = lazy(
  () => import("./project-presentation/sections/WhyThisInterestsSection"),
);

const SECTION_MODULE_LOADERS: Record<ProjectPresentationSectionKey, () => Promise<unknown>> = {
  overview: () => import("./project-presentation/sections/OverviewSection"),
  why: () => import("./project-presentation/sections/WhyThisInterestsSection"),
  demo: () => import("./project-presentation/sections/DemoSection"),
  technologies: () => import("./project-presentation/sections/TechnologiesSection"),
  specifications: () => import("./project-presentation/sections/SpecificationsSection"),
  diagrams: () => import("./project-presentation/sections/ArchitectureSection"),
};

export type { ProjectData, Technology } from "@/types/components/portfolio";

interface ProjectPresentationProps {
  project: ProjectData;
}

export default function ProjectPresentation({ project }: ProjectPresentationProps) {
  const controller = useProjectPresentationController(project);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !controller.deepLinkInitialized ||
      controller.pagerItems.length === 0
    ) {
      return;
    }

    const { sectionKeys, mediaTypes } = resolveRouteAwareMediaPrefetch({
      activeSectionKey: controller.activeSectionKey,
      pagerItems: controller.pagerItems,
      prefetchPlan: controller.presentationPrefetchPlan,
      lookahead: controller.sectionNavigationDirection === "neutral" ? 1 : 2,
      navigationDirection: controller.sectionNavigationDirection,
    });

    const prefetch = () => {
      sectionKeys.forEach((stageKey) => {
        void SECTION_MODULE_LOADERS[stageKey]().catch(() => undefined);
        if (stageKey === "diagrams") {
          void import("mermaid").catch(() => undefined);
          void import("@/components/shared/content/PDFContent").catch(() => undefined);
        }
        if (stageKey === "overview") {
          void import("dnaviz").catch(() => undefined);
        }
      });
      mediaTypes.forEach((mediaType) => {
        prefetchMediaTypeByIntent(mediaType);
      });
    };

    if ("requestIdleCallback" in globalThis) {
      const idleId = globalThis.requestIdleCallback(prefetch, { timeout: 800 });
      return () => globalThis.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetch, 140);
    return () => globalThis.clearTimeout(timeoutId);
  }, [
    controller.activeSectionKey,
    controller.deepLinkInitialized,
    controller.pagerItems,
    controller.presentationPrefetchPlan,
    controller.sectionNavigationDirection,
  ]);

  const renderActiveSection = () => {
    if (!controller.deepLinkInitialized) {
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">Restoring presentation state...</Typography>
        </Box>
      );
    }

    switch (controller.activeSectionKey) {
      case "overview":
        return (
          <OverviewSection
            useSharedOverviewSlide={controller.useSharedOverviewSlide}
            overviewItems={controller.overviewItems}
            activeOverviewMediaKey={controller.activeOverviewMediaKey}
            onSelectOverviewMediaKey={controller.setActiveOverviewMediaKey}
            navigationControlSx={controller.projectPresentationNavigationControlSx}
            expandControlSx={controller.projectPresentationExpandControlSx}
          />
        );
      case "why":
        return <WhyThisInterestsSection content={project.interestsMeWhy ?? ""} />;
      case "demo":
        return (
          <DemoSection
            useSharedDemoSlide={controller.useSharedDemoSlide}
            isPodcastsLayout={controller.isPodcastsLayout}
            terminalDemo={controller.projectTerminalDemo}
            demoItems={controller.demoItems}
            activeDemoMediaKey={controller.activeDemoMediaKey}
            onSelectDemoMediaKey={controller.setActiveDemoMediaKey}
            navigationControlSx={controller.projectPresentationNavigationControlSx}
            expandControlSx={controller.projectPresentationExpandControlSx}
            sharedDemoVideoMaxHeight={controller.sharedDemoVideoMaxHeight}
            captionSlotSx={controller.demoCaptionSlotSx}
            captionTextSx={controller.demoCaptionTextSx}
          />
        );
      case "technologies":
        return (
          <TechnologiesSection
            menuIdPrefix={project.project.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
            categories={controller.technologyCompetencyCategories}
          />
        );
      case "specifications":
        return (
          <SpecificationsSection
            specifications={project.specifications}
            useSharedDemoSlide={controller.useSharedDemoSlide}
          />
        );
      case "diagrams":
        return (
          <ArchitectureSection
            useSharedArchitectureDiagramsSlide={controller.useSharedArchitectureDiagramsSlide}
            activeDiagramKey={controller.activeDiagramKey}
            diagramPagerItems={controller.diagramPagerItems}
            diagramItems={controller.diagramItems}
            hasMultipleArchitectureDiagrams={controller.hasMultipleArchitectureDiagrams}
            onSelectArchitectureDiagram={controller.handleSelectArchitectureDiagramMeasured}
            onPreviousArchitectureDiagram={controller.handlePreviousArchitectureDiagramMeasured}
            onNextArchitectureDiagram={controller.handleNextArchitectureDiagramMeasured}
            projectArchitectureMenuId={controller.projectArchitectureMenuId}
            navigationControlSx={controller.projectPresentationNavigationControlSx}
            expandControlSx={controller.projectPresentationExpandControlSx}
            onCopyDeepLink={controller.handleCopyDeepLink}
            copyDeepLinkSucceeded={controller.copyDeepLinkSucceeded}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PortfolioPanel
      sx={{
        px: 0,
        py: { xs: 0, sm: 0, md: 1.25 },
        mb: "0 !important",
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <PanelFrame
        useNegativeTopRailMargins
        topRailSx={{
          minHeight: { xs: 78, md: 86 },
          display: "flex",
          alignItems: "center",
          bgcolor: "transparent",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "none",
          boxShadow: "none",
        }}
        topRail={
          controller.hasMultipleSections ? (
            <Box sx={{ width: "100%" }}>
              <SubsectionPager
                menuId="project-showcase-section-selector"
                items={controller.pagerItems}
                currentKey={controller.activeSectionKey}
                selectedValueAsTitle
                showSelectedVisualOnSmallScreens
                selectedVisualSize={56}
                selectedIconFontSize="1.5rem"
                selectedEmojiFontSize="2.66rem"
                optionVisualSize={42.5}
                optionEmojiFontSize="1.465rem"
                selectedEmojiAnimation="random"
                iconFrameStyle="none"
                previousAriaLabel="Previous project section"
                nextAriaLabel="Next project section"
                selectorAriaLabel="Open project section selector"
                previousButtonSx={{
                  ml: { xs: 1, md: 1.25 },
                }}
                onSelect={(key) =>
                  controller.handleSelectSection(key as ProjectPresentationSectionKey)
                }
                onPrevious={controller.handlePreviousSectionMeasured}
                onNext={controller.handleNextSectionMeasured}
              />
            </Box>
          ) : (
            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 1.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {controller.activeSectionWithIcon?.icon}
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {controller.activeSectionWithIcon?.title ?? "Overview"}
                </Typography>
              </Box>
            </Box>
          )
        }
        rootSx={{ minHeight: 0, height: "100%" }}
      >
        <Box
          sx={{
            minHeight: 0,
            flex: "1 1 auto",
            height: "100%",
            overflow: "hidden",
            overflowX: "hidden",
          }}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                }}
              >
                <Typography variant="body2">Loading section...</Typography>
              </Box>
            }
          >
            {renderActiveSection()}
          </Suspense>
        </Box>
      </PanelFrame>
    </PortfolioPanel>
  );
}
