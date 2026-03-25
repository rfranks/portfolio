"use client";

import * as React from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { withBasePath } from "@/utils/basePath";
import "./page.css";

export default function BlackjackPage() {
  const { setDocumentTitle } = useDocumentTitle();
  React.useEffect(() => {
    setDocumentTitle("Blackjack");
  }, [setDocumentTitle]);
  return (
    <main className="blackjack-page">
      <section id="game-card" className="blackjack-panel blackjack-game-panel">
        <h2 className="blackjack-panel-title">Web Client (Wasm)</h2>
        <div id="progressives" className="blackjack-progressives">
          <span id="prog0"></span>
          <span id="prog1"></span>
          <span id="prog2"></span>
          <span id="prog3"></span>
        </div>
        <div id="game" className="blackjack-table-shell">
          <div id="dealer-info" className="blackjack-info-row">
            Dealer: House: <span id="house"></span> Count:{" "}
            <span id="count"></span>
          </div>
          <div id="dealer" className="blackjack-seat">
            <div id="dealer-cards" className="cards"></div>
            <div id="dealer-total"></div>
          </div>
          <div id="player-info" className="blackjack-info-row">
            Player 1: Stack: <span id="player-stack"></span>
            <span id="player-winnings"></span>
          </div>
          <div id="hand-info" className="blackjack-info-row">
            Hand 1: Wager: <span id="hand-wager"></span>
            <span id="hand-trifecta"></span>
          </div>
          <div id="player" className="blackjack-seat">
            <div id="player-cards" className="cards"></div>
            <div id="player-total"></div>
          </div>
          <div id="result" className="blackjack-status-panel"></div>
          <div className="blackjack-status-panel">
            <div id="status"></div>
            <div id="controls" className="blackjack-controls">
              <button
                id="deal"
                className="blackjack-button blackjack-button-primary"
              >
                Deal
              </button>
              <button id="hit" className="blackjack-button">
                Hit
              </button>
              <button id="stand" className="blackjack-button">
                Stand
              </button>
              <button id="double" className="blackjack-button">
                Double
              </button>
              <button id="split" className="blackjack-button">
                Split
              </button>
              <button
                id="insure"
                className="blackjack-button"
                style={{ display: "none" }}
              >
                Insure
              </button>
              <button
                id="decline"
                className="blackjack-button blackjack-button-subtle"
                style={{ display: "none" }}
              >
                Decline
              </button>
            </div>
          </div>
          <div id="hint" className="blackjack-hint-panel"></div>
        </div>
      </section>
      <section id="demo-video" className="blackjack-panel blackjack-demo-panel">
        <h2 className="blackjack-panel-title">Terminal Demo</h2>
        <p className="blackjack-panel-subtitle">Via Go in the Terminal</p>
        <video
          src={withBasePath("/demovideos/blackjack_terminal.mov")}
          controls
          playsInline
          preload="metadata"
        />
      </section>
      <script src="wasm_exec.js" defer></script>
      <script id="wasm" src="main.wasm" type="application/wasm" defer></script>
      <script src="main.js" defer></script>
    </main>
  );
}
