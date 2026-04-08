export type BlackjackUiAction =
  | "deal"
  | "hit"
  | "stand"
  | "double"
  | "split"
  | "insure"
  | "decline";

export type BlackjackGameMode =
  | "blackjack"
  | "jack-attack"
  | "trifecta"
  | "trifecta3"
  | "trifecta-staxx"
  | "spanish21";

export type BlackjackTone = "loss" | "neutral" | "win";
export type BlackjackWinningsTone = "negative" | "neutral" | "positive";

export interface BlackjackCardView {
  masked: boolean;
  suit: string;
  value: string;
}

export interface BlackjackDealerView {
  blackjack: boolean;
  busted: boolean;
  cards: BlackjackCardView[];
  outcomeLabel: string;
  total: number;
  totalLabel: string;
}

export interface BlackjackPlayerHandView {
  active: boolean;
  busted: boolean;
  cards: BlackjackCardView[];
  index: number;
  insured: boolean;
  note: string;
  outcomeLabel: string;
  split: boolean;
  totalLabel: string;
  trifectaWager: number;
  wager: number;
}

export interface BlackjackPlayerView {
  hands: BlackjackPlayerHandView[];
  selectedWager: number;
  stack: number;
  winnings: number;
  winningsDisplay: string;
  winningsTone: BlackjackWinningsTone;
}

export interface BlackjackControlsView {
  deal: boolean;
  decline: boolean;
  double: boolean;
  hit: boolean;
  insure: boolean;
  split: boolean;
  stand: boolean;
}

export interface BlackjackResultView {
  badge: "" | "Lost!" | "Push" | "Won!";
  detailLines: string[];
  summary: string;
  tone: BlackjackTone;
}

export interface BlackjackRenderState {
  askingForInsurance: boolean;
  askingToDeal: boolean;
  canToggleGameMode: boolean;
  controls: BlackjackControlsView;
  count: number;
  dealer: BlackjackDealerView;
  gameMode: BlackjackGameMode;
  gameModeDescription: string;
  gameModeLabel: string;
  gameModeRules: string[];
  hasRendered: boolean;
  hintText: string;
  house: number;
  player: BlackjackPlayerView | null;
  progressives: number[];
  result: BlackjackResultView | null;
  statusText: string;
}

export interface BlackjackActionMessage {
  action: BlackjackUiAction;
  type: "blackjack/action";
}

export interface BlackjackStartMessage {
  type: "blackjack/start";
}

export interface BlackjackToggleGameModeMessage {
  type: "blackjack/toggle-game-mode";
}

export interface BlackjackCycleWagerMessage {
  type: "blackjack/cycle-wager";
}

export interface BlackjackStateMessage {
  state: BlackjackRenderState;
  type: "blackjack/state";
}

export type BlackjackMessage =
  | BlackjackActionMessage
  | BlackjackCycleWagerMessage
  | BlackjackStartMessage
  | BlackjackToggleGameModeMessage
  | BlackjackStateMessage;
