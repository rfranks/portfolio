import * as React from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { toSxArray } from "@/utils/sx/toSxArray";

export type PanelFrameProps = {
  topRail?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  rootSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  topRailSx?: SxProps<Theme>;
  footerSx?: SxProps<Theme>;
  useNegativeTopRailMargins?: boolean;
  useNegativeFooterMargins?: boolean;
};

const PANEL_RAIL_OFFSET_X = -2;
const PANEL_RAIL_OFFSET_Y = 0;

export default function PanelFrame({
  topRail,
  footer,
  children,
  rootSx,
  contentSx,
  topRailSx,
  footerSx,
  useNegativeTopRailMargins = true,
  useNegativeFooterMargins = false,
}: PanelFrameProps) {
  const topRailDefaults: SxProps<Theme> = {
    flexShrink: 0,
    mx: useNegativeTopRailMargins ? { xs: 0, sm: 0, md: PANEL_RAIL_OFFSET_X } : 0,
    mt: useNegativeTopRailMargins ? { xs: 0, sm: 0, md: PANEL_RAIL_OFFSET_Y } : 0,
    mb: 0,
    bgcolor: "transparent",
    backgroundColor: "transparent",
    backgroundImage: "none",
    borderBottom: "1px solid",
    borderColor: "divider",
    backdropFilter: "none",
    filter: "none",
    borderTopLeftRadius: { xs: 0, sm: 0, md: "var(--fabric-radius-xl)" },
    borderTopRightRadius: { xs: 0, sm: 0, md: "var(--fabric-radius-xl)" },
  };

  const footerDefaults: SxProps<Theme> = {
    flexShrink: 0,
    zIndex: 5,
    mt: "auto",
    minHeight: { xs: 44, sm: 48, md: 56 },
    mx: useNegativeFooterMargins ? { xs: 0, sm: 0, md: PANEL_RAIL_OFFSET_X } : 0,
    mb: useNegativeFooterMargins ? { xs: 0, sm: 0, md: PANEL_RAIL_OFFSET_Y } : 0,
    px: useNegativeFooterMargins ? { xs: 0, sm: 0, md: 3.5 } : 0,
    py: useNegativeFooterMargins ? { xs: 0, sm: 0, md: 1 } : 0,
    bgcolor: "transparent",
    backgroundColor: "transparent",
    backgroundImage: "none",
    borderTop: "1px solid",
    borderColor: "divider",
    backdropFilter: "none",
    filter: "none",
    borderBottomLeftRadius: useNegativeFooterMargins
      ? { xs: 0, sm: 0, md: "var(--fabric-radius-xl)" }
      : 0,
    borderBottomRightRadius: useNegativeFooterMargins
      ? { xs: 0, sm: 0, md: "var(--fabric-radius-xl)" }
      : 0,
  };

  return (
    <Box
      sx={[
        {
          minHeight: 0,
          height: "100%",
          maxHeight: "100%",
          flex: "1 1 0%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        ...toSxArray(rootSx),
      ]}
    >
      {topRail ? <Box sx={[topRailDefaults, ...toSxArray(topRailSx)]}>{topRail}</Box> : null}
      <Box
        sx={[
          {
            minHeight: 0,
            flex: "1 1 0%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
          ...toSxArray(contentSx),
        ]}
      >
        {children}
      </Box>
      {footer ? (
        <Box component="footer" sx={[footerDefaults, ...toSxArray(footerSx)]}>
          {footer}
        </Box>
      ) : null}
    </Box>
  );
}
