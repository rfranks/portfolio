import type { PaperProps } from "@mui/material/Paper";

export interface SurfaceProps extends PaperProps {
  layer?: 1 | 2 | 3;
  interactive?: boolean;
  glow?: boolean;
}

export interface PanelProps extends SurfaceProps {
  compact?: boolean;
}
