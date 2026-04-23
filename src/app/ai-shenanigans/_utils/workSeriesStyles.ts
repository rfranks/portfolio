import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

export const panelChromeSx = {
  borderRadius: "24px",
  border: "1px solid",
  borderColor: "var(--fabric-surface-border)",
  backgroundColor: "var(--fabric-surface-1)",
  backgroundImage: "linear-gradient(180deg, var(--fabric-inner-glow), transparent 34%)",
  boxShadow: "inset 0 1px 0 var(--fabric-inner-glow)",
  backdropFilter: "blur(var(--fabric-blur-sm))",
} as const;

export const mediaPanelSx = {
  ...panelChromeSx,
  p: 2.5,
  position: "relative",
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
} as const;

export const mediaControlSx = (theme: Theme) => ({
  color: theme.palette.common.black,
  borderColor: theme.palette.common.black,
  bgcolor: theme.palette.common.white,
  "&:hover": {
    bgcolor: theme.palette.common.white,
  },
  "&.Mui-disabled": {
    color: alpha(theme.palette.common.black, 0.36),
    borderColor: alpha(theme.palette.common.black, 0.36),
    bgcolor: alpha(theme.palette.common.white, 0.8),
  },
});

export const restartActionSx = (theme: Theme) => ({
  border: "1px solid",
  ...mediaControlSx(theme),
});
