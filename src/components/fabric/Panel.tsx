import * as React from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import type { PanelProps } from "@/types/components/fabric";

import Surface from "./Surface";

export default function Panel({ compact = false, layer = 2, sx, ...props }: PanelProps) {
  const mergedSx = [
    {
      p: compact ? 2 : 3,
      borderRadius: "var(--fabric-radius-xl)",
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ] as SxProps<Theme>;

  return <Surface layer={layer} sx={mergedSx} {...props} />;
}
