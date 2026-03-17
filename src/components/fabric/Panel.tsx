import * as React from "react";
import type { SxProps, Theme } from "@mui/material/styles";

import Surface, { SurfaceProps } from "./Surface";

export interface PanelProps extends SurfaceProps {
  compact?: boolean;
}

export default function Panel({
  compact = false,
  layer = 2,
  sx,
  ...props
}: PanelProps) {
  const mergedSx = [
    {
      p: compact ? 2 : 3,
      borderRadius: "var(--fabric-radius-xl)",
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ] as SxProps<Theme>;

  return (
    <Surface
      layer={layer}
      sx={mergedSx}
      {...props}
    />
  );
}
