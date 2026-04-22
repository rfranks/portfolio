"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { DemoSlide, MediaCycler } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";

type OverviewSectionProps = {
  useSharedOverviewSlide: boolean;
  overviewItems: MediaCyclerItem[];
  activeOverviewMediaKey?: string;
  onSelectOverviewMediaKey: (key: string) => void;
  navigationControlSx?: SxProps<Theme>;
  expandControlSx?: SxProps<Theme>;
};

export default function OverviewSection({
  useSharedOverviewSlide,
  overviewItems,
  activeOverviewMediaKey,
  onSelectOverviewMediaKey,
  navigationControlSx,
  expandControlSx,
}: OverviewSectionProps) {
  const resolvedItems = React.useMemo(
    () =>
      overviewItems.map((item) => ({
        ...item,
        onSelect: () => {
          onSelectOverviewMediaKey(item.key);
        },
      })),
    [onSelectOverviewMediaKey, overviewItems],
  );

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
      {useSharedOverviewSlide ? (
        <DemoSlide
          title=""
          subtitle=""
          contentSx={{
            minHeight: 0,
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MediaCycler
            items={resolvedItems}
            singlePanel
            singlePanelActiveKey={activeOverviewMediaKey}
            allowSwipe
            showChevronNavigation={overviewItems.length > 1}
            loopNavigation={overviewItems.length > 1}
            navigationControlSx={navigationControlSx}
            expandControlSx={expandControlSx}
            stackSx={{ minHeight: 0, height: "100%" }}
          />
        </DemoSlide>
      ) : (
        <MediaCycler
          items={resolvedItems}
          singlePanel
          singlePanelActiveKey={activeOverviewMediaKey}
          allowSwipe
          showChevronNavigation={overviewItems.length > 1}
          loopNavigation={overviewItems.length > 1}
          navigationControlSx={navigationControlSx}
          expandControlSx={expandControlSx}
          stackSx={{ minHeight: 0, height: "100%" }}
        />
      )}
    </Box>
  );
}
