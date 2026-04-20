"use client";

import * as React from "react";
import { projects } from "@/consts/resumeData";
import { Diagram } from "@/components/shared";
import { MarkdownContent } from "@/components/shared";
import { withBasePath } from "@/utils/basePath";
import BlackjackCarouselNav from "./_components/BlackjackCarouselNav";
import BlackjackGameSlide from "./_components/BlackjackGameSlide";
import { useBlackjackPage } from "./_hooks/useBlackjackPage";
import type { BlackjackDiagramConfig } from "./_types/page";
import "./page.css";

export default function BlackjackPage() {
  const blackjack = useBlackjackPage();
  const blackjackProject = projects?.find((proj) => proj?.href === "/blackjack");
  const blackjackDiagrams =
    (blackjackProject?.diagrams as BlackjackDiagramConfig[] | undefined) ?? [];

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
                  height:
                    piece.shape === "circle"
                      ? `${piece.size}px`
                      : `${piece.size * 1.6}px`,
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
        <p className="blackjack-panel-subtitle">
          Via Go in the terminal in VS Code Debugger
        </p>
        <video
          src={withBasePath("/personal/demovideos/blackjack_terminal.mov")}
          controls
          playsInline
          preload="metadata"
        />
      </section>

      {blackjackDiagrams.length ? (
        <section
          id="architecture-diagrams"
          ref={(node) => blackjack.setSlideRef("architecture-diagrams", node)}
          className="blackjack-panel blackjack-demo-panel blackjack-diagrams-panel blackjack-carousel-slide"
        >
          <h2 className="blackjack-panel-title">Architecture Diagrams</h2>
          <p className="blackjack-panel-subtitle">
            Go engine, WASM message bridge, render state, and UI flow
          </p>
          <div className="blackjack-diagrams-grid">
            {blackjackDiagrams.map((diagram) => (
              <article
                key={diagram.title ?? diagram.diagram}
                className="blackjack-diagram-card"
              >
                <h3 className="blackjack-diagram-title">{diagram.title}</h3>
                <div className="blackjack-diagram-host">
                  <Diagram
                    title={diagram.title}
                    type={diagram.type}
                    diagram={diagram.diagram}
                    height={diagram.height ?? 420}
                    width="100%"
                    showToolbar
                    showDots={false}
                  />
                </div>
              </article>
            ))}
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
