"use client";

import * as React from "react";
import { DEFAULT_CURSOR, SKY_COLOR } from "./_constants";
import { withBasePath } from "@/utils/basePath";
import { TitleSplash } from "./_components/TitleSplash";
import GameUI from "./_components/GameUI";
import useZombiefishEngine from "./_hooks/useGameEngine";
import useDisableDrag from "@/hooks/event/useDisableDrag";
import { ArcadeGameShell } from "@/components/shared";

export default function Game() {
  const engine = useZombiefishEngine();
  useDisableDrag();

  const {
    arcadeProfile,
    ui,
    canvasRef,
    handleMouseMove,
    handleClick,
    handleContext,
    startSplash,
    ready: assetsReady,
  } = engine;
  const { phase } = ui;

  return (
    <ArcadeGameShell
      arcadeGameId="zombiefish"
      arcadeProfile={arcadeProfile.profile}
      showTitleSplash={phase === "title"}
      assetsReady={assetsReady}
      onStart={startSplash}
      renderTitleSplash={({ onStart }) => (
        <TitleSplash
          onStart={onStart}
          titleSrc={withBasePath("/personal/images/projects/zombiefish.svg")}
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
        handleMouseMove={handleMouseMove}
      />
    </ArcadeGameShell>
  );
}

export { Game };
