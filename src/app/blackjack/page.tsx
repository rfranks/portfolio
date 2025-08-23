"use client";

import * as React from "react";
import "./page.css";

export default function BlackjackPage() {
  return (
    <>
      <div id="progressives">
        <span id="prog0"></span>
        <span id="prog1"></span>
        <span id="prog2"></span>
        <span id="prog3"></span>
      </div>
      <div id="game">
        <div id="dealer-info">
          Dealer: House: <span id="house"></span> Count: <span id="count"></span>
        </div>
        <div id="dealer">
          <div id="dealer-cards" className="cards"></div>
          <div id="dealer-total"></div>
        </div>
        <div id="player-info">
          Player 1: Stack: <span id="player-stack"></span>
          <span id="player-winnings"></span>
        </div>
        <div id="hand-info">
          Hand 1: Wager: <span id="hand-wager"></span>
          <span id="hand-trifecta"></span>
        </div>
        <div id="player">
          <div id="player-cards" className="cards"></div>
          <div id="player-total"></div>
        </div>
        <div id="status"></div>
        <div id="hint"></div>
      </div>
      <div id="controls">
        <button id="deal">Deal</button>
        <button id="hit">Hit</button>
        <button id="stand">Stand</button>
        <button id="double">Double</button>
        <button id="split">Split</button>
        <button id="insure" style={{ display: "none" }}>
          Insure
        </button>
        <button id="decline" style={{ display: "none" }}>
          Decline
        </button>
      </div>
      <script src="wasm_exec.js" defer></script>
      <script id="wasm" src="main.wasm" type="application/wasm" defer></script>
      <script src="main.js" defer></script>
    </>
  );
}
