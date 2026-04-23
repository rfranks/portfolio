"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import { renderNavigationIcon } from "@/components/portfolio/layout/navigationIcons";
import type { SubsectionPagerItem } from "@/components/portfolio/layout/SubsectionPager";
import { DemoSlide, MarkdownContent, VideoLightbox } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { withBasePath } from "@/utils/basePath";
import ArchitectureDiagramsSlide from "./_components/ArchitectureDiagramsSlide";
import BlackjackCarouselNav from "./_components/BlackjackCarouselNav";
import BlackjackGameSlide from "./_components/BlackjackGameSlide";
import { useBlackjackPage } from "./_hooks/useBlackjackPage";
import type { BlackjackDiagramConfig, BlackjackDiagramVisualConfig } from "./_types/page";
import "./page.css";

type ResolvedDiagramVisual = {
  iconNode?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
};

type BlackjackTerminalDemoConfig = {
  mediaType?: "video" | "image";
  mediaUrl?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  mediaAlt?: string;
};

const hasResolvedDiagramVisual = (visual: ResolvedDiagramVisual) =>
  Boolean(visual.imageSrc || visual.iconNode);

const resolveDiagramVisual = (
  visual: BlackjackDiagramVisualConfig | undefined,
  fallbackLabel: string,
): ResolvedDiagramVisual => {
  if (!visual) {
    return {};
  }

  if (visual.type === "image") {
    const source = visual.src?.trim();
    if (!source) {
      return {};
    }
    return {
      imageSrc: withBasePath(source),
      imageAlt: visual.alt?.trim() || `${fallbackLabel} diagram visual`,
    };
  }

  if (visual.type === "emoji") {
    const icon = visual.icon?.trim();
    if (!icon) {
      return {};
    }
    return {
      iconNode: renderNavigationIcon(
        { iconType: "emoji", icon },
        { fallbackIconKey: "casino", emojiSize: "1rem" },
      ),
    };
  }

  return {
    iconNode: renderNavigationIcon(
      { iconType: "material", icon: visual.icon?.trim() || "casino" },
      { fallbackIconKey: "casino", fontSize: "small" },
    ),
  };
};

