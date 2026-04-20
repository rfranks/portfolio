import { Toolbar } from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import { alpha, styled } from "@mui/material/styles";
import { ToggleColorMode } from "@/components/shared";
import type { AppBarProps } from "@/types/components/portfolio";

interface StyledAppBarProps extends MuiAppBarProps {
  open?: boolean;
  drawerWidth?: number;
}

const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "drawerWidth",
})<StyledAppBarProps>(({ theme, open, drawerWidth = 240 }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor:
    theme.palette.mode === "light"
      ? alpha(theme.palette.background.paper, 0.84)
      : "var(--fabric-surface-2)",
  backgroundImage:
    theme.palette.mode === "light"
      ? `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.88)}, ${alpha(theme.palette.primary.light, 0.08)} 44%, transparent 100%)`
      : "linear-gradient(180deg, var(--fabric-inner-glow), transparent 44%)",
  color: theme.palette.text.primary,
  border: "1px solid",
  borderColor:
    theme.palette.mode === "light"
      ? alpha(theme.palette.primary.main, 0.14)
      : "var(--fabric-surface-border)",
  borderRadius: 0,
  boxShadow:
    theme.palette.mode === "light"
      ? "0 10px 28px rgba(35, 58, 99, 0.1)"
      : "var(--fabric-shadow-tight)",
  backdropFilter: "blur(var(--fabric-blur-md))",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export default function AppBar({
  open,
  drawerWidth,
  mode = "dark",
  toggleColorMode,
  children,
  ...other
}: AppBarProps) {
  return (
    <StyledAppBar open={open} drawerWidth={drawerWidth} {...other}>
      <Toolbar sx={{ pr: "24px" }}>
        {children}
        {toggleColorMode && (
          <ToggleColorMode mode={mode} toggleColorMode={toggleColorMode} />
        )}
      </Toolbar>
    </StyledAppBar>
  );
}
