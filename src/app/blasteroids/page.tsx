"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArcadeGamePage, ArcadeGameShell } from "@/components/shared";
import { useArcadeEngineCore } from "@/hooks/game/useArcadeEngineCore";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";

const BLASTEROIDS_URL = "https://rfranks.github.io/blasteroids/";
const BLASTEROIDS_LOAD_TIMEOUT_MS = 12000;

export default function BlasteroidsPage() {
  const { arcadeProfile } = useArcadeEngineCore({
    arcadeGameId: "blasteroids",
    debugName: "blasteroids",
    stopLoopOnUnmount: false,
  });
  const startArcadeSession = arcadeProfile.startSession;
  const finishArcadeSession = arcadeProfile.finishSession;
  const { portfolioApps } = useResumeData();
  const blasteroidsRoute = getPortfolioAppRouteContract(portfolioApps, "blasteroids");
  const documentTitle = blasteroidsRoute.documentTitle;
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const arcadeSessionActiveRef = React.useRef(arcadeProfile.isSessionActive);
  const [iframeSrc, setIframeSrc] = React.useState(BLASTEROIDS_URL);
  const [iframeLoaded, setIframeLoaded] = React.useState(false);
  const [iframeLoadTimedOut, setIframeLoadTimedOut] = React.useState(false);

  const focusGameFrame = React.useCallback(() => {
    iframeRef.current?.focus();
  }, []);

  React.useEffect(() => {
    arcadeSessionActiveRef.current = arcadeProfile.isSessionActive;
  }, [arcadeProfile.isSessionActive]);

  React.useEffect(() => {
    setIframeLoaded(false);
    setIframeLoadTimedOut(false);
    const timeout = window.setTimeout(() => {
      setIframeLoadTimedOut(true);
    }, BLASTEROIDS_LOAD_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [iframeSrc]);

  const handleSessionStart = React.useCallback(() => {
    if (arcadeSessionActiveRef.current) {
      finishArcadeSession({ completed: false });
    }
    startArcadeSession();
    arcadeSessionActiveRef.current = true;
  }, [finishArcadeSession, startArcadeSession]);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (typeof window === "undefined") {
        return;
      }
      const allowedOrigins = new Set([window.location.origin, "https://rfranks.github.io"]);
      if (!allowedOrigins.has(event.origin)) {
        return;
      }
      if (!event.data || typeof event.data !== "object") {
        return;
      }

      const payload = event.data as Partial<{
        type: string;
        score: number;
        medalsCollected: number;
        accuracyPct: number;
        completed: boolean;
        stats: Record<string, number>;
      }>;
      if (payload.type !== "blasteroids:session-end") {
        return;
      }

      finishArcadeSession({
        completed: payload.completed ?? true,
        score: payload.score,
        medalsCollected: payload.medalsCollected,
        accuracyPct: payload.accuracyPct,
        stats: payload.stats,
      });
      arcadeSessionActiveRef.current = false;
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [finishArcadeSession]);

  const handleRetryEmbed = React.useCallback(() => {
    const bust = Date.now();
    setIframeSrc(`${BLASTEROIDS_URL}?embedRetry=${bust}`);
  }, []);

  React.useEffect(() => {
    return () => {
      if (!arcadeSessionActiveRef.current) {
        return;
      }
      finishArcadeSession({ completed: false });
    };
  }, [finishArcadeSession]);

  return (
    <ArcadeGamePage documentTitle={documentTitle} fullWidth>
      <ArcadeGameShell
        arcadeGameId="blasteroids"
        arcadeProfile={arcadeProfile.profile}
        showTitleSplash={false}
        assetsReady
        onStart={() => {
          // no-op: Blasteroids uses an external iframe game.
        }}
        renderTitleSplash={() => null}
      >
        <Box
          sx={{
            width: "100%",
            py: 1.25,
            px: { xs: 1.5, md: 2 },
          }}
        >
          <Stack spacing={1.5}>
            <Paper
              elevation={0}
              sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
                gap={1}
              >
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {documentTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Full-screen arcade shell focused on gameplay.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  href={BLASTEROIDS_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleSessionStart}
                >
                  Open Standalone
                </Button>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 0.9,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: { xs: "calc(100dvh - 212px)", md: "calc(100dvh - 164px)" },
                  minHeight: { xs: "58dvh", md: "66dvh" },
                  borderRadius: 1.5,
                  overflow: "hidden",
                  backgroundColor: "#000",
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  title={documentTitle}
                  tabIndex={0}
                  style={{
                    border: "none",
                    width: "100%",
                    height: "100%",
                    display: "block",
                  }}
                  onLoad={() => {
                    setIframeLoaded(true);
                    setIframeLoadTimedOut(false);
                    handleSessionStart();
                    focusGameFrame();
                    window.setTimeout(focusGameFrame, 50);
                  }}
                  onError={() => {
                    setIframeLoadTimedOut(true);
                  }}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
                {iframeLoadTimedOut && !iframeLoaded ? (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: "rgba(2, 6, 23, 0.88)",
                      color: "#f8fafc",
                      p: 2,
                      textAlign: "center",
                      gap: 1.25,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      Embedded Blasteroids did not finish loading.
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" onClick={handleRetryEmbed}>
                        Retry Embed
                      </Button>
                      <Button
                        variant="outlined"
                        href={BLASTEROIDS_URL}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleSessionStart}
                      >
                        Open Standalone
                      </Button>
                    </Stack>
                  </Box>
                ) : null}
              </Box>
            </Paper>
          </Stack>
        </Box>
      </ArcadeGameShell>
    </ArcadeGamePage>
  );
}
