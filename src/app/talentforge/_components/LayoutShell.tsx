"use client";

import * as React from "react";
import Link from "next/link";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  PaletteMode,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import Surface from "@/components/fabric/Surface";
import { ToggleColorMode } from "@/components/shared";

interface LayoutShellProps {
  navItems: { label: string; href: string }[];
  mode: PaletteMode;
  toggleColorMode: () => void;
  children: React.ReactNode;
}

const drawerWidth = 240;

export default function LayoutShell({
  navItems,
  mode,
  toggleColorMode,
  children,
}: LayoutShellProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const drawer = (
    <Surface
      layer={2}
      sx={{ textAlign: "center", mt: 8, mx: 2, p: 1.5 }}
      onClick={isDesktop ? undefined : handleDrawerToggle}
    >
      <List>
        {navItems.map(({ label, href }) => (
          <ListItem key={label} disablePadding>
            <ListItemButton component={Link} href={href} sx={{ textAlign: "left" }}>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Surface>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          border: "none",
          boxShadow: "none",
          bgcolor: "transparent",
        }}
      >
        <Toolbar>
          <Surface
            layer={2}
            sx={{
              width: "100%",
              px: 2,
              py: 1,
              borderRadius: "var(--fabric-radius-xl)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {!isDesktop && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              TalentForge
            </Typography>
            <ToggleColorMode mode={mode} toggleColorMode={toggleColorMode} />
          </Surface>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation"
      >
        <Drawer
          variant={isDesktop ? "permanent" : "temporary"}
          open={isDesktop ? true : mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
