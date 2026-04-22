"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { renderNavigationIcon } from "@/components/portfolio/layout/navigationIcons";
import SubsectionPager, {
  type SubsectionPagerItem,
} from "@/components/portfolio/layout/SubsectionPager";
import { MarkdownContent, MediaCycler, PortfolioPanelShell } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { withBasePath } from "@/utils/basePath";
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
  const blackjackDiagrams = React.useMemo(
    () => (blackjackProject?.diagrams as BlackjackDiagramConfig[] | undefined) ?? [],
    [blackjackProject?.diagrams],
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
        type: "diagram",
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
          showDots: false,
          autoFitPadding: diagram.autoFitPadding ?? 14,
          autoFitScaleMultiplier: diagram.autoFitScaleMultiplier ?? 1,
          autoFitOffsetX: diagram.autoFitOffsetX ?? 0,
          autoFitOffsetY: diagram.autoFitOffsetY ?? 0,
        },
        extraContent: diagram.description?.trim() ? (
          <Typography
            component="div"
            variant="body2"
            sx={{
              mt: 0.75,
              flexShrink: 0,
              width: "100%",
              minHeight: { xs: 40, md: 52 },
              fontSize: { xs: "0.96rem", md: "1.06rem", lg: "1.12rem" },
              fontWeight: 500,
              lineHeight: 1.45,
              color: (theme) => alpha(theme.palette.common.white, 0.9),
              display: "-webkit-box",
              WebkitLineClamp: { xs: 2, md: 3 },
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {diagram.description.trim()}
          </Typography>
        ) : undefined,
      })),
    [normalizedBlackjackDiagrams],
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

      <section
        id="why-this-project"
        ref={(node) => blackjack.setSlideRef("why-this-project", node)}
        className="blackjack-panel blackjack-demo-panel blackjack-carousel-slide"
      >
        <h2 className="blackjack-panel-title">Why This Project Interests Me</h2>
        <p className="blackjack-panel-subtitle">One Go, Multiple Clients</p>
        <MarkdownContent
          content={blackjackProject?.interestsMeWhy ?? ""}
          className="blackjack-markdown"
          color="inherit"
          variant="body1"
        />
      </section>

      <section
        id="terminal-demo"
        ref={(node) => blackjack.setSlideRef("terminal-demo", node)}
        className="blackjack-panel blackjack-demo-panel blackjack-carousel-slide"
      >
        <h2 className="blackjack-panel-title">Go! Blackjack!</h2>
        <p className="blackjack-panel-subtitle">Via Go in the terminal in VS Code Debugger</p>
        <video
          src={withBasePath("/personal/demovideos/blackjack_terminal.mov")}
          controls
          playsInline
          preload="metadata"
        />
      </section>

      <section
        id="architecture-diagrams"
        ref={(node) => blackjack.setSlideRef("architecture-diagrams", node)}
        className="blackjack-diagrams-panel blackjack-carousel-slide"
      >
        <PortfolioPanelShell
          panelClassName="mx-auto"
          panelSx={{
            width: "100%",
            maxWidth: "1200px",
            minHeight: 0,
            height: "100%",
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            mx: "auto",
            overflow: "hidden",
            p: 0,
            mb: 0,
            borderColor: "transparent",
            bgcolor: "transparent",
            backgroundImage: "none",
            boxShadow: "none",
          }}
          topRail={
            hasMultipleDiagrams ? (
              <SubsectionPager
                menuId="blackjack-architecture-diagram-selector"
                items={diagramPagerItems}
                currentKey={activeDiagramKey}
                selectedValueAsTitle
                selectedVisualSize={34}
                previousAriaLabel="Previous architecture diagram"
                nextAriaLabel="Next architecture diagram"
                selectorAriaLabel="Open architecture diagram selector"
                onSelect={handleSelectDiagram}
                onPrevious={handlePreviousDiagram}
                onNext={handleNextDiagram}
              />
            ) : (
              <Box sx={{ px: { xs: 2.5, md: 3 }, py: 1.25 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Architecture Diagram
                </Typography>
              </Box>
            )
          }
          useNegativeTopRailMargins={false}
          topRailSx={{
            mx: 0,
            mt: 0,
            position: "relative",
            zIndex: 6,
            color: (theme) => alpha(theme.palette.common.white, 0.84),
            bgcolor: "transparent !important",
            backgroundColor: "transparent !important",
            backgroundImage: "none !important",
            borderBottom: "0 !important",
            borderColor: "transparent !important",
            backdropFilter: "none !important",
            filter: "none !important",
            boxShadow: "none !important",
            "& .MuiTypography-root": {
              color: (theme) => `${alpha(theme.palette.common.white, 0.84)} !important`,
            },
            "& .MuiChip-root": {
              color: (theme) => `${alpha(theme.palette.common.white, 0.84)} !important`,
            },
            "& .MuiIconButton-root, & .MuiSvgIcon-root": {
              color: (theme) => `${alpha(theme.palette.common.white, 0.84)} !important`,
            },
          }}
          contentSx={{
            minHeight: 0,
            flex: "1 1 auto",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            pt: 0,
            pb: 0,
          }}
        >
          <Box
            className="blackjack-diagram-host"
            sx={{
              px: { xs: 1, md: 1.5 },
              pt: { xs: 0.75, md: 1 },
              pb: { xs: 1, md: 1.5 },
              minHeight: 0,
              flex: "1 1 auto",
            }}
          >
            {blackjackDiagramItems.length > 0 ? (
              <MediaCycler
                items={blackjackDiagramItems}
                singlePanel
                singlePanelActiveKey={activeDiagramKey}
                showChevronNavigation={false}
                loopNavigation={false}
                stackSx={{ minHeight: 0, height: "100%" }}
              />
            ) : (
              <Box
                sx={{
                  minHeight: 0,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Architecture diagrams are not available for this project yet.
                </Typography>
              </Box>
            )}
          </Box>
        </PortfolioPanelShell>
      </section>

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
