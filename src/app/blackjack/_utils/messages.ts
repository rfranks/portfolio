import {
  BlackjackActionMessage,
  BlackjackCycleBonusWagerMessage,
  BlackjackCycleWagerMessage,
  BlackjackGameModeDirection,
  BlackjackStartMessage,
  BlackjackStateMessage,
  BlackjackToggleGameModeMessage,
  BlackjackUiAction,
} from "../_types/messages";

export function isBlackjackStateMessage(value: unknown): value is BlackjackStateMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BlackjackStateMessage>;
  return candidate.type === "blackjack/state" && !!candidate.state;
}

export function postBlackjackAction(action: BlackjackUiAction) {
  window.postMessage(
    {
      type: "blackjack/action",
      action,
    } satisfies BlackjackActionMessage,
    window.location.origin,
  );
}

export function postBlackjackStart() {
  window.postMessage(
    {
      type: "blackjack/start",
    } satisfies BlackjackStartMessage,
    window.location.origin,
  );
}

export function postBlackjackToggleGameMode(direction: BlackjackGameModeDirection = "next") {
  window.postMessage(
    {
      type: "blackjack/toggle-game-mode",
      direction,
    } satisfies BlackjackToggleGameModeMessage,
    window.location.origin,
  );
}

export function postBlackjackCycleWager() {
  window.postMessage(
    {
      type: "blackjack/cycle-wager",
    } satisfies BlackjackCycleWagerMessage,
    window.location.origin,
  );
}

export function postBlackjackCycleBonusWager() {
  window.postMessage(
    {
      type: "blackjack/cycle-bonus-wager",
    } satisfies BlackjackCycleBonusWagerMessage,
    window.location.origin,
  );
}
