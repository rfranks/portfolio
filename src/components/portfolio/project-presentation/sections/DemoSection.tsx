"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { DemoSlide, MediaCycler } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { withBasePath } from "@/utils/basePath";

export type ResolvedProjectTerminalDemo = {
  title: string;
  subtitle?: string;
  caption: string;
  mediaType: "video" | "image";
  mediaUrl: string;
  mediaAlt?: string;
};

type DemoSectionProps = {
  useSharedDemoSlide: boolean;
  isPodcastsLayout: boolean;
  terminalDemo: ResolvedProjectTerminalDemo | null;
  demoItems: MediaCyclerItem[];
  activeDemoMediaKey?: string;
  onSelectDemoMediaKey: (key: string) => void;
  navigationControlSx?: SxProps<Theme>;
  expandControlSx?: SxProps<Theme>;
  sharedDemoVideoMaxHeight: { xs: number; sm: number; md: number; lg: number };
  captionSlotSx: SxProps<Theme>;
  captionTextSx: SxProps<Theme>;
};

export default function DemoSection({
  useSharedDemoSlide,
  isPodcastsLayout,
  terminalDemo,
  demoItems,
  activeDemoMediaKey,
  onSelectDemoMediaKey,
  navigationControlSx,
  expandControlSx,
  sharedDemoVideoMaxHeight,
  captionSlotSx,
  captionTextSx,
}: DemoSectionProps) {
  const resolvedDemoItems = demoItems.map((item) => ({
    ...item,
    onSelect: () => {
      onSelectDemoMediaKey(item.key);
    },
  }));
  const sharedDemoMedia = terminalDemo
    ? terminalDemo.mediaType === "video"
      ? {
          type: "video" as const,
          src: withBasePath(terminalDemo.mediaUrl),
          title: terminalDemo.title,
          caption: terminalDemo.caption,
          controls: true,
          playsInline: true,
          preload: "metadata" as const,
          triggerSx: {
            width: "100%",
            height: "auto",
            maxHeight: sharedDemoVideoMaxHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
          },
          previewSx: {
            width: "100%",
            maxWidth: "100%",
            height: "auto",
            maxHeight: sharedDemoVideoMaxHeight,
            objectFit: "contain",
            borderRadius: "16px",
          },
          expandButtonSx: expandControlSx,
        }
      : {
          type: "image" as const,
          src: withBasePath(terminalDemo.mediaUrl),
          alt: terminalDemo.mediaAlt || terminalDemo.title,
          title: terminalDemo.title,
          caption: terminalDemo.caption,
          triggerSx: {
            width: "100%",
            height: "auto",
            maxHeight: sharedDemoVideoMaxHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
          },
          previewSx: {
            width: "100%",
            maxWidth: "100%",
            height: "auto",
            maxHeight: sharedDemoVideoMaxHeight,
            objectFit: "contain",
            borderRadius: "16px",
          },
        }
    : undefined;

  return (
    <Box
      sx={{
        px: { xs: 0, sm: 0, md: 2 },
        py: { xs: 0, sm: 0, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {useSharedDemoSlide && terminalDemo ? (
        <Box sx={{ minHeight: 0, height: "100%", display: "flex", flexDirection: "column" }}>
          <DemoSlide
            title=""
            subtitle=""
            caption={terminalDemo.caption}
            media={sharedDemoMedia}
            contentSx={{
              minHeight: 0,
              flex: isPodcastsLayout ? "0 0 auto" : "1 1 auto",
              display: "flex",
              alignItems: isPodcastsLayout ? "flex-start" : "center",
              justifyContent: isPodcastsLayout ? "flex-start" : "center",
              overflow: isPodcastsLayout ? "visible" : "hidden",
            }}
            captionSlotSx={captionSlotSx}
            captionTextSx={captionTextSx}
          />
        </Box>
      ) : demoItems.length > 0 ? (
        <MediaCycler
          items={resolvedDemoItems}
          singlePanel
          singlePanelActiveKey={activeDemoMediaKey}
          allowSwipe
          showChevronNavigation={demoItems.length > 1}
          loopNavigation={demoItems.length > 1}
          navigationControlSx={navigationControlSx}
          expandControlSx={expandControlSx}
          stackSx={{ minHeight: 0, height: "100%" }}
        />
      ) : null}
    </Box>
  );
}
