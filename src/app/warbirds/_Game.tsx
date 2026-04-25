"use client";

import * as React from "react";
import { DEFAULT_CURSOR, SKY_COLOR } from "./_constants";
import { withBasePath } from "@/utils/basePath";
import { TitleSplash } from "./_components/TitleSplash";
import GameUI from "./_components/GameUI";
import useGameEngine from "./_hooks/useGameEngine";
import useDisableDrag from "@/hooks/event/useDisableDrag";
import { ArcadeGameShell } from "@/components/shared";

export default function Game() {
  const engine = useGameEngine();
  useDisableDrag();

  const {
    arcadeProfile,
    ui,
    canvasRef,
    handleClick,
    handleContext,
    resetGame,
    getImg,
    startSplash,
    ready: assetsReady,
  } = engine;
  const { phase } = ui;
  return (
    <ArcadeGameShell
      arcadeGameId="warbirds"
      arcadeProfile={arcadeProfile.profile}
      showTitleSplash={phase === "title"}
      assetsReady={assetsReady}
      onStart={startSplash}
      renderTitleSplash={({ onStart }) => (
        <TitleSplash
          onStart={onStart}
          titleSrc={withBasePath("/assets/titles/warbirds_title.png")}
          backgroundColor={SKY_COLOR}
          cursor={DEFAULT_CURSOR}
        />
      )}
    >
      <GameUI
        ui={ui}
        canvasRef={canvasRef}
        handleClick={handleClick}
        handleContext={handleContext}
        resetGame={resetGame}
        getImg={getImg}
      />
    </ArcadeGameShell>
  );
}
