"use client";

import * as React from "react";
import "./page.css";

export default function BlackjackPage() {
  return (
    <>
      <div id="game">
        <div id="dealer">
          <div id="dealer-cards" className="cards"></div>
        </div>
        <div id="player">
          <div id="player-cards" className="cards"></div>
        </div>
        <div id="status"></div>
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
      <script src="wasm_exec.js" async></script>
      <script id="wasm" src="main.wasm" type="application/wasm" async></script>
      <script src="main.js" async></script>
    </>
  );
}
