"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { MediaCyclerFlatSxArray } from "@/types/media/mediaCyclerSx";

type MediaRenderShellProps = {
  spacing: number;
  stackFlatSxArray: MediaCyclerFlatSxArray;
  singlePanel: boolean;
  singlePanelItem: React.ReactNode;
  multiPanelItems: React.ReactNode;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onTouchStart?: (event: React.TouchEvent<HTMLElement>) => void;
  onTouchMove?: (event: React.TouchEvent<HTMLElement>) => void;
  onTouchEnd?: () => void;
  onTouchCancel?: () => void;
};

export default function MediaRenderShell({
  spacing,
  stackFlatSxArray,
  singlePanel,
  singlePanelItem,
  multiPanelItems,
  onKeyDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
}: MediaRenderShellProps) {
  if (singlePanel) {
    return (
      <Stack
        spacing={spacing}
        sx={[
          {
            minWidth: 0,
            width: "100%",
            maxWidth: "100%",
          },
          ...stackFlatSxArray,
        ]}
      >
        <Box
          sx={{ position: "relative", height: "100%", minHeight: 0 }}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
        >
          {singlePanelItem}
        </Box>
      </Stack>
    );
  }

  return (
    <Stack
      spacing={spacing}
      sx={[
        {
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
        },
        ...stackFlatSxArray,
      ]}
    >
      {multiPanelItems}
    </Stack>
  );
}
