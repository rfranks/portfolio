"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { EmojiGlyph } from "@/components/shared";
import { ImageLightbox } from "@/components/shared";
import { MarkdownContent } from "@/components/shared";
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
  const [isInfoPanelMinimized, setIsInfoPanelMinimized] = useState(false);
  const PLAYER_VIEW_HEIGHT_PX = 300;
  const [lyricsMarkdown, setLyricsMarkdown] = useState<string | null>(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [hasLyricsError, setHasLyricsError] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [songRevealed, setSongRevealed] = useState(false);
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
          boxShadow:
            "0 0 0 2px rgba(255,255,255,0.22) inset, 0 10px 24px rgba(127,29,29,0.18)",
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
    if (!lyricsOpen || lyricsMarkdown) {
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
  }, [lyricsMarkdownPath, lyricsOpen, lyricsMarkdown]);

  const renderSource = (label?: string, href?: string) => {
    if (!label) {
      return null;
    }

    return (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1 }}
      >
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

  return (
    <AIShenaniganPanel>
      <Stack
        gap={"1rem"}
        display={"flex"}
        flexDirection={isSmallScreen ? "column" : "row"}
        justifyContent={"space-between"}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            borderRadius: "20px",
            border: "1px solid",
            borderColor: "var(--fabric-surface-border)",
            backgroundColor: "var(--fabric-surface-1)",
            p: { xs: 2.2, md: 2.8 },
            width:
              songRevealed && !isSmallScreen ? "calc(50% - 0.5rem)" : "100%",
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
          {/* <Button
            size="small"
            variant="text"
            onClick={() =>
              setIsInfoPanelMinimized((currentValue) => !currentValue)
            }
            endIcon={
              <EmojiGlyph
                glyph={isInfoPanelMinimized ? "🔽" : "🔼"}
                slot="end"
                size="0.95rem"
              />
            }
            sx={{
              mt: 0.25,
              mb: 0.75,
              display: { xs: "inline-flex", md: "none" },
              alignSelf: "flex-start",
            }}
          >
            {isInfoPanelMinimized ? "Expand Panel" : "Minimize Panel"}
          </Button> */}
          {!isInfoPanelMinimized && (
            <Typography
              color="text.secondary"
              sx={{
                maxHeight: isSmallScreen && songRevealed ? "15dvh" : "auto",
                overflowY: isSmallScreen && songRevealed ? "auto" : "visible",
              }}
            >
              {blurb}
            </Typography>
          )}
          {!songRevealed && !lyricsOpen ? (
            <Box
              sx={{
                display: "flex",
                flexGrow: 1,
                alignItems: "flex-end",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="contained"
                onClick={() => setSongRevealed(true)}
                endIcon={<EmojiGlyph glyph="🎵" slot="end" />}
                sx={{ height: "1rem" }}
              >
                Reveal Song
              </Button>
            </Box>
          ) : null}
        </Box>

        {songRevealed ? (
          <Fade in={songRevealed} timeout={420}>
            <Box
              sx={{
                borderRadius: "20px",
                border: "1px solid",
                borderColor: "var(--fabric-surface-border)",
                backgroundColor: "var(--fabric-surface-1)",
                p: 2,
                mt: 0,
                ml: 2,
                overflowY: "auto",
                height: "100%",
                width: !isSmallScreen ? "calc(50% - 0.5rem)" : "100%",
              }}
            >
              {!lyricsOpen ? (
                <Stack spacing={1.7} sx={{ p: 2 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    sx={{ minHeight: { md: `${PLAYER_VIEW_HEIGHT_PX}px` } }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        flexShrink: 0,
                        overflow: "hidden",
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <ImageLightbox
                          src={withBasePath(songAlbumImage)}
                          alt={`${title} album cover`}
                          title={`${title}`}
                          caption={songAlbumCaption || `Written by ${songWrittenBy} • Performed by ${songPerformedBy}`}
                          triggerSx={{ width: "100%", display: "block" }}
                          previewContainerSx={{
                            width: { xs: "20dvh", md: "45dvh" },
                            aspectRatio: "1 / 1",
                            borderRadius: "inherit",
                            overflow: "hidden",
                          }}
                          previewImageSx={{
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                    </Box>
                  </Stack>
                </Stack>
              ) : (
                <Box
                  sx={{
                    maxHeight: `${PLAYER_VIEW_HEIGHT_PX}px`,
                    overflowY: "auto",
                    pr: 0.5,
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
              )}

              <Box
                component="audio"
                controls
                preload="metadata"
                src={withBasePath(songAudio)}
                sx={{
                  mt: 2,
                  width: "100%",
                }}
              >
                Your browser does not support the audio element.
              </Box>

              {lyricsMarkdownPath ? (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="outlined"
                    onClick={() => setLyricsOpen((prev) => !prev)}
                    endIcon={
                      <EmojiGlyph
                        glyph={lyricsOpen ? "🙈" : "📜"}
                        slot="end"
                        size="1rem"
                      />
                    }
                  >
                    {lyricsOpen ? "Hide Lyrics" : "Show Lyrics"}
                  </Button>
                </Box>
              ) : null}
            </Box>
          </Fade>
        ) : null}
      </Stack>
    </AIShenaniganPanel>
  );
}
