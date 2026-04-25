"use client";

import * as React from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { BlackjackRenderState, BlackjackUiAction } from "../_types/messages";
import { getControlDisplay } from "../_utils/helpers";

type BlackjackActionControlsProps = {
  engineState: BlackjackRenderState | null;
  onAction: (action: BlackjackUiAction) => void;
  onOpenAnalytics: () => void;
  onOpenHint: () => void;
  onOpenRoundDetails: () => void;
  renderActionButtonLabel: (actionLabel: string) => React.ReactNode;
  showAnalyticsAction: boolean;
  showRoundDetailsAction: boolean;
};

export default function BlackjackActionControls({
  engineState,
  onAction,
  onOpenAnalytics,
  onOpenHint,
  onOpenRoundDetails,
  renderActionButtonLabel,
  showAnalyticsAction,
  showRoundDetailsAction,
}: BlackjackActionControlsProps) {
  const isCompact = useMediaQuery("(max-width:899.95px)");
  const renderActionLabel = React.useCallback(
    (label: string) => {
      if (isCompact) {
        return null;
      }

      return <span className="blackjack-action-label">{renderActionButtonLabel(label)}</span>;
    },
    [isCompact, renderActionButtonLabel],
  );

  const renderPlainLabel = React.useCallback(
    (label: string) => (isCompact ? null : <span className="blackjack-action-label">{label}</span>),
    [isCompact],
  );
  const renderStartIcon = React.useCallback(
    (emoji: string) => (
      <span className={isCompact ? undefined : "blackjack-button-start-icon"} aria-hidden="true">
        {emoji}
      </span>
    ),
    [isCompact],
  );

  const primaryButtons = (
    <>
      {!engineState?.askingToDeal ? (
        <button
          id="deal"
          className="blackjack-button blackjack-button-primary"
          style={{
            display: getControlDisplay(engineState?.controls.deal),
          }}
          onClick={() => onAction("deal")}
          aria-label="Deal"
        >
          {renderStartIcon("🃏")}
          {isCompact ? null : <span className="blackjack-shimmer-text">Deal</span>}
        </button>
      ) : null}
      <button
        id="double"
        className="blackjack-button"
        style={{
          display: getControlDisplay(engineState?.controls.double),
        }}
        onClick={() => onAction("double")}
        aria-label="Double down"
      >
        {renderStartIcon("⏬")}
        {renderActionLabel("DOUBLE DOWN")}
      </button>
      <button
        id="split"
        className="blackjack-button"
        style={{
          display: getControlDisplay(engineState?.controls.split),
        }}
        onClick={() => onAction("split")}
        aria-label="Split"
      >
        {renderStartIcon("✂️")}
        {renderActionLabel("SPLIT")}
      </button>
      <button
        id="hit"
        className="blackjack-button"
        style={{
          display: getControlDisplay(engineState?.controls.hit),
        }}
        onClick={() => onAction("hit")}
        aria-label="Hit"
      >
        {renderStartIcon("➕")}
        {renderActionLabel("HIT")}
      </button>
      <button
        id="stand"
        className="blackjack-button"
        style={{
          display: getControlDisplay(engineState?.controls.stand),
        }}
        onClick={() => onAction("stand")}
        aria-label="Stand"
      >
        {renderStartIcon("✋")}
        {renderActionLabel("STAND")}
      </button>
      <button
        id="insure"
        className="blackjack-button"
        style={{
          display: getControlDisplay(engineState?.controls.insure),
        }}
        onClick={() => onAction("insure")}
        aria-label="Insure"
      >
        {renderStartIcon("🛡️")}
        {renderPlainLabel("Insure")}
      </button>
      <button
        id="decline"
        className="blackjack-button blackjack-button-subtle"
        style={{
          display: getControlDisplay(engineState?.controls.decline),
        }}
        onClick={() => onAction("decline")}
        aria-label="Decline insurance"
      >
        {renderStartIcon("🚫")}
        {renderPlainLabel("Decline")}
      </button>
    </>
  );

  const insightButtons = (
    <>
      <button
        id="hint-action"
        className="blackjack-button blackjack-button-subtle"
        style={{
          display: engineState?.hintText ? "inline-flex" : "none",
        }}
        onClick={onOpenHint}
        aria-label="Hint"
      >
        {renderStartIcon("💡")}
        {isCompact ? null : <span className="blackjack-shimmer-text">Hint</span>}
      </button>
      <button
        id="analytics-action"
        className="blackjack-button blackjack-button-subtle"
        style={{
          display: showAnalyticsAction ? "inline-flex" : "none",
        }}
        onClick={onOpenAnalytics}
        aria-label="Session analytics"
      >
        {renderStartIcon("📈")}
        {renderPlainLabel("Session Analytics")}
      </button>
      <button
        id="round-details-action"
        className="blackjack-button blackjack-button-subtle"
        style={{
          display: showRoundDetailsAction ? "inline-flex" : "none",
        }}
        onClick={onOpenRoundDetails}
        aria-label="View round details"
      >
        {renderStartIcon("🧾")}
        {renderPlainLabel("View Round Details")}
      </button>
    </>
  );

  if (isCompact) {
    return (
      <div id="controls" className="blackjack-controls blackjack-controls--compact">
        {primaryButtons}
        {insightButtons}
      </div>
    );
  }

  return (
    <div className="blackjack-controls-shell">
      <div id="controls" className="blackjack-controls blackjack-controls--primary">
        {primaryButtons}
      </div>
      <div className="blackjack-controls blackjack-controls--insights">{insightButtons}</div>
    </div>
  );
}
