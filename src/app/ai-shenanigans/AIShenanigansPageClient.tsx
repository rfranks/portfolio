"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { ArrowBack, Close, DarkMode, LightMode } from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import AIShenanigan from "./_components/AIShenanigan";
import AIShenaniganPager from "./_components/AIShenaniganPager";
import type { AIShenaniganDataItem } from "./_types/aiShenaniganModels";
import { normalizeAIShenaniganItems } from "./_utils/aiShenaniganRegistry";
import { GLOBAL_COLOR_MODE_STORAGE_KEY } from "@/consts/colorMode";
import { useColorModePreference } from "@/hooks/useColorModePreference";
import { useResumeData } from "@/providers/ResumeDataProvider";
import getFabricTheme from "@/themes/fabricTheme";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import { withBasePath } from "@/utils/basePath";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";
import useMediaQuery from "@mui/material/useMediaQuery";

const decodeHashSlug = (hash: string) => {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) {
    return "";
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export default function AIShenanigansPageClient() {
  const { aiShenanigans, portfolioApps, summary } = useResumeData();
  const aiShenanigansRoute = getPortfolioAppRouteContract(portfolioApps, "aiShenanigans");
  const shenaniganItems = useMemo(
    () =>
      normalizeAIShenaniganItems(
        aiShenanigans.items as AIShenaniganDataItem[],
        summary.avatarImage,
      ),
    [aiShenanigans.items, summary.avatarImage],
  );
  const { mode, toggleColorMode, isReady } = useColorModePreference({
    storageKey: GLOBAL_COLOR_MODE_STORAGE_KEY,
  });
  const theme = useMemo(() => getFabricTheme(mode), [mode]);
  const { setDocumentTitle } = useDocumentTitle();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitialHashSynced, setIsInitialHashSynced] = useState(false);

  const shenaniganIndexBySlug = useMemo(() => {
    const indexBySlug = new Map<string, number>();

    shenaniganItems.forEach((item, index) => {
      indexBySlug.set(item.slug, index);
    });

    return indexBySlug;
  }, [shenaniganItems]);

  const clampIndex = useCallback(
    (value: number) => {
      if (!shenaniganItems.length) {
        return 0;
      }

      if (value < 0) {
        return shenaniganItems.length - 1;
      }

      if (value >= shenaniganItems.length) {
        return 0;
      }

      return value;
    },
    [shenaniganItems.length],
  );

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => clampIndex(prevIndex - 1));
  }, [clampIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => clampIndex(prevIndex + 1));
  }, [clampIndex]);

  const handleSelectShenanigan = (index: number) => {
    setCurrentIndex(clampIndex(index));
  };

  useEffect(() => {
    setDocumentTitle(aiShenanigansRoute.documentTitle);
  }, [aiShenanigansRoute.documentTitle, setDocumentTitle]);

  useEffect(() => {
    if (!shenaniganItems.length || typeof window === "undefined") {
      setIsInitialHashSynced(true);
      return;
    }

    const syncFromHash = () => {
      const slug = decodeHashSlug(window.location.hash);
      if (!slug) {
        return;
      }

      const indexFromHash = shenaniganIndexBySlug.get(slug);
      if (typeof indexFromHash === "number") {
        setCurrentIndex(indexFromHash);
      }
    };

    syncFromHash();
    setIsInitialHashSynced(true);
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, [shenaniganIndexBySlug, shenaniganItems.length]);

  useEffect(() => {
    if (!isInitialHashSynced || !shenaniganItems.length || typeof window === "undefined") {
      return;
    }

    const slug = shenaniganItems[currentIndex]?.slug;
    if (!slug) {
      return;
    }

    const nextHash = `#${encodeURIComponent(slug)}`;
    if (window.location.hash === nextHash) {
      return;
    }

    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [currentIndex, isInitialHashSynced, shenaniganItems]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingField =
        Boolean(target?.isContentEditable) ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT";

      if (isTypingField) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNext, handlePrevious]);

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  if (!isReady || !shenaniganItems.length) {
    return null;
  }

  const currentItem = shenaniganItems[currentIndex];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Box
        sx={(theme) => ({
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
          ...(theme.palette.mode === "light" && {
            "--fabric-surface-1": "rgba(255, 255, 255, 0.54)",
            "--fabric-surface-2": "rgba(255, 255, 255, 0.7)",
            "--fabric-surface-3": "rgba(255, 255, 255, 0.84)",
            "--fabric-surface-border": "rgba(55, 86, 136, 0.14)",
            "--fabric-surface-border-strong": "rgba(55, 86, 136, 0.24)",
            "--fabric-inner-glow": "rgba(255, 255, 255, 0.9)",
            "--fabric-shadow-soft": "0 14px 40px rgba(35, 58, 99, 0.1)",
            "--fabric-shadow-tight": "0 8px 22px rgba(33, 55, 95, 0.08)",
          }),
        })}
      >
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            bgcolor: "background.default",
            borderRadius: 0,
          }}
        >
          <Box
            sx={{
              px: { xs: 1.5, md: 2.5 },
              py: 1.25,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconButton
              color="inherit"
              aria-label="Back to portfolio"
              href={withBasePath("/")}
              size="small"
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6">{aiShenanigans.title}</Typography>
              {!isSmallScreen && (
                <Typography variant="body2" color="text.secondary">
                  {aiShenanigans.description}
                </Typography>
              )}
            </Box>
            <IconButton
              color="inherit"
              aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={toggleColorMode}
              size="small"
            >
              {mode === "light" ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
            </IconButton>
            <IconButton
              color="inherit"
              aria-label="Close shenanigans panel"
              href={withBasePath("/")}
              size="small"
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              px: { xs: 1.5, md: 2.5 },
              py: 1.5,
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              maxWidth: "100%",
              overflow: "hidden",
              display: "flex",
              backgroundColor: "transparent",
            }}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                maxWidth: "100%",
                display: "flex",
                overflow: "hidden",
                pr: 0.5,
                backgroundColor: "transparent",
                "& > *": {
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  maxWidth: "100%",
                },
              }}
            >
              <AIShenanigan key={currentItem.slug} {...currentItem.props} />
            </Box>
          </Box>

          <AIShenaniganPager
            currentIndex={currentIndex}
            items={shenaniganItems}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSelectShenanigan={handleSelectShenanigan}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
