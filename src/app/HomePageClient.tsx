"use client";

import { useMemo, useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
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
  Build,
  AutoStories,
  AutoFixHigh,
} from "@mui/icons-material";
import AppBar from "@/components/app/AppBar";
import Drawer from "@/components/app/Drawer";
import ResumeHero from "@/components/app/ResumeHero";
import ResumeSummary from "@/components/app/ResumeSummary";
import HobbiesCard from "@/components/app/HobbiesCard";
import CoreCompetencies from "@/components/app/CoreCompetencies";
import ExperienceTimeline from "@/components/app/ExperienceTimeline";
import ProjectsGrid from "@/components/app/ProjectsGrid";
import Education from "@/components/app/Education";
import Recognition from "@/components/app/Recognition";
import ContactCTA from "@/components/app/ContactCTA";
import Grid from "@mui/material/Grid";
import { summary } from "@/personal/data/resumeData";
import { withBasePath } from "@/utils/basePath";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import getFabricTheme from "@/themes/fabricTheme";

export default function HomePageClient() {
  const [mode, setMode] = useState<PaletteMode>("light");
  const defaultTheme = useMemo(() => getFabricTheme(mode), [mode]);
  const [open, setOpen] = useState(false);
  const drawerWidth = 240;
  const tocSections = [
    { id: "hero", label: "Hero" },
    { id: "summary", label: "Summary" },
    { id: "education", label: "Education" },
    { id: "experience", label: "Experience" },
    { id: "competencies", label: "Core Competencies" },
    { id: "projects", label: "Projects" },
    { id: "recognition", label: "Recognition" },
    { id: "hobbies", label: "Hobbies" },
    { id: "contact", label: "Contact" },
  ];

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
    { label: "AI Shenanigans", href: "/ai-shenanigans", icon: <AutoFixHigh /> },
    { label: "Rickbert Studio", href: "/rickbert", icon: <AutoStories /> },
    { label: "Blackjack", href: "/blackjack", icon: <Casino /> },
    { label: "Warbirds", href: "/warbirds", icon: <Flight /> },
  ];

  const appBarTitle = `${summary.name} • ${summary.title
    .split("|")[0]
    .trim()}`;

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Box
        className="relative flex bg-transparent text-inherit"
        sx={{
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <Avatar
              src={withBasePath("/personal/images/personal/me.jpeg")}
              alt={summary.name}
              sx={{
                width: 38,
                height: 38,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: 1,
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h1"
                variant="h6"
                color="inherit"
                noWrap
                sx={{ display: { xs: "block", sm: "none" } }}
              >
                {summary.name}
              </Typography>
              <Typography
                component="h1"
                variant="h6"
                color="inherit"
                noWrap
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {appBarTitle}
              </Typography>
            </Box>
          </Box>
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
              borderRadius: 0,
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
                slotProps={{
                  arrow: {
                    sx: {
                      "&::before": {
                        borderRadius: 0,
                      },
                    },
                  },
                }}
              >
                <ListItemButton
                  component="a"
                  href={withBasePath(item.href)}
                  className="transition-transform duration-200 ease-out hover:translate-x-1"
                  sx={{ borderRadius: 0 }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        </Drawer>
        <Box
          component="main"
          className="relative min-h-screen min-w-0 flex-[1_1_0]"
          sx={{
            ml: open ? `${drawerWidth}px` : { xs: 7, sm: 9 },
          }}
        >
          <Box className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden">
            <Box className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
            <Box className="absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
          </Box>
          <Toolbar />
          <Container className="py-6 md:py-8">
            <Box
              sx={{
                display: "flex",
                alignItems: "stretch",
                gap: { xs: 0, lg: 4, xl: 6 },
              }}
            >
              <Box
                component="aside"
                sx={{
                  display: { xs: "none", lg: "block" },
                  width: { lg: 180, xl: 200 },
                  flexShrink: 0,
                  alignSelf: "stretch",
                }}
              >
                <Box
                  sx={{
                    position: "sticky",
                    top: { lg: 96, xl: 104 },
                    borderLeft: "1px solid",
                    borderColor: "divider",
                    pl: 2,
                  }}
                >
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ letterSpacing: "0.18em" }}
                  >
                    On this page
                  </Typography>
                  <Box
                    component="nav"
                    sx={{
                      mt: 1.5,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {tocSections.map((section) => (
                      <Box
                        key={section.id}
                        component="a"
                        href={`#${section.id}`}
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.925rem",
                          lineHeight: 1.4,
                          textDecoration: "none",
                          transition: "color 160ms ease, transform 160ms ease",
                          "&:hover": {
                            color: "text.primary",
                            transform: "translateX(2px)",
                          },
                        }}
                      >
                        {section.label}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
                <Box
                  component="section"
                  id="hero"
                  sx={{ scrollMarginTop: { xs: 88, md: 96 } }}
                >
                  <ResumeHero />
                </Box>
                <Grid container spacing={3} className="items-stretch">
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Box
                      component="section"
                      id="summary"
                      sx={{ scrollMarginTop: { xs: 88, md: 96 } }}
                    >
                      <ResumeSummary />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Box
                      component="section"
                      id="education"
                      sx={{ scrollMarginTop: { xs: 88, md: 96 } }}
                    >
                      <Education />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Box
                      component="section"
                      id="experience"
                      sx={{ scrollMarginTop: { xs: 88, md: 96 } }}
                    >
                      <ExperienceTimeline />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Box
                      component="section"
                      id="competencies"
                      sx={{ scrollMarginTop: { xs: 88, md: 96 } }}
                    >
                      <CoreCompetencies />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Box
                      component="section"
                      id="projects"
                      sx={{ scrollMarginTop: { xs: 88, md: 96 } }}
                    >
                      <ProjectsGrid />
                    </Box>
                  </Grid>
                </Grid>
                <Box className="space-y-8 pt-2 md:space-y-10">
                  <Box
                    component="section"
                    id="recognition"
                    sx={{ scrollMarginTop: { xs: 88, md: 96 } }}
                  >
                    <Recognition />
                  </Box>
                  <Box
                    component="section"
                    id="hobbies"
                    sx={{ scrollMarginTop: { xs: 88, md: 96 } }}
                  >
                    <HobbiesCard />
                  </Box>
                  <Box
                    component="section"
                    id="contact"
                    sx={{ scrollMarginTop: { xs: 88, md: 96 } }}
                  >
                    <ContactCTA />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
