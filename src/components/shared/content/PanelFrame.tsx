import * as React from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

type PanelFrameProps = {
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

const toSxArray = (value?: SxProps<Theme>) =>
  Array.isArray(value) ? value : value ? [value] : [];

const PANEL_RAIL_OFFSET_X = -2;
const PANEL_RAIL_OFFSET_Y = -2.5;

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
    mx: useNegativeTopRailMargins ? PANEL_RAIL_OFFSET_X : 0,
    mt: useNegativeTopRailMargins ? PANEL_RAIL_OFFSET_Y : 0,
    mb: 0,
    bgcolor: "background.paper",
    borderBottom: "1px solid",
    borderColor: "divider",
    backdropFilter: "blur(8px)",
    borderTopLeftRadius: "var(--fabric-radius-xl)",
    borderTopRightRadius: "var(--fabric-radius-xl)",
  };

  const footerDefaults: SxProps<Theme> = {
    flexShrink: 0,
    zIndex: 5,
    mt: "auto",
    mx: useNegativeFooterMargins ? PANEL_RAIL_OFFSET_X : 0,
    mb: useNegativeFooterMargins ? PANEL_RAIL_OFFSET_Y : 0,
    px: useNegativeFooterMargins ? 3.5 : 0,
    py: useNegativeFooterMargins ? 1 : 0,
    bgcolor: "background.paper",
    borderTop: "1px solid",
    borderColor: "divider",
    backdropFilter: "blur(8px)",
    borderBottomLeftRadius: useNegativeFooterMargins
      ? "var(--fabric-radius-xl)"
      : 0,
    borderBottomRightRadius: useNegativeFooterMargins
      ? "var(--fabric-radius-xl)"
      : 0,
  };

  return (
    <Box
      sx={[
        {
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "visible",
        },
        ...toSxArray(rootSx),
      ]}
    >
      {topRail ? (
        <Box sx={[topRailDefaults, ...toSxArray(topRailSx)]}>{topRail}</Box>
      ) : null}
      <Box
        sx={[
          {
            minHeight: 0,
            flex: "1 1 auto",
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
