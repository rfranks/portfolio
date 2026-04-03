import { styled } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import type { DrawerProps } from "@/types/components/portfolio";

export default styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "drawerWidth",
})<DrawerProps>(({ theme, open, drawerWidth = 240 }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    backgroundColor: "var(--fabric-surface-2)",
    color: theme.palette.text.primary,
    borderRight: "1px solid var(--fabric-surface-border-strong)",
    boxShadow: "var(--fabric-shadow-tight)",
    backdropFilter: "blur(var(--fabric-blur-md))",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));
