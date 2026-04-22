"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { EmojiGlyph, ImageLightbox, MarkdownContent, MediaCycler } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import AIShenaniganPanel from "./AIShenaniganPanel";
import { withBasePath } from "@/utils/basePath";

type AIShenaniganSongRecordingProps = {
  rank: number;
  title: string;
  blurb: string;
  intentToCopyright?: boolean;
  rightsNotice?: string;
  songAlbumImage: string;
  songAlbumSource?: string;
  songAlbumSourceHref?: string;
  songAlbumCaption?: string;
  songAudio: string;
  songAudioSource?: string;
  songAudioSourceHref?: string;
  songAudioCaption?: string;
  songWrittenBy?: string;
  songPerformedBy?: string;
  lyricsMarkdownPath?: string;
  lyricsSource?: string;
  lyricsSourceHref?: string;
};

export default function AIShenaniganSongRecording({
  rank,
  title,
  blurb,
  intentToCopyright = false,
  rightsNotice,
  songAlbumImage,
  songAlbumCaption,
  songAudio,
  songWrittenBy,
  songPerformedBy,
  lyricsMarkdownPath,
  lyricsSource,
  lyricsSourceHref,
}: AIShenaniganSongRecordingProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [isInfoPanelMinimized, setIsInfoPanelMinimized] = useState(false);
  const mobileInfoPanelHeight = "clamp(220px, 30dvh, 320px)";
  const mobileSplitGap = "20px";
  const desktopInfoPanelBasis = "30%";
  const desktopInfoPanelMaxWidth = "36%";
  const [lyricsMarkdown, setLyricsMarkdown] = useState<string | null>(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [hasLyricsError, setHasLyricsError] = useState(false);
  const [songRevealed, setSongRevealed] = useState(false);
  const [activeSongPanelKey, setActiveSongPanelKey] = useState<"album" | "lyrics">("album");
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingAudioSyncRef = useRef(false);
  const audioSnapshotRef = useRef({
    currentTime: 0,
    wasPlaying: false,
  });
  const hasVisibleMedia = songRevealed;
  const hasLyricsPanel = Boolean(lyricsMarkdownPath);
  const formattedRank = `#${String(rank).padStart(2, "0")}`;
  const rightsLabel = rightsNotice || "Intent to Copyright";
  const rightsStampAngle = ((rank * 7) % 17) - 8;

  const renderCredits = () => (
    <Stack spacing={1.35} sx={{ minWidth: 0, m: 2 }}>
      {songWrittenBy ? (
        <Typography variant="body2" color="text.secondary">
          Written by {songWrittenBy}
        </Typography>
      ) : null}
      {songPerformedBy ? (
        <Typography variant="body2" color="text.secondary">
          Performed by {songPerformedBy}
        </Typography>
      ) : null}
    </Stack>
  );

  const renderRightsStamp = () => {
    if (!intentToCopyright) {
      return null;
    }

    return (
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: { xs: 52, md: 60 },
          right: { xs: 14, md: 22 },
          zIndex: 2,
          pointerEvents: "none",
          px: 1.4,
          py: 0.7,
          borderRadius: "10px",
          border: "3px solid rgba(185,28,28,0.85)",
          color: "rgba(127,29,29,0.96)",
          bgcolor: "rgba(255,244,244,0.82)",
          fontSize: { xs: "0.7rem", md: "0.82rem" },
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          transform: `rotate(${rightsStampAngle}deg)`,
          boxShadow: "0 0 0 2px rgba(255,255,255,0.22) inset, 0 10px 24px rgba(127,29,29,0.18)",
          textShadow: "0 1px 0 rgba(255,255,255,0.3)",
          opacity: 0.92,
        }}
      >
        {rightsLabel}
      </Box>
    );
  };

  useEffect(() => {
    if (!isSmallScreen) {
      setIsInfoPanelMinimized(false);
    }
  }, [isSmallScreen]);

  useEffect(() => {
    if (!lyricsMarkdownPath) {
      setLyricsMarkdown(null);
      setIsLyricsLoading(false);
      setHasLyricsError(false);
      return;
    }
    if (activeSongPanelKey !== "lyrics" || lyricsMarkdown) {
      return;
    }

    const controller = new AbortController();
    setIsLyricsLoading(true);
    setHasLyricsError(false);

    const loadLyrics = async () => {
      try {
        const response = await fetch(withBasePath(lyricsMarkdownPath), {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            `Failed to load lyrics markdown: ${response.status} ${response.statusText}`,
          );
        }
        const content = await response.text();
        setLyricsMarkdown(content);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error(error);
        setHasLyricsError(true);
        setLyricsMarkdown(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLyricsLoading(false);
        }
      }
    };

    void loadLyrics();

    return () => {
      controller.abort();
    };
  }, [lyricsMarkdownPath, activeSongPanelKey, lyricsMarkdown]);

  const renderSource = (label?: string, href?: string) => {
    if (!label) {
      return null;
    }

    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Source:{" "}
        {href ? (
          <Link href={href} target="_blank" rel="noreferrer">
            {label}
          </Link>
        ) : (
          label
        )}
      </Typography>
    );
  };

  const captureAudioSnapshot = useCallback(() => {
    const audioNode = activeAudioRef.current;
    if (!audioNode) {
      return;
    }

    audioSnapshotRef.current = {
      currentTime: audioNode.currentTime || 0,
      wasPlaying: !audioNode.paused,
    };
    pendingAudioSyncRef.current = true;
  }, []);

  const attachAudioRef = useCallback((node: HTMLAudioElement | null) => {
    activeAudioRef.current = node;

    if (!node || !pendingAudioSyncRef.current) {
      return;
    }

    const { currentTime, wasPlaying } = audioSnapshotRef.current;
    if (currentTime > 0) {
      try {
        node.currentTime = currentTime;
      } catch {
        // Ignore out-of-range timing writes while metadata loads.
      }
    }

    if (wasPlaying) {
      void node.play().catch(() => {
        // Controls remain available if autoplay is blocked.
      });
    }

    pendingAudioSyncRef.current = false;
  }, []);

  const switchSongPanel = useCallback(
    (nextPanel: "album" | "lyrics") => {
      if (nextPanel === activeSongPanelKey) {
        return;
      }

      captureAudioSnapshot();
      setActiveSongPanelKey(nextPanel);
    },
    [activeSongPanelKey, captureAudioSnapshot],
  );

  useEffect(() => {
    if (!songRevealed) {
      setActiveSongPanelKey("album");
      pendingAudioSyncRef.current = false;
      audioSnapshotRef.current = {
        currentTime: 0,
        wasPlaying: false,
      };
    }
  }, [songRevealed]);

  const mediaControlSx = (currentTheme: typeof theme) => ({
    color: currentTheme.palette.common.black,
    borderColor: currentTheme.palette.common.black,
    bgcolor: currentTheme.palette.common.white,
    "&:hover": {
      bgcolor: currentTheme.palette.common.white,
    },
    "&.Mui-disabled": {
      color: alpha(currentTheme.palette.common.black, 0.36),
      borderColor: alpha(currentTheme.palette.common.black, 0.36),
      bgcolor: alpha(currentTheme.palette.common.white, 0.8),
    },
  });

  const renderSharedAudioPlayer = () => (
    <Box
      component="audio"
      controls
      preload="metadata"
      src={withBasePath(songAudio)}
      ref={attachAudioRef}
      sx={{
        mt: 2,
        width: "100%",
      }}
    >
      Your browser does not support the audio element.
    </Box>
  );

  const songPanelOrder: ("album" | "lyrics")[] = hasLyricsPanel ? ["album", "lyrics"] : ["album"];

  const songPanelItems: MediaCyclerItem[] = (() => {
    const items: MediaCyclerItem[] = [
      {
        key: "album",
        title: "",
        mediaType: "custom",
        mediaUrl: "",
        panelSx: {
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        },
        assetFrameSx: {
          width: "100%",
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
        },
        customContentSx: {
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        },
        customContent: (
          <Box
            sx={{
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                flex: "1 1 0%",
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                overflow: "hidden",
              }}
            >
              <ImageLightbox
                src={withBasePath(songAlbumImage)}
                alt={`${title} album cover`}
                title={title}
                caption={
                  songAlbumCaption ||
                  `Written by ${songWrittenBy} • Performed by ${songPerformedBy}`
                }
                triggerSx={{ width: "100%", display: "block", height: "100%" }}
                previewContainerSx={{
                  width: "100%",
                  height: "100%",
                  maxWidth: 520,
                  maxHeight: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: "inherit",
                  overflow: "hidden",
                  marginInline: "auto",
                }}
                previewImageSx={{
                  objectFit: "cover",
                }}
              />
            </Box>
            {renderSharedAudioPlayer()}
          </Box>
        ),
        onSelect: () => {
          switchSongPanel("album");
        },
      },
    ];

    if (hasLyricsPanel) {
      items.push({
        key: "lyrics",
        title: "",
        mediaType: "custom",
        mediaUrl: "",
        panelSx: {
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        },
        assetFrameSx: {
          width: "100%",
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
        },
        customContentSx: {
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        },
        customContent: (
          <Box
            sx={{
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                flex: "1 1 auto",
                minHeight: 0,
                overflowY: "auto",
                px: { xs: 5, md: 6 },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  mb: 1,
                  py: 0.5,
                  bgcolor: "var(--fabric-surface-1)",
                  borderBottom: "1px solid",
                  borderColor: "var(--fabric-surface-border)",
                }}
              >
                Lyrics
              </Typography>
              {isLyricsLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading lyrics...
                </Typography>
              ) : null}
              {hasLyricsError ? (
                <Typography variant="body2" color="error.main">
                  Could not load lyrics.
                </Typography>
              ) : null}
              {!isLyricsLoading && !hasLyricsError && lyricsMarkdown ? (
                <MarkdownContent content={lyricsMarkdown} variant="body2" />
              ) : null}
              {renderSource(lyricsSource, lyricsSourceHref)}
            </Box>
            {renderSharedAudioPlayer()}
          </Box>
        ),
        onSelect: () => {
          switchSongPanel("lyrics");
        },
      });
    }

    return items;
  })();

  const activeSongPanelIndex = songPanelOrder.indexOf(activeSongPanelKey);

  return (
    <AIShenaniganPanel className="overflow-hidden">
      <Stack
        spacing={3}
        flexGrow={1}
        sx={{ minWidth: 0, maxWidth: "100%", minHeight: 0, height: "100%" }}
      >
        <Stack
          spacing={2.5}
          direction={{ xs: "column", md: "row" }}
          flexGrow={1}
          sx={{
            minWidth: 0,
            maxWidth: "100%",
            minHeight: 0,
            height: "100%",
            alignItems: "stretch",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: { xs: isSmDown && hasVisibleMedia ? "none" : "flex", md: "flex" },
              height: {
                xs: hasVisibleMedia ? mobileInfoPanelHeight : "100%",
                md: "100%",
              },
              width: { xs: "100%", md: "auto" },
              maxWidth: {
                xs: "100%",
                md: hasVisibleMedia ? desktopInfoPanelMaxWidth : "100%",
              },
              minWidth: 0,
              flex: {
                xs: "0 0 auto",
                md: hasVisibleMedia ? `0 1 ${desktopInfoPanelBasis}` : "1 1 100%",
              },
              flexBasis: {
                md: hasVisibleMedia ? desktopInfoPanelBasis : "100%",
              },
              flexShrink: { xs: 0, md: 1 },
              flexGrow: { xs: 0, md: hasVisibleMedia ? 0 : 1 },
              order: { xs: 2, md: 2 },
            }}
          >
            <Box
              sx={{
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                pr: { md: hasVisibleMedia ? 0.5 : 0 },
              }}
            >
              <Box
                className="relative overflow-hidden"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: "var(--fabric-surface-border)",
                  backgroundColor: "var(--fabric-surface-1)",
                  p: { xs: 2.2, md: 2.8 },
                  height: "100%",
                  minHeight: 0,
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 18,
                    fontSize: { xs: "2.8rem", sm: "3.5rem" },
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: "-0.08em",
                    color: "transparent",
                    WebkitTextStroke: "1px rgba(96,165,250,0.5)",
                    textShadow: "0 12px 30px rgba(37,99,235,0.18)",
                    opacity: 0.95,
                    userSelect: "none",
                  }}
                >
                  {formattedRank}
                </Box>
                {renderRightsStamp()}
                <Typography variant="h4" sx={{ mt: 1, mb: 1.2 }}>
                  {title}
                </Typography>
                {renderCredits()}
                {!isInfoPanelMinimized && <Typography color="text.secondary">{blurb}</Typography>}
                {!songRevealed ? (
                  <Box
                    sx={{
                      mt: "auto",
                      pt: 2.25,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => setSongRevealed(true)}
                      endIcon={<EmojiGlyph glyph="🎵" slot="end" />}
                    >
                      Reveal Song
                    </Button>
                  </Box>
                ) : null}
              </Box>
            </Box>
          </Box>

          {songRevealed ? (
            <Fade in={songRevealed} timeout={420}>
              <Stack
                spacing={2}
                sx={{
                  minWidth: 0,
                  flex: {
                    xs: hasVisibleMedia ? (isSmDown ? "1 1 0px" : "1 1 0px") : "0 0 auto",
                    md: "1 1 0%",
                  },
                  width: { xs: "100%", md: 0 },
                  height: {
                    xs: hasVisibleMedia
                      ? isSmDown
                        ? "100%"
                        : `calc(100% - ${mobileInfoPanelHeight} - ${mobileSplitGap})`
                      : 0,
                    md: "100%",
                  },
                  minHeight: 0,
                  overflow: "hidden",
                  pr: { md: 1.25 },
                  maxWidth: "100%",
                  order: { xs: 1, md: 1 },
                }}
              >
                <Box
                  sx={{
                    borderRadius: "20px",
                    border: "1px solid",
                    borderColor: "var(--fabric-surface-border)",
                    backgroundColor: "var(--fabric-surface-1)",
                    p: 2,
                    minHeight: 0,
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <MediaCycler
                    items={songPanelItems}
                    singlePanel
                    singlePanelActiveKey={activeSongPanelKey}
                    transitionMs={260}
                    showChevronNavigation={songPanelOrder.length > 1}
                    hideDisabledNextChevron
                    disableChevronPrevious={activeSongPanelIndex <= 0}
                    disableChevronNext={activeSongPanelIndex >= songPanelOrder.length - 1}
                    onChevronPrevious={() => {
                      if (activeSongPanelIndex <= 0) {
                        return;
                      }

                      const previousKey = songPanelOrder[activeSongPanelIndex - 1];
                      if (previousKey) {
                        switchSongPanel(previousKey);
                      }
                    }}
                    onChevronNext={() => {
                      if (activeSongPanelIndex >= songPanelOrder.length - 1) {
                        return;
                      }

                      const nextKey = songPanelOrder[activeSongPanelIndex + 1];
                      if (nextKey) {
                        switchSongPanel(nextKey);
                      }
                    }}
                    navigationControlSx={mediaControlSx}
                    expandControlSx={mediaControlSx}
                    stackSx={{
                      flexGrow: 1,
                      minHeight: 0,
                      height: "100%",
                      overflow: "hidden",
                    }}
                  />
                </Box>
              </Stack>
            </Fade>
          ) : null}
        </Stack>
      </Stack>
    </AIShenaniganPanel>
  );
}