export default function BlackjackPage() {
  const { projects } = useResumeData();
  const blackjack = useBlackjackPage();
  const blackjackProject = projects?.find((proj) => proj?.href === "/blackjack");
  const blackjackTerminalDemo = React.useMemo(() => {
    const configured = (
      blackjackProject as { terminalDemo?: BlackjackTerminalDemoConfig } | undefined
    )?.terminalDemo;
    if (!configured) {
      return null;
    }

    const title = configured.title?.trim();
    const subtitle = configured.subtitle?.trim();
    const caption = configured.caption?.trim();
    const mediaType = configured.mediaType?.trim();
    const mediaUrl = configured.mediaUrl?.trim();

    if (!title || !subtitle || !caption || !mediaUrl || mediaType !== "video") {
      return null;
    }

    return {
      title,
      subtitle,
      caption,
      mediaUrl,
      mediaAlt: configured.mediaAlt?.trim(),
    };
  }, [blackjackProject]);
  const blackjackDiagrams = React.useMemo(
    () => (blackjackProject?.diagrams as BlackjackDiagramConfig[] | undefined) ?? [],
    [blackjackProject?.diagrams],
  );
  const captionSlotSx = React.useMemo<SxProps<Theme>>(
    () => ({
      mt: 0.75,
      flexShrink: 0,
      width: "100%",
      minHeight: { xs: 40, md: 52 },
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-start",
    }),
    [],
  );
  const captionTextSx = React.useMemo<SxProps<Theme>>(
    () => ({
      width: "100%",
      fontSize: { xs: "0.96rem", md: "1.06rem", lg: "1.12rem" },
      fontWeight: 500,
      lineHeight: 1.45,
      textAlign: "left",
      color: (theme) => alpha(theme.palette.common.white, 0.9),
      display: "-webkit-box",
      WebkitLineClamp: { xs: 2, md: 3 },
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    }),
    [],
  );
  const normalizedBlackjackDiagrams = React.useMemo(
    () =>
      blackjackDiagrams
        .filter((diagram): diagram is BlackjackDiagramConfig & { diagram: string } =>
          Boolean(diagram.diagram?.trim()),
        )
        .map((diagram, index) => {
          const title = diagram.title?.trim() || `Diagram ${index + 1}`;
          return {
            ...diagram,
            title,
            key: `diagram-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          };
        }),
    [blackjackDiagrams],
  );
  const [activeDiagramKey, setActiveDiagramKey] = React.useState<string | undefined>(
    normalizedBlackjackDiagrams[0]?.key,
  );
  const activeDiagramIndex = React.useMemo(() => {
    const index = normalizedBlackjackDiagrams.findIndex(
      (diagram) => diagram.key === activeDiagramKey,
    );
    return index >= 0 ? index : 0;
  }, [activeDiagramKey, normalizedBlackjackDiagrams]);
  const hasMultipleDiagrams = normalizedBlackjackDiagrams.length > 1;
  const diagramPagerItems = React.useMemo<SubsectionPagerItem[]>(
    () =>
      normalizedBlackjackDiagrams.map((diagram, index) => {
        const optionVisual = resolveDiagramVisual(diagram.selectorOptionVisual, diagram.title);
        const selectedVisualCandidate = resolveDiagramVisual(
          diagram.selectorSelectedVisual ?? diagram.selectorOptionVisual,
          diagram.title,
        );
        const selectedVisual = hasResolvedDiagramVisual(selectedVisualCandidate)
          ? selectedVisualCandidate
          : optionVisual;

        return {
          key: diagram.key,
          title: diagram.title,
          selectedTitle: diagram.title,
          selectedImageSrc: selectedVisual.imageSrc,
          selectedImageAlt: selectedVisual.imageAlt,
          selectedIcon: selectedVisual.iconNode,
          optionTitle: `${index + 1}. ${diagram.title}`,
          optionSubtitle: diagram.shortText?.trim() || undefined,
          optionImageSrc: optionVisual.imageSrc,
          optionImageAlt: optionVisual.imageAlt,
          optionIcon: optionVisual.iconNode,
        };
      }),
    [normalizedBlackjackDiagrams],
  );
  const blackjackDiagramItems = React.useMemo<MediaCyclerItem[]>(
    () =>
      normalizedBlackjackDiagrams.map((diagram) => ({
        key: diagram.key,
        title: "",
        mediaLightboxTitle: diagram.title,
        lightboxSubtitle: diagram.shortText?.trim() || undefined,
        mediaType: "diagram",
        mediaUrl: diagram.diagram,
        onSelect: () => {
          setActiveDiagramKey(diagram.key);
        },
        panelSx: {
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          width: "100%",
          minHeight: 0,
          height: "100%",
          flex: "1 1 auto",
          p: 0,
          overflow: "visible",
          border: 0,
          borderRadius: 0,
          background: "transparent",
          boxShadow: "none",
        },
        assetFrameSx: {
          width: "100%",
          minHeight: 0,
          height: { xs: "calc(100% - 78px)", md: "calc(100% - 90px)" },
          flex: "0 1 auto",
          overflow: "hidden",
        },
        diagramProps: {
          title: diagram.title,
          type: diagram.type,
          height: "100%",
          width: "100%",
          showToolbar: true,
          showGridDots: true,
          autoFitPadding: diagram.autoFitPadding ?? 14,
          autoFitScaleMultiplier: diagram.autoFitScaleMultiplier ?? 1,
          autoFitOffsetX: diagram.autoFitOffsetX ?? 0,
          autoFitOffsetY: diagram.autoFitOffsetY ?? 0,
        },
        extraContent: diagram.description?.trim() ? (
          <Box sx={captionSlotSx}>
            <Typography component="div" variant="body2" sx={captionTextSx}>
              {diagram.description.trim()}
            </Typography>
          </Box>
        ) : undefined,
      })),
    [captionSlotSx, captionTextSx, normalizedBlackjackDiagrams],
  );

  const handleSelectDiagram = React.useCallback((key: string) => {
    setActiveDiagramKey(key);
  }, []);

  const handlePreviousDiagram = React.useCallback(() => {
    if (normalizedBlackjackDiagrams.length === 0) {
      return;
    }

    const previousIndex =
      (activeDiagramIndex - 1 + normalizedBlackjackDiagrams.length) %
      normalizedBlackjackDiagrams.length;
    setActiveDiagramKey(normalizedBlackjackDiagrams[previousIndex]?.key);
  }, [activeDiagramIndex, normalizedBlackjackDiagrams]);

  const handleNextDiagram = React.useCallback(() => {
    if (normalizedBlackjackDiagrams.length === 0) {
      return;
    }

    const nextIndex = (activeDiagramIndex + 1) % normalizedBlackjackDiagrams.length;
    setActiveDiagramKey(normalizedBlackjackDiagrams[nextIndex]?.key);
  }, [activeDiagramIndex, normalizedBlackjackDiagrams]);

  React.useEffect(() => {
    setActiveDiagramKey(normalizedBlackjackDiagrams[0]?.key);
  }, [normalizedBlackjackDiagrams]);

  return (
    <main
      ref={blackjack.pageRef}
      className="blackjack-page"
      data-engine-state-ready={blackjack.engineState ? "true" : "false"}
    >
      {blackjack.blackjackConfettiPieces.length ? (
        <div className="blackjack-confetti-layer" aria-hidden="true">
          {blackjack.blackjackConfettiPieces.map((piece) => (
            <span
              key={piece.id}
              className={`blackjack-confetti-piece blackjack-confetti-piece--${piece.shape}`}
              style={
                {
                  left: `${piece.left}%`,
                  width: `${piece.size}px`,
                  height: piece.shape === "circle" ? `${piece.size}px` : `${piece.size * 1.6}px`,
                  backgroundColor: piece.color,
                  animationDelay: `${piece.delayMs}ms`,
                  animationDuration: `${piece.durationMs}ms`,
                  "--confetti-drift-x": `${piece.driftX}px`,
                  "--confetti-rotate-start": `${piece.rotateStart}deg`,
                  "--confetti-rotate-end": `${piece.rotateEnd}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ) : null}

      <BlackjackGameSlide
        activeVisualHandIndex={blackjack.activeVisualHandIndex}
        ambienceEnabled={blackjack.ambienceEnabled}
        bgmEnabled={blackjack.bgmEnabled}
        controlsArmed={blackjack.controlsArmed}
        dealerOutcomeStampLabel={blackjack.dealerOutcomeStampLabel}
        displayedPlayerStack={blackjack.displayedPlayerStack}
        engineState={blackjack.engineState}
        gameStarted={blackjack.gameStarted}
        modeTransitionMessageVisible={blackjack.modeTransitionMessageVisible}
        onAction={blackjack.handleAction}
        onCycleBonusWager={blackjack.handleCycleBonusWager}
        onCycleWager={blackjack.handleCycleWager}
        onCardFlip={blackjack.handleCardFlip}
        onModalOk={blackjack.handleModalOk}
        onSetHandRef={blackjack.setHandRef}
        onStartGame={blackjack.handleStartGame}
        onToggleAllAudio={blackjack.handleToggleAllAudio}
        onToggleAmbience={blackjack.toggleAmbience}
        onToggleBGM={blackjack.toggleBGM}
        onToggleGameMode={blackjack.handleToggleGameMode}
        onToggleSounds={blackjack.handleToggleSounds}
        playerStackRef={blackjack.playerStackRef}
        resultEmojis={blackjack.resultEmojis}
        setSlideRef={(node) => blackjack.setSlideRef("game-card", node)}
        soundsEnabled={blackjack.soundsEnabled}
        stackTickerActive={blackjack.stackTickerActive}
        tableShellRef={blackjack.tableShellRef}
        winningChipFx={blackjack.winningChipFx}
      />

      <DemoSlide
        id="why-this-project"
        ref={(node) => blackjack.setSlideRef("why-this-project", node)}
        className="blackjack-panel blackjack-demo-panel blackjack-carousel-slide"
        title="Why This Project Interests Me"
        subtitle="One Go, Multiple Clients"
        titleClassName="blackjack-panel-title"
        subtitleClassName="blackjack-panel-subtitle"
      >
        <MarkdownContent
          content={blackjackProject?.interestsMeWhy ?? ""}
          className="blackjack-markdown"
          color="inherit"
          variant="body1"
        />
      </DemoSlide>

      <DemoSlide
        id="terminal-demo"
        ref={(node) => blackjack.setSlideRef("terminal-demo", node)}
        className="blackjack-panel blackjack-demo-panel blackjack-carousel-slide"
        title={blackjackTerminalDemo?.title || ""}
        subtitle={blackjackTerminalDemo?.subtitle || ""}
        caption={blackjackTerminalDemo?.caption}
        titleClassName="blackjack-panel-title"
        subtitleClassName="blackjack-panel-subtitle"
        captionSlotSx={captionSlotSx}
        captionTextSx={captionTextSx}
      >
        {blackjackTerminalDemo ? (
          <VideoLightbox
            src={withBasePath(blackjackTerminalDemo.mediaUrl)}
            title={blackjackTerminalDemo.title}
            caption={blackjackTerminalDemo.caption}
            controls
            playsInline
            preload="metadata"
            triggerSx={{
              height: "auto",
              flex: "0 0 auto",
            }}
            previewVideoSx={{
              width: "100%",
              maxWidth: "100%",
              height: "auto",
              borderRadius: "16px",
            }}
            expandButtonSx={{
              borderColor: "common.black",
              color: "common.black",
              bgcolor: "common.white",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.14) inset, 0 10px 18px rgba(0,0,0,0.24)",
              "&:hover": {
                bgcolor: "common.white",
              },
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Go Demo slide configuration is missing in resume data.
          </Typography>
        )}
      </DemoSlide>

      <ArchitectureDiagramsSlide
        activeDiagramKey={activeDiagramKey}
        diagramPagerItems={diagramPagerItems}
        diagramItems={blackjackDiagramItems}
        hasMultipleDiagrams={hasMultipleDiagrams}
        onSelectDiagram={handleSelectDiagram}
        onPreviousDiagram={handlePreviousDiagram}
        onNextDiagram={handleNextDiagram}
        setSlideRef={(node) => blackjack.setSlideRef("architecture-diagrams", node)}
      />

      <BlackjackCarouselNav
        activeSlideIndex={blackjack.activeSlideIndex}
        onCycleSlides={blackjack.handleCycleSlides}
        onSelectSlide={blackjack.scrollToSlide}
      />

      <script src={withBasePath("/apps/blackjack/js/wasm_exec.js")} defer></script>
      <script
        id="wasm"
        src={withBasePath("/apps/blackjack/wasm/main.wasm")}
        type="application/wasm"
        defer
      ></script>
      <script src={withBasePath("/apps/blackjack/js/main.js")} defer></script>
    </main>
  );
}
