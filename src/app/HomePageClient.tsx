"use client";

import { useMemo, useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import {
  Menu,
  ChevronLeft,
  Home as HomeIcon,
  Science,
  MenuBook,
  Casino,
  Flight,
  BugReport,
  Build,
  AutoStories,
} from "@mui/icons-material";
import AppBar from "@/components/app/AppBar";
import Drawer from "@/components/app/Drawer";
import ResumeHero from "@/components/app/ResumeHero";
import ResumeSummary from "@/components/app/ResumeSummary";
import CoreCompetencies from "@/components/app/CoreCompetencies";
import ExperienceTimeline from "@/components/app/ExperienceTimeline";
import ProjectsGrid from "@/components/app/ProjectsGrid";
import Education from "@/components/app/Education";
import Recognition from "@/components/app/Recognition";
import ContactCTA from "@/components/app/ContactCTA";
import Grid from "@mui/material/Grid";
import { withBasePath } from "@/utils/basePath";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import getFabricTheme from "@/themes/fabricTheme";

export default function HomePageClient() {
  const [mode, setMode] = useState<PaletteMode>("light");
  const defaultTheme = useMemo(() => getFabricTheme(mode), [mode]);
  const [open, setOpen] = useState(false);
  const drawerWidth = 240;

  const { setDocumentTitle } = useDocumentTitle();
  useEffect(() => {
    setDocumentTitle("Richard Franks | Résumé");
  }, [setDocumentTitle]);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const navItems = [
    { label: "Home", href: "/", icon: <HomeIcon /> },
    { label: "GeneBoard", href: "/dna", icon: <Science /> },
    { label: "Bookworm", href: "/bookworm", icon: <MenuBook /> },
    { label: "TalentForge", href: "/talentforge", icon: <Build /> },
    { label: "Rickbert Studio", href: "/rickbert", icon: <AutoStories /> },
    { label: "Blackjack", href: "/blackjack", icon: <Casino /> },
    { label: "Warbirds", href: "/warbirds", icon: <Flight /> },
    { label: "ZombieFish", href: "/zombiefish", icon: <BugReport /> },
  ];

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        <AppBar
          open={open}
          drawerWidth={drawerWidth}
          mode={mode}
          toggleColorMode={toggleColorMode}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{ marginRight: "36px", ...(open && { display: "none" }) }}
          >
            <Menu />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            Portfolio
          </Typography>
        </AppBar>
        <Drawer
          variant="permanent"
          open={open}
          drawerWidth={drawerWidth}
          sx={{
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              position: "fixed",
              top: 0,
              height: "100vh",
            },
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeft />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            {navItems.map((item) => (
              <Tooltip
                key={item.href}
                title={item.label}
                placement="right"
                arrow
                disableHoverListener={open}
              >
                <ListItemButton component="a" href={withBasePath(item.href)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            flex: "1 1 0",
            minWidth: 0,
            minHeight: "100vh",
            ml: open ? `${drawerWidth}px` : { xs: 7, sm: 9 },
          }}
        >
          <Toolbar />
          <Container sx={{ py: 3 }}>
            <ResumeHero />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={6} lg={6}>
                <ResumeSummary />
              </Grid>
              <Grid item xs={12} sm={12} md={6} lg={6}>
                <CoreCompetencies />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <ExperienceTimeline />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <ProjectsGrid />
              </Grid>
            </Grid>
            <Education />
            <Recognition />
            <ContactCTA />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
