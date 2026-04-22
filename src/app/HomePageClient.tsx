"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { ThemeProvider, keyframes } from "@mui/material/styles";
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
import { Menu, ChevronLeft } from "@mui/icons-material";
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
import { ImageLightbox } from "@/components/shared";
import HomeSectionPager, {
  type HomeSectionPagerItem,
} from "@/components/portfolio/layout/HomeSectionPager";
import {
  renderNavigationIcon,
  type NavigationIconType,
} from "@/components/portfolio/layout/navigationIcons";
import { GLOBAL_COLOR_MODE_STORAGE_KEY, LEGACY_COLOR_MODE_STORAGE_KEYS } from "@/consts/colorMode";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { withBasePath } from "@/utils/basePath";
import { useColorModePreference } from "@/hooks/useColorModePreference";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import { useAudio } from "@/hooks/audio/useAudio";
import { rewindAndPlayAudio } from "@/utils/audio";
import getFabricTheme from "@/themes/fabricTheme";
import type { CommandPaletteAction } from "@/types/components/portfolio";

const SECTION_TRANSITION_MS = 320;
const sectionSlideInFromRight = keyframes`
  0% { opacity: 0.66; transform: translateX(14%); }
  100% { opacity: 1; transform: translateX(0); }
`;
const sectionSlideOutToLeft = keyframes`
  0% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0.4; transform: translateX(-14%); }
`;
const sectionSlideInFromLeft = keyframes`
  0% { opacity: 0.66; transform: translateX(-14%); }
  100% { opacity: 1; transform: translateX(0); }
`;
const sectionSlideOutToRight = keyframes`
  0% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0.4; transform: translateX(14%); }
`;
const SECTION_SWIPE_THRESHOLD_PX = 72;
const DEFAULT_HOME_SECTIONS: HomeSectionPagerItem[] = [
  { id: "hero", label: "Summary", icon: "home", iconType: "material" },
  { id: "education", label: "Education", icon: "school", iconType: "material" },
  { id: "experience", label: "Experience", icon: "work", iconType: "material" },
  {
    id: "competencies",
    label: "Core Competencies",
    icon: "build",
    iconType: "material",
  },
  { id: "projects", label: "Projects", icon: "autoStories", iconType: "material" },
  {
    id: "recognition",
    label: "Recognition",
    icon: "emojiEvents",
    iconType: "material",
  },
  { id: "hobbies", label: "Hobbies", icon: "interests", iconType: "material" },
  { id: "contact", label: "Contact", icon: "alternateEmail", iconType: "material" },
];

const DEFAULT_HOME_DRAWER_ITEM = {
  label: "Home",
  href: "/",
  icon: "home",
  iconType: "material",
} as const;
const LAST_HOME_HASH_STORAGE_KEY = "portfolio:last-home-hash";
type DrawerNavigationItem = {
  label: string;
  href: string;
  icon?: string;
  iconType?: NavigationIconType;
};
const normalizeNavigationIconType = (iconType: unknown): NavigationIconType =>
  iconType === "emoji" ? "emoji" : "material";

