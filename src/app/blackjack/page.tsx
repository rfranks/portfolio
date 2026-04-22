"use client";

import * as React from "react";
import { MarkdownContent, MediaCycler } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { withBasePath } from "@/utils/basePath";
import BlackjackCarouselNav from "./_components/BlackjackCarouselNav";
import BlackjackGameSlide from "./_components/BlackjackGameSlide";
import { useBlackjackPage } from "./_hooks/useBlackjackPage";
import type { BlackjackDiagramConfig } from "./_types/page";
import "./page.css";

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
  const blackjackDiagramItems = React.useMemo<MediaCyclerItem[]>(
    () =>
      normalizedBlackjackDiagrams.map((diagram) => ({
        key: diagram.key,
        title: diagram.title,
        description: "Mermaid architecture view",
        mediaType: "diagram",
        mediaUrl: diagram.diagram,
        onSelect: () => {
          setActiveDiagramKey(diagram.key);
        },
        panelSx: {
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          minWidth: 0,
          width: "100%",
          p: 2,
          border: "1px solid rgba(148, 163, 184, 0.18)",
          borderRadius: "20px",
          background:
            "linear-gradient(180deg, rgba(30, 41, 59, 0.62), rgba(15, 23, 42, 0.48)), rgba(15, 23, 42, 0.42)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 12px 28px rgba(2, 8, 23, 0.16)",
        },
        assetFrameSx: {
          width: "100%",
          minHeight: { xs: 300, md: 420 },
          height: { xs: 300, md: 420 },
        },
        diagramProps: {
          title: diagram.title,
          type: diagram.type,
          height: "100%",
          width: "100%",
          showToolbar: true,
          showDots: false,
        },
      })),
    [normalizedBlackjackDiagrams],
  );

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

      {blackjackDiagramItems.length ? (
        <section
          id="architecture-diagrams"
          ref={(node) => blackjack.setSlideRef("architecture-diagrams", node)}
          className="blackjack-panel blackjack-demo-panel blackjack-diagrams-panel blackjack-carousel-slide"
        >
          <h2 className="blackjack-panel-title">Architecture Diagrams</h2>
          <p className="blackjack-panel-subtitle">
            Go engine, WASM message bridge, render state, and UI flow
          </p>
          <div className="blackjack-diagram-host">
            <MediaCycler
              items={blackjackDiagramItems}
              singlePanel
              singlePanelActiveKey={activeDiagramKey}
              showChevronNavigation
              loopNavigation={blackjackDiagramItems.length > 1}
              loopNavigationLabel="Loop architecture diagrams"
              stackSx={{ minHeight: { xs: 300, md: 420 } }}
            />
          </div>
        </section>
      ) : null}

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
