"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { PaletteMode } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Image from "next/image";
import { ToggleColorMode } from "@/components/shared";

const logoStyle = {
  width: "64px",
  height: "auto",
  cursor: "pointer",
};

const DESKTOP_SECTIONS = [
  { id: "highlights", label: "Highlights" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
] as const;

const MOBILE_SECTIONS = [
  { id: "features", label: "Features" },
  { id: "testimonials", label: "Testimonials" },
  { id: "highlights", label: "Highlights" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
] as const;

const SIGN_IN_HREF = "/material-ui/getting-started/templates/sign-in/";
const SIGN_UP_HREF = "/material-ui/getting-started/templates/sign-up/";

export interface LandingAppBarProps {
  mode: PaletteMode;
  toggleColorMode: () => void;
  appWordmark: string;
  logoSrc: string;
  logoAlt: string;
}

export default function LandingAppBar({
  mode,
  toggleColorMode,
  appWordmark,
  logoSrc,
  logoAlt,
}: LandingAppBarProps) {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (nextOpen: boolean) => () => {
    setOpen(nextOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const sectionElement = document.getElementById(sectionId);
    const offset = 128;
    if (!sectionElement) {
      return;
    }
    const targetScroll = sectionElement.offsetTop - offset;
    sectionElement.scrollIntoView({ behavior: "smooth" });
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
    setOpen(false);
  };

  return (
    <div>
      <AppBar
        position="fixed"
        sx={{
          boxShadow: 0,
          bgcolor: "transparent",
          backgroundImage: "none",
          mt: 2,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            component="nav"
            aria-label="main navigation"
            variant="regular"
            sx={(theme) => ({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              borderRadius: "999px",
              bgcolor:
                theme.palette.mode === "light" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(24px)",
              maxHeight: 40,
              border: "1px solid",
              borderColor: "divider",
              boxShadow:
                theme.palette.mode === "light"
                  ? "0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)"
                  : "0 0 1px rgba(2, 31, 59, 0.7), 1px 1.5px 2px -1px rgba(2, 31, 59, 0.65), 4px 4px 12px -2.5px rgba(2, 31, 59, 0.65)",
            })}
          >
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                ml: "-18px",
                px: 0,
              }}
            >
              <Image src={logoSrc} style={logoStyle} alt={logoAlt} width={192} height={194} />
              <Typography
                onClick={() => scrollToSection("hero")}
                variant="h4"
                color="text.primary"
                sx={{
                  ml: 1,
                  fontFamily: '"Gloria Hallelujah", cursive',
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                {appWordmark}
              </Typography>
              <Box sx={{ display: { xs: "none", md: "flex" } }}>
                {DESKTOP_SECTIONS.map((section) => (
                  <MenuItem
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    sx={{ py: "6px", px: "12px" }}
                  >
                    <Typography variant="body2" color="text.primary">
                      {section.label}
                    </Typography>
                  </MenuItem>
                ))}
              </Box>
            </Box>
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                gap: 0.5,
                alignItems: "center",
              }}
            >
              <ToggleColorMode mode={mode} toggleColorMode={toggleColorMode} />
              <Button
                color="primary"
                variant="text"
                size="small"
                component="a"
                href={SIGN_IN_HREF}
                target="_blank"
                aria-label="sign in"
              >
                Sign in
              </Button>
              <Button
                color="primary"
                variant="contained"
                size="small"
                component="a"
                href={SIGN_UP_HREF}
                target="_blank"
                aria-label="sign up"
              >
                Sign up
              </Button>
            </Box>
            <Box sx={{ display: { sm: "", md: "none" } }}>
              <Button
                variant="text"
                color="primary"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                sx={{ minWidth: "30px", p: "4px" }}
              >
                <MenuIcon />
              </Button>
              <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
                <Box
                  sx={{
                    minWidth: "60dvw",
                    p: 2,
                    backgroundColor: "background.paper",
                    flexGrow: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "end",
                      flexGrow: 1,
                    }}
                  >
                    <ToggleColorMode mode={mode} toggleColorMode={toggleColorMode} />
                  </Box>
                  {MOBILE_SECTIONS.map((section) => (
                    <MenuItem key={section.id} onClick={() => scrollToSection(section.id)}>
                      {section.label}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem>
                    <Button
                      color="primary"
                      variant="contained"
                      component="a"
                      href={SIGN_UP_HREF}
                      target="_blank"
                      aria-label="sign up"
                      sx={{ width: "100%" }}
                    >
                      Sign up
                    </Button>
                  </MenuItem>
                  <MenuItem>
                    <Button
                      color="primary"
                      variant="outlined"
                      component="a"
                      href={SIGN_IN_HREF}
                      target="_blank"
                      aria-label="sign in"
                      sx={{ width: "100%" }}
                    >
                      Sign in
                    </Button>
                  </MenuItem>
                </Box>
              </Drawer>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </div>
  );
}
