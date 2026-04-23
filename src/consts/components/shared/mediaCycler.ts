import type { SxProps, Theme } from "@mui/material/styles";

export const MEDIA_RENDERER_FALLBACK_SX: SxProps<Theme> = {
  width: "100%",
  height: "100%",
  minHeight: 0,
};

export const MEDIA_SECTION_DIAGRAM_HINTS = new Set(["architecture", "diagram", "diagrams"]);
export const MEDIA_SECTION_DEMO_HINTS = new Set(["demo"]);
export const MEDIA_SECTION_OVERVIEW_HINTS = new Set(["overview", "summary", "why"]);
