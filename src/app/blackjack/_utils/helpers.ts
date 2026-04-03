import type {
  BlackjackCardView,
  BlackjackGameMode,
  BlackjackRenderState,
  BlackjackResultView,
} from "../_types/messages";
import {
  CARD_BACK_SRC,
  CHIP_BLACK_WHITE_SRC,
  CHIP_BLUE_WHITE_SRC,
  CHIP_GREEN_WHITE_SRC,
  CHIP_RED_WHITE_SRC,
  CHIP_WHITE_BLUE_SRC,
} from "../_consts/blackjack";

export function getControlDisplay(visible: boolean | undefined) {
  return visible ? undefined : "none";
}

export function getWinningsClass(tone: string) {
  switch (tone) {
    case "positive":
      return "positive";
    case "negative":
      return "negative";
    default:
      return undefined;
  }
}

export function getResultToneClass(tone: BlackjackResultView["tone"]) {
  switch (tone) {
    case "win":
      return "text-win";
    case "loss":
      return "text-loss";
    default:
      return "text-neutral";
  }
}

export function getResultBadgeClass(badge: BlackjackResultView["badge"]) {
  switch (badge) {
    case "Won!":
      return "blackjack-result-badge blackjack-result-badge--winner";
    case "Lost!":
      return "blackjack-result-badge blackjack-result-badge--loser";
    case "Push":
      return "blackjack-result-badge blackjack-result-badge--push";
    default:
      return "blackjack-result-badge";
  }
}

export function getGameModeChipClass(gameMode: BlackjackGameMode) {
  switch (gameMode) {
    case "blackjack":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--blackjack";
    case "jack-attack":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--jack-attack";
    case "trifecta":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--trifecta";
    case "trifecta3":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--trifecta3";
    case "trifecta-staxx":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--trifecta-staxx";
    case "spanish21":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--spanish21";
    default:
      return "blackjack-game-mode-chip";
  }
}

export function getGameModeChipSrc(gameMode: BlackjackGameMode) {
  switch (gameMode) {
    case "blackjack":
      return CHIP_WHITE_BLUE_SRC;
    case "jack-attack":
      return CHIP_RED_WHITE_SRC;
    case "trifecta":
      return CHIP_GREEN_WHITE_SRC;
    case "trifecta3":
      return CHIP_BLUE_WHITE_SRC;
    case "trifecta-staxx":
      return CHIP_BLACK_WHITE_SRC;
    case "spanish21":
      return CHIP_RED_WHITE_SRC;
    default:
      return CHIP_WHITE_BLUE_SRC;
  }
}

export function getOutcomeStampClass(label: string) {
  switch (label) {
    case "Won!":
      return "blackjack-hand-stamp blackjack-hand-stamp--winner";
    case "Blackjack!":
      return "blackjack-hand-stamp blackjack-hand-stamp--blackjack";
    case "Lost!":
    case "Loss!":
    case "Busted!":
      return "blackjack-hand-stamp blackjack-hand-stamp--loser";
    case "Push":
    case "Push!":
      return "blackjack-hand-stamp blackjack-hand-stamp--push";
    default:
      return "blackjack-hand-stamp";
  }
}

export function getOutcomeStampAngle({
  index,
  cardsLength,
  totalLabel,
  outcomeLabel,
}: {
  index: number;
  cardsLength: number;
  totalLabel: string;
  outcomeLabel: string;
}) {
  const seed =
    (index + 1) * 7 +
    cardsLength * 5 +
    totalLabel.length * 3 +
    outcomeLabel.length * 3;
  return (seed % 21) - 10;
}

export function getCardImageSrc(card: BlackjackCardView) {
  if (card.masked) {
    return CARD_BACK_SRC;
  }

  return `/assets/boardgame/PNG/Cards/card${card.suit}${card.value}.png`;
}

export function formatPlayerStackValue(value: number) {
  const roundedValue = Math.round(value);
  const sign = roundedValue >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(roundedValue)}`;
}

export function countRenderedCards(state: BlackjackRenderState | null) {
  if (!state) return 0;

  const dealerCards = state.dealer.cards.length;
  const playerCards =
    state.player?.hands.reduce((total, hand) => total + hand.cards.length, 0) ??
    0;

  return dealerCards + playerCards;
}

export function getPlayerHasBlackjack(state: BlackjackRenderState | null) {
  return (
    state?.player?.hands.some((hand) => hand.outcomeLabel === "Blackjack!") ??
    false
  );
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function pickStatusEmojis(
  summary: string,
  badge: BlackjackResultView["badge"],
  tone: BlackjackResultView["tone"],
): [string, string] {
  const blackjackPool = ["🃏", "✨", "👑", "🔥", "💫"];
  const winPool = ["💰", "💵", "😎", "🔥", "🏆", "✨"];
  const lossPool = ["😬", "💸", "🫠", "📉", "🥀", "😵‍💫"];
  const neutralPool = ["🎲", "♠️", "🃏", "🤝", "🎰"];

  const pool =
    summary.includes("Blackjack") ||
    (badge === "Won!" && summary.includes("Blackjack"))
      ? blackjackPool
      : tone === "win"
        ? winPool
        : tone === "loss"
          ? lossPool
          : neutralPool;

  const seed = hashString(`${summary}:${badge}:${tone}`);
  const first = pool[seed % pool.length];
  const second = pool[(seed + 3) % pool.length];
  return [first, second];
}

export function decorateStatusText(statusText: string) {
  if (statusText === "Insurance?") {
    return "🛡️ Insurance?";
  }

  if (statusText === "Deal again?") {
    return "🔁 Deal again?";
  }

  if (statusText.includes("Deal")) {
    return `🎲 ${statusText}`;
  }

  if (statusText.includes("Hit") || statusText.includes("Stand")) {
    return `🃏 ${statusText}`;
  }

  return statusText;
}

export function decorateResultDetailLine(
  line: string,
  tone: BlackjackResultView["tone"],
  badge: BlackjackResultView["badge"],
) {
  const [emoji] = pickStatusEmojis(line, badge, tone);
  return `${emoji} ${line}`;
}

export function hasCurrencyValue(text: string) {
  return /\$\d/.test(text);
}

export function getDisplayResultSummary(result: BlackjackResultView) {
  if (result.badge === "Push") {
    return "You pushed!";
  }

  return result.summary;
}

export function getDealerOutcomeStampLabel(state: BlackjackRenderState | null) {
  const dealerLabel = state?.dealer.outcomeLabel;
  if (dealerLabel) {
    return dealerLabel;
  }

  switch (state?.result?.badge) {
    case "Won!":
      return "Lost!";
    case "Lost!":
      return "Won!";
    case "Push":
      return "Push";
    default:
      return "";
  }
}

export function getResultTransitionKey(result: BlackjackResultView | null) {
  if (!result) {
    return "";
  }

  return [result.badge, result.summary, ...result.detailLines].join("|");
}