export default function HomePageClient() {
  const { navigation, summary } = useResumeData();
  const { mode, toggleColorMode, isReady } = useColorModePreference({
    storageKey: GLOBAL_COLOR_MODE_STORAGE_KEY,
    legacyStorageKeys: LEGACY_COLOR_MODE_STORAGE_KEYS,
  });
  const defaultTheme = useMemo(() => getFabricTheme(mode), [mode]);
  const [open, setOpen] = useState(false);
  const drawerWidth = 240;
  const tocSections = useMemo<HomeSectionPagerItem[]>(() => {
    const configuredSections = navigation.homeSections;
    if (!Array.isArray(configuredSections) || configuredSections.length === 0) {
      return DEFAULT_HOME_SECTIONS;
    }

    const normalizedSections = configuredSections
      .filter(
        (section): section is (typeof configuredSections)[number] =>
          Boolean(section?.id?.trim()) && Boolean(section?.label?.trim()),
      )
      .map((section) => ({
        id: section.id.trim(),
        label: section.label.trim(),
        icon: section.icon?.trim(),
        iconType: normalizeNavigationIconType(section.iconType),
      }));

    return normalizedSections.length > 0 ? normalizedSections : DEFAULT_HOME_SECTIONS;
  }, [navigation.homeSections]);
  const drawerItems = useMemo<DrawerNavigationItem[]>(() => {
    const configuredDrawerItems = Array.isArray(navigation.drawerItems)
      ? navigation.drawerItems
      : [];
    const normalizedDrawerItems = configuredDrawerItems
      .filter(
        (item): item is (typeof configuredDrawerItems)[number] =>
          Boolean(item?.label?.trim()) && Boolean(item?.href?.trim()),
      )
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        href: item.href.trim(),
        icon: item.icon?.trim() || "home",
        iconType: normalizeNavigationIconType(item.iconType),
      }));
    const isHomeDrawerItem = (item: { href: string; label: string }) =>
      item.href === "/" || item.label.toLowerCase() === "home";
    const configuredHomeItem = normalizedDrawerItems.find(isHomeDrawerItem);
    const homeDrawerItem = configuredHomeItem ?? DEFAULT_HOME_DRAWER_ITEM;
    const remainingDrawerItems = normalizedDrawerItems.filter(
      (item) => item !== configuredHomeItem && !isHomeDrawerItem(item),
    );

    return [
      {
        ...homeDrawerItem,
        label: homeDrawerItem.label || "Home",
        href: "/",
        icon: homeDrawerItem.icon || "home",
        iconType: normalizeNavigationIconType(homeDrawerItem.iconType),
      },
      ...remainingDrawerItems,
    ];
  }, [navigation.drawerItems]);
  const [activeSectionId, setActiveSectionId] = useState<string>(tocSections[0]?.id ?? "hero");
  const [displaySectionId, setDisplaySectionId] = useState<string>(tocSections[0]?.id ?? "hero");
  const [outgoingSectionId, setOutgoingSectionId] = useState<string | null>(null);
  const [sectionDirection, setSectionDirection] = useState<1 | -1>(1);
  const [isSectionTransitioning, setIsSectionTransitioning] = useState(false);
  const sectionTransitionTimerRef = useRef<number | null>(null);
  const sectionSwipeRef = useRef<{
    startX: number;
    startY: number;
    blocked: boolean;
    deltaX: number;
    deltaY: number;
  } | null>(null);
  const sectionNavSfx = useAudio("/audio/card-slide-3.ogg");

  const { setDocumentTitle } = useDocumentTitle();
  useEffect(() => {
    const fallbackSectionId = tocSections[0]?.id ?? "hero";

    if (!tocSections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(fallbackSectionId);
    }

    if (!tocSections.some((section) => section.id === displaySectionId)) {
      setDisplaySectionId(fallbackSectionId);
    }
  }, [activeSectionId, displaySectionId, tocSections]);

  useEffect(() => {
    setDocumentTitle(summary.documentTitle);
  }, [setDocumentTitle, summary.documentTitle]);

  const updateHashForSection = useCallback((sectionId: string) => {
    const nextHash = `#${encodeURIComponent(sectionId)}`;
    if (window.location.hash === nextHash) {
      return;
    }

    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    try {
      window.history.pushState(null, "", nextUrl);
    } catch {
      window.location.hash = sectionId;
    }
  }, []);

  useEffect(() => {
    if (!isReady || !activeSectionId) {
      return;
    }

    try {
      window.sessionStorage.setItem(
        LAST_HOME_HASH_STORAGE_KEY,
        `#${encodeURIComponent(activeSectionId)}`,
      );
    } catch {
      // Ignore storage failures.
    }
  }, [activeSectionId, isReady]);

  const resolveSectionIdFromHash = useCallback(
    (hash: string) => {
      const rawHash = hash.startsWith("#") ? hash.slice(1) : hash;
      if (!rawHash) {
        return null;
      }
      const decodedHash = decodeURIComponent(rawHash);
      return tocSections.some((section) => section.id === decodedHash) ? decodedHash : null;
    },
    [tocSections],
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const applyHashSection = () => {
      const sectionId = resolveSectionIdFromHash(window.location.hash);
      if (!sectionId) {
        return;
      }
      setActiveSectionId(sectionId);
    };

    applyHashSection();

    const handleHashOrHistoryChange = () => {
      applyHashSection();
    };

    window.addEventListener("hashchange", handleHashOrHistoryChange);
    window.addEventListener("popstate", handleHashOrHistoryChange);

    return () => {
      window.removeEventListener("hashchange", handleHashOrHistoryChange);
      window.removeEventListener("popstate", handleHashOrHistoryChange);
    };
  }, [isReady, resolveSectionIdFromHash]);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const navigateToSection = useCallback(
    (sectionId: string) => {
      const hasSection = tocSections.some((section) => section.id === sectionId);
      if (!hasSection) {
        return;
      }

      setActiveSectionId(sectionId);
      updateHashForSection(sectionId);
    },
    [tocSections, updateHashForSection],
  );

  const homeCommandPaletteActions = useMemo<CommandPaletteAction[]>(() => {
    return tocSections.map((section) => ({
      id: `home-section-${section.id}`,
      label: `Switch Section: ${section.label}`,
      subtitle: "Jump to this portfolio section",
      group: "Home Sections",
      keywords: ["home", "section", section.id, section.label, "jump", "switch"],
      onSelect: () => navigateToSection(section.id),
    }));
  }, [navigateToSection, tocSections]);

  const handleTocClick = (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    navigateToSection(sectionId);
  };

  const isInteractiveSectionSwipeTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return Boolean(
      target.closest(
        "a,button,input,textarea,select,summary,[role='button'],[role='link'],[data-no-swipe='true']",
      ),
    );
  }, []);

  const navigateRelativeSection = useCallback(
    (offset: number) => {
      if (isSectionTransitioning || tocSections.length === 0) {
        return;
      }

      const currentIndex = tocSections.findIndex((section) => section.id === activeSectionId);
      if (currentIndex < 0) {
        return;
      }

      const total = tocSections.length;
      const nextIndex = (currentIndex + offset + total) % total;
      const nextSection = tocSections[nextIndex];
      if (!nextSection) {
        return;
      }

      navigateToSection(nextSection.id);
    },
    [activeSectionId, isSectionTransitioning, navigateToSection, tocSections],
  );

  const handleSectionSwipeStart = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (event.touches.length !== 1 || isSectionTransitioning) {
        sectionSwipeRef.current = null;
        return;
      }

      const touch = event.touches[0];
      sectionSwipeRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        blocked: isInteractiveSectionSwipeTarget(event.target),
        deltaX: 0,
        deltaY: 0,
      };
    },
    [isInteractiveSectionSwipeTarget, isSectionTransitioning],
  );

  const handleSectionSwipeMove = useCallback((event: React.TouchEvent<HTMLElement>) => {
    const swipeState = sectionSwipeRef.current;
    if (!swipeState || swipeState.blocked || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    swipeState.deltaX = touch.clientX - swipeState.startX;
    swipeState.deltaY = touch.clientY - swipeState.startY;

    if (
      Math.abs(swipeState.deltaX) > 12 &&
      Math.abs(swipeState.deltaX) > Math.abs(swipeState.deltaY)
    ) {
      event.preventDefault();
    }
  }, []);

  const handleSectionSwipeEnd = useCallback(() => {
    const swipeState = sectionSwipeRef.current;
    sectionSwipeRef.current = null;

    if (!swipeState || swipeState.blocked || isSectionTransitioning) {
      return;
    }

    const { deltaX, deltaY } = swipeState;
    if (Math.abs(deltaX) < SECTION_SWIPE_THRESHOLD_PX) {
      return;
    }

    if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.1) {
      return;
    }

    if (deltaX < 0) {
      navigateRelativeSection(1);
      return;
    }

    navigateRelativeSection(-1);
  }, [isSectionTransitioning, navigateRelativeSection]);

  const handleSectionSwipeCancel = useCallback(() => {
    sectionSwipeRef.current = null;
  }, []);

  const appBarTitle = `${summary.name} • ${summary.title.split("|")[0].trim()}`;
  const activeSection = useMemo(
    () => tocSections.find((section) => section.id === activeSectionId) ?? tocSections[0],
    [activeSectionId, tocSections],
  );

  const renderSectionContent = useCallback(
    (sectionId: string) => {
      const topRail = (
        <HomeSectionPager
          items={tocSections}
          currentSectionId={sectionId}
          onSelectSection={navigateToSection}
        />
      );

      switch (sectionId) {
        case "hero":
          return <ResumeOverview topRail={topRail} />;
        case "education":
          return <Education topRail={topRail} />;
        case "experience":
          return <ExperienceTimeline topRail={topRail} />;
        case "competencies":
          return <CoreCompetencies topRail={topRail} />;
        case "projects":
          return <ProjectsGrid topRail={topRail} />;
        case "recognition":
          return <Recognition topRail={topRail} />;
        case "hobbies":
          return <HobbiesCard topRail={topRail} />;
        case "contact":
          return <ContactCTA topRail={topRail} />;
        default:
          return <ResumeOverview topRail={topRail} />;
      }
    },
    [navigateToSection, tocSections],
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (activeSectionId === displaySectionId) {
      return;
    }

    const currentIndex = Math.max(
      0,
      tocSections.findIndex((section) => section.id === displaySectionId),
    );
    const nextIndex = Math.max(
      0,
      tocSections.findIndex((section) => section.id === activeSectionId),
    );

    setSectionDirection(nextIndex >= currentIndex ? 1 : -1);
    setOutgoingSectionId(displaySectionId);
    setDisplaySectionId(activeSectionId);
    setIsSectionTransitioning(true);
    rewindAndPlayAudio(sectionNavSfx, { volume: 0.18 });

    if (sectionTransitionTimerRef.current) {
      window.clearTimeout(sectionTransitionTimerRef.current);
    }

    sectionTransitionTimerRef.current = window.setTimeout(() => {
      setOutgoingSectionId(null);
      setIsSectionTransitioning(false);
      sectionTransitionTimerRef.current = null;
    }, SECTION_TRANSITION_MS);
  }, [activeSectionId, displaySectionId, isReady, sectionNavSfx, tocSections]);

  useEffect(
    () => () => {
      if (sectionTransitionTimerRef.current) {
        window.clearTimeout(sectionTransitionTimerRef.current);
      }
    },
    [],
  );

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
            background: "linear-gradient(90deg, rgba(17,24,39,0.96) 0%, rgba(31,41,55,0.98) 100%)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            borderBottom: "1px solid rgba(255,255,255,0.16)",
            transform: "rotate(45deg)",
            transformOrigin: "center",
            transition: "background 180ms ease, box-shadow 180ms ease",
            "&:hover": {
              background: "linear-gradient(90deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,1) 100%)",
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
          commandPaletteActions={homeCommandPaletteActions}
          commandPaletteTitle="Portfolio Command Palette"
          commandPalettePlaceholder="Search sections, apps, or projects..."
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
            {drawerItems.map((item) => (
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
                    {renderNavigationIcon(item, {
                      fallbackIconKey: "home",
                      fontSize: "small",
                      emojiSize: "1rem",
                    })}
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
              height: { xs: "calc(100dvh - 56px)", sm: "calc(100dvh - 64px)" },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", lg: "row" },
                alignItems: "stretch",
                gap: { xs: 0, lg: 4, xl: 6 },
                minHeight: 0,
                height: "100%",
                overflow: "hidden",
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
                          color:
                            section.id === activeSection?.id ? "text.primary" : "text.secondary",
                          fontWeight: section.id === activeSection?.id ? 700 : 400,
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
                  height: "100%",
                  overflow: "hidden",
                  pr: { lg: 1 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <Box
                  component="section"
                  id={activeSection?.id}
                  sx={{
                    minHeight: 0,
                    height: "100%",
                    flex: "1 1 auto",
                    overflow: "hidden",
                    pr: { xs: 0, md: 0.5 },
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    onTouchStart={handleSectionSwipeStart}
                    onTouchMove={handleSectionSwipeMove}
                    onTouchEnd={handleSectionSwipeEnd}
                    onTouchCancel={handleSectionSwipeCancel}
                    sx={{
                      minHeight: 0,
                      height: "100%",
                      flex: "1 1 auto",
                      overflow: "hidden",
                      position: "relative",
                      "& > .home-section-surface": {
                        display: "flex",
                        flexDirection: "column",
                        flex: "1 1 auto",
                        minHeight: 0,
                        height: "100%",
                        overflowY: "auto",
                        marginBottom: "0 !important",
                      },
                    }}
                  >
                    {outgoingSectionId ? (
                      <Box
                        className="home-section-surface"
                        sx={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 1,
                          pointerEvents: "none",
                          animation: `${sectionDirection > 0 ? sectionSlideOutToLeft : sectionSlideOutToRight} ${SECTION_TRANSITION_MS}ms cubic-bezier(.22,.82,.28,.98) both`,
                        }}
                      >
                        {renderSectionContent(outgoingSectionId)}
                      </Box>
                    ) : null}
                    <Box
                      className="home-section-surface"
                      key={`incoming-${displaySectionId}-${sectionDirection}`}
                      sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        animation: isSectionTransitioning
                          ? `${sectionDirection > 0 ? sectionSlideInFromRight : sectionSlideInFromLeft} ${SECTION_TRANSITION_MS}ms cubic-bezier(.22,.82,.28,.98) both`
                          : "none",
                      }}
                    >
                      {renderSectionContent(displaySectionId)}
                    </Box>
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
