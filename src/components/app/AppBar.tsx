import { PaletteMode, Toolbar } from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import { styled } from "@mui/material/styles";
import ToggleColorMode from "../bookworm/ToggleColorMode";

export interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  drawerWidth?: number;
  mode: PaletteMode;
  toggleColorMode: () => void;
}

interface StyledAppBarProps extends MuiAppBarProps {
  open?: boolean;
  drawerWidth?: number;
}

const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "drawerWidth",
})<StyledAppBarProps>(({ theme, open, drawerWidth = 240 }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.primary.main}`,
  boxShadow: `0 0 10px ${theme.palette.primary.main}`,
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
  mode,
  toggleColorMode,
  children,
  ...other
}: AppBarProps) {
  return (
    <StyledAppBar open={open} drawerWidth={drawerWidth} {...other}>
      <Toolbar sx={{ pr: "24px" }}>
        {children}
        <ToggleColorMode mode={mode} toggleColorMode={toggleColorMode} />
      </Toolbar>
    </StyledAppBar>
  );
}

