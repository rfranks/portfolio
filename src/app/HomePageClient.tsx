"use client";

import { useMemo, useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
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
  AltRoute,
} from "@mui/icons-material";
import AppBar from "@/components/portfolio/layout/AppBar";
import Drawer from "@/components/portfolio/layout/Drawer";
import ResumeOverview from "@/components/portfolio/panels/ResumeOverview";
import HobbiesCard from "@/components/portfolio/panels/HobbiesCard";
import CoreCompetencies from "@/components/portfolio/panels/CoreCompetencies";
import ExperienceTimeline from "@/components/portfolio/panels/ExperienceTimeline";
import ProjectsGrid from "@/components/portfolio/panels/ProjectsGrid";
import Education from "@/components/portfolio/panels/Education";
import Recognition from "@/components/portfolio/panels/Recognition";
import ContactCTA from "@/components/portfolio/panels/ContactCTA";
import ImageLightbox from "@/components/shared/ImageLightbox";
import Grid from "@mui/material/Grid";
import {
  GLOBAL_COLOR_MODE_STORAGE_KEY,
  LEGACY_COLOR_MODE_STORAGE_KEYS,
} from "@/consts/colorMode";
import { navigation, summary } from "@/consts/resumeData";
import { withBasePath } from "@/utils/basePath";
import { useColorModePreference } from "@/hooks/useColorModePreference";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import getFabricTheme from "@/themes/fabricTheme";

export default function HomePageClient() {
  const { mode, toggleColorMode, isReady } = useColorModePreference({
    storageKey: GLOBAL_COLOR_MODE_STORAGE_KEY,
    legacyStorageKeys: LEGACY_COLOR_MODE_STORAGE_KEYS,
  });
  const defaultTheme = useMemo(
    () => getFabricTheme(mode),
    [mode],
  );
  const [open, setOpen] = useState(false);
  const drawerWidth = 240;
  const tocSections = [
    { id: "hero", label: "Summary" },
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
    setDocumentTitle(summary.documentTitle);
  }, [setDocumentTitle]);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleTocClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    event.preventDefault();
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navIcons = {
    home: <HomeIcon />,
    science: <Science />,
    menuBook: <MenuBook />,
    build: <Build />,
    autoFixHigh: <AutoFixHigh />,
    autoStories: <AutoStories />,
    altRoute: <AltRoute />,
    casino: <Casino />,
    flight: <Flight />,
  } as const;
  type NavIconKey = keyof typeof navIcons;

  const hasNavIcon = (icon: string): icon is NavIconKey => icon in navIcons;

  const appBarTitle = `${summary.name} • ${summary.title.split("|")[0].trim()}`;

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline enableColorScheme />
      <Box
        className="relative flex bg-transparent text-inherit"
        sx={{
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        <Box
          component="a"
          href={navigation.forkRibbon.href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            position: "fixed",
            top: 48,
            right: -78,
            zIndex: (theme) => theme.zIndex.tooltip + 1,
            display: { xs: "none", md: "block" },
            width: 280,
            py: 1,
            textAlign: "center",
            textDecoration: "none",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            fontSize: "0.72rem",
            fontWeight: 800,
            color: "#fff",
            borderRadius: "999px",
            background:
              "linear-gradient(90deg, rgba(17,24,39,0.96) 0%, rgba(31,41,55,0.98) 100%)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            borderBottom: "1px solid rgba(255,255,255,0.16)",
            transform: "rotate(45deg)",
            transformOrigin: "center",
            transition: "background 180ms ease, box-shadow 180ms ease",
            "&:hover": {
              background:
                "linear-gradient(90deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,1) 100%)",
              boxShadow: "0 14px 28px rgba(0,0,0,0.34)",
            },
          }}
        >
          {navigation.forkRibbon.label}
        </Box>
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
            <ImageLightbox
              src={withBasePath(summary.avatarImage)}
              alt={`${summary.name} avatar`}
              title={summary.name}
              caption={summary.title}
              triggerSx={{
                borderRadius: "50%",
                lineHeight: 0,
              }}
            >
              <Avatar
                src={withBasePath(summary.avatarImage)}
                alt={summary.name}
                sx={{
                  width: 38,
                  height: 38,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: 1,
                }}
              />
            </ImageLightbox>
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
            {navigation.drawerItems.map((item) => (
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
                  <ListItemIcon>
                    {hasNavIcon(item.icon) ? navIcons[item.icon] : <HomeIcon />}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        </Drawer>
        <Box
          component="main"
          className="relative min-h-screen min-w-0 flex-[1_1_0]"
          sx={(theme) => ({
            ml: open ? `${drawerWidth}px` : { xs: 7, sm: 9 },
            ...(theme.palette.mode === "dark" && {
              "& .MuiCard-root": {
                backgroundColor: "rgba(13, 26, 42, 0.44)",
                backgroundImage:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 30%)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                boxShadow: "0 16px 34px rgba(3, 9, 18, 0.22)",
              },
            }),
          })}
        >
          <Box
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden"
            sx={{ opacity: mode === "dark" ? 1 : 0.92 }}
          >
            <Box
              sx={{
                position: "absolute",
                left: "-6rem",
                top: "2rem",
                height: "18rem",
                width: "18rem",
                borderRadius: "999px",
                background:
                  "radial-gradient(circle, var(--fabric-bg-radial-secondary) 0%, transparent 72%)",
                filter: "blur(28px)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: 0,
                top: "6rem",
                height: "20rem",
                width: "20rem",
                borderRadius: "999px",
                background:
                  "radial-gradient(circle, var(--fabric-bg-radial-primary) 0%, transparent 72%)",
                filter: "blur(32px)",
              }}
            />
          </Box>
          <Toolbar />
          <Container
            className="py-6 md:py-8"
            sx={{
              height: { xs: "auto", lg: "calc(100vh - 64px)" },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: { xs: "block", lg: "flex" },
                alignItems: "stretch",
                gap: { xs: 0, lg: 4, xl: 6 },
                minHeight: 0,
                height: { xs: "auto", lg: "100%" },
              }}
            >
              <Box
                component="aside"
                sx={{
                  display: { xs: "none", lg: "block" },
                  width: { lg: 180, xl: 200 },
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
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
                        onClick={(event: React.MouseEvent<HTMLAnchorElement>) =>
                          handleTocClick(event, section.id)
                        }
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
              <Box
                sx={{
                  minWidth: 0,
                  flex: "1 1 auto",
                  minHeight: 0,
                  overflowY: { xs: "visible", lg: "auto" },
                  pr: { lg: 1 },
                }}
              >
                <Box
                  component="section"
                  id="hero"
                  sx={{ scrollMarginTop: { xs: 88, md: 96 } }}
                >
                  <ResumeOverview />
                </Box>
                <Grid container spacing={3} className="items-stretch">
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
