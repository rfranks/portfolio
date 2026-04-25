import type { BlackjackCardView, BlackjackRenderState } from "../_types/messages";
import type {
  BlackjackStrategyActionInsight,
  BlackjackStrategyTrainerAction,
  BlackjackStrategyTrainerInsight,
} from "../_types/strategyTrainer";

const ACTION_LABELS: Record<BlackjackStrategyTrainerAction, string> = {
  hit: "Hit",
  stand: "Stand",
  double: "Double Down",
  split: "Split",
  insure: "Insure",
  decline: "Decline Insurance",
};

function cardValue(card: BlackjackCardView): number {
  const rank = card.value.toUpperCase();
  if (rank === "A") {
    return 11;
  }
  if (["K", "Q", "J"].includes(rank)) {
    return 10;
  }
  const numeric = Number.parseInt(rank, 10);
  return Number.isFinite(numeric) ? Math.min(10, Math.max(1, numeric)) : 0;
}

function cardRank(card: BlackjackCardView): string {
  return card.value.toUpperCase();
}

function computeHandTotal(cards: BlackjackCardView[]): { total: number; soft: boolean } {
  const visibleCards = cards.filter((card) => !card.masked);
  let total = visibleCards.reduce((sum, card) => sum + cardValue(card), 0);
  let acesAsEleven = visibleCards.filter((card) => cardRank(card) === "A").length;

  while (total > 21 && acesAsEleven > 0) {
    total -= 10;
    acesAsEleven -= 1;
  }

  return {
    total,
    soft: acesAsEleven > 0,
  };
}

function dealerUpValue(state: BlackjackRenderState): number {
  const upCard = state.dealer.cards.find((card) => !card.masked) ?? state.dealer.cards[0];
  if (!upCard) {
    return 10;
  }

  if (cardRank(upCard) === "A") {
    return 11;
  }

  return Math.min(10, Math.max(2, cardValue(upCard)));
}

function isPair(cards: BlackjackCardView[]): boolean {
  if (cards.length !== 2 || cards.some((card) => card.masked)) {
    return false;
  }
  return cardRank(cards[0]) === cardRank(cards[1]);
}

function resolvePairRecommendation(params: {
  rank: string;
  dealerValue: number;
  canSplit: boolean;
}): BlackjackStrategyTrainerAction | null {
  const { rank, dealerValue, canSplit } = params;
  if (!canSplit) {
    return null;
  }

  if (rank === "A" || rank === "8") {
    return "split";
  }

  if (rank === "9") {
    return [2, 3, 4, 5, 6, 8, 9].includes(dealerValue) ? "split" : "stand";
  }

  if (rank === "7") {
    return dealerValue <= 7 ? "split" : "hit";
  }

  if (rank === "6") {
    return dealerValue <= 6 ? "split" : "hit";
  }

  if (rank === "4") {
    return dealerValue === 5 || dealerValue === 6 ? "split" : "hit";
  }

  if (rank === "3" || rank === "2") {
    return dealerValue <= 7 ? "split" : "hit";
  }

  if (rank === "5") {
    return null;
  }

  if (rank === "10" || rank === "K" || rank === "Q" || rank === "J") {
    return "stand";
  }

  return null;
}

function resolveHardRecommendation(params: {
  total: number;
  dealerValue: number;
  canDouble: boolean;
}): BlackjackStrategyTrainerAction {
  const { total, dealerValue, canDouble } = params;

  if (total >= 17) {
    return "stand";
  }

  if (total >= 13) {
    return dealerValue <= 6 ? "stand" : "hit";
  }

  if (total === 12) {
    return dealerValue >= 4 && dealerValue <= 6 ? "stand" : "hit";
  }

  if (total === 11) {
    return canDouble ? "double" : "hit";
  }

  if (total === 10) {
    return canDouble && dealerValue <= 9 ? "double" : "hit";
  }

  if (total === 9) {
    return canDouble && dealerValue >= 3 && dealerValue <= 6 ? "double" : "hit";
  }

  return "hit";
}

function resolveSoftRecommendation(params: {
  total: number;
  dealerValue: number;
  canDouble: boolean;
}): BlackjackStrategyTrainerAction {
  const { total, dealerValue, canDouble } = params;

  if (total >= 19) {
    return "stand";
  }

  if (total === 18) {
    if (dealerValue >= 9 || dealerValue === 11) {
      return "hit";
    }
    if (canDouble && dealerValue >= 3 && dealerValue <= 6) {
      return "double";
    }
    return "stand";
  }

  if (total === 17) {
    return canDouble && dealerValue >= 3 && dealerValue <= 6 ? "double" : "hit";
  }

  if (total === 16 || total === 15) {
    return canDouble && dealerValue >= 4 && dealerValue <= 6 ? "double" : "hit";
  }

  if (total === 14 || total === 13) {
    return canDouble && (dealerValue === 5 || dealerValue === 6) ? "double" : "hit";
  }

  return "hit";
}

function resolveRecommendation(state: BlackjackRenderState): {
  action: BlackjackStrategyTrainerAction;
  scenarioLabel: string;
  rationale: string;
} {
  if (state.askingForInsurance && (state.controls.insure || state.controls.decline)) {
    return {
      action: "decline",
      scenarioLabel: "Insurance decision",
      rationale:
        "Insurance is usually a negative-expectation side bet. Preserving stack for core decisions is higher EV long-term.",
    };
  }

  const activeHand = state.player?.hands.find((hand) => hand.active) ?? state.player?.hands[0];
  if (!activeHand) {
    return {
      action: "stand",
      scenarioLabel: "No active hand",
      rationale: "No player hand is currently active, so no strategy recommendation is available.",
    };
  }

  const dealerValue = dealerUpValue(state);
  const { total, soft } = computeHandTotal(activeHand.cards);
  const pair = isPair(activeHand.cards);
  const pairRank = pair ? cardRank(activeHand.cards[0]) : null;

  if (pair && pairRank) {
    const pairRecommendation = resolvePairRecommendation({
      rank: pairRank,
      dealerValue,
      canSplit: state.controls.split,
    });

    if (pairRecommendation) {
      return {
        action: pairRecommendation,
        scenarioLabel: `Pair ${pairRank}${pairRank} vs dealer ${dealerValue === 11 ? "A" : dealerValue}`,
        rationale:
          pairRecommendation === "split"
            ? "Splitting this pair improves equity by reducing weak hand traps and improving double-down paths."
            : "Keeping this pair together generally avoids lower-EV split outcomes in this dealer matchup.",
      };
    }
  }

  const action = soft
    ? resolveSoftRecommendation({
        total,
        dealerValue,
        canDouble: state.controls.double && activeHand.cards.length === 2,
      })
    : resolveHardRecommendation({
        total,
        dealerValue,
        canDouble: state.controls.double && activeHand.cards.length === 2,
      });

  return {
    action,
    scenarioLabel: `${soft ? "Soft" : "Hard"} ${total} vs dealer ${dealerValue === 11 ? "A" : dealerValue}`,
    rationale: soft
      ? "Soft hands can improve without immediate bust risk, so aggressiveness depends on dealer weakness and double opportunities."
      : "Hard-hand strategy balances bust risk against dealer bust pressure from weak up-cards.",
  };
}

function actionBaseScore(params: {
  action: BlackjackStrategyTrainerAction;
  total: number;
  dealerValue: number;
  soft: boolean;
  pair: boolean;
  canDouble: boolean;
  canSplit: boolean;
  insuranceDecision: boolean;
}): number {
  const { action, total, dealerValue, soft, pair, canDouble, canSplit, insuranceDecision } = params;

  if (insuranceDecision) {
    if (action === "decline") {
      return 0.24;
    }
    if (action === "insure") {
      return -0.38;
    }
    return -0.6;
  }

  if (action === "insure" || action === "decline") {
    return -0.8;
  }

  let score = -0.1;

  if (action === "stand") {
    score += total >= 17 ? 0.35 : 0;
    score += !soft && total >= 12 && total <= 16 && dealerValue <= 6 ? 0.28 : 0;
    score -= total <= 11 ? 0.65 : 0;
  }

  if (action === "hit") {
    score += total <= 11 ? 0.32 : 0;
    score += !soft && total >= 12 && total <= 16 && dealerValue >= 7 ? 0.2 : 0;
    score -= total >= 17 ? 0.84 : 0;
  }

  if (action === "double") {
    if (!canDouble) {
      return -1.1;
    }
    score += total === 11 ? 0.5 : 0;
    score += total === 10 && dealerValue <= 9 ? 0.42 : 0;
    score += soft && total >= 13 && total <= 18 && dealerValue >= 3 && dealerValue <= 6 ? 0.35 : 0;
    score -= total >= 17 ? 0.4 : 0;
  }

  if (action === "split") {
    if (!canSplit || !pair) {
      return -1.2;
    }
    score += 0.18;
  }

  return score;
}

function explainAction(params: {
  action: BlackjackStrategyTrainerAction;
  recommendedAction: BlackjackStrategyTrainerAction;
  total: number;
  dealerValue: number;
  soft: boolean;
  pair: boolean;
  insuranceDecision: boolean;
}): string {
  const { action, recommendedAction, total, dealerValue, soft, pair, insuranceDecision } = params;

  if (insuranceDecision) {
    if (action === "decline") {
      return "Best long-run value: decline insurance and keep bankroll focused on main-hand EV.";
    }
    if (action === "insure") {
      return "Insurance usually loses value over time unless deck composition is heavily ten-rich.";
    }
  }

  if (action === recommendedAction) {
    return "Best EV line for this board state based on basic strategy priorities.";
  }

  if (action === "hit" && total >= 17) {
    return "Hitting this total introduces unnecessary bust risk against most dealer outcomes.";
  }

  if (action === "stand" && total <= 11) {
    return "Standing this low gives up strong draw equity and usually burns EV.";
  }

  if (action === "double") {
    return "Doubling here overcommits chips in a spot where your equity edge is too thin.";
  }

  if (action === "split") {
    if (!pair) {
      return "Split is unavailable unless the starting two cards are a pair.";
    }
    return "Splitting this pair is lower EV than playing the hand as a unit in this matchup.";
  }

  if (action === "stand" && !soft && total >= 12 && dealerValue >= 7) {
    return "Dealer strength is high here, so standing too early misses recovery equity.";
  }

  return `Compared with ${ACTION_LABELS[recommendedAction]}, this choice typically underperforms in long-run EV.`;
}

function availableActions(state: BlackjackRenderState): BlackjackStrategyTrainerAction[] {
  const actions: BlackjackStrategyTrainerAction[] = [];
  if (state.controls.hit) {
    actions.push("hit");
  }
  if (state.controls.stand) {
    actions.push("stand");
  }
  if (state.controls.double) {
    actions.push("double");
  }
  if (state.controls.split) {
    actions.push("split");
  }
  if (state.controls.insure) {
    actions.push("insure");
  }
  if (state.controls.decline) {
    actions.push("decline");
  }
  return actions;
}

export function buildBlackjackStrategyTrainerInsight(
  state: BlackjackRenderState | null,
): BlackjackStrategyTrainerInsight | null {
  if (!state || !state.player || state.askingToDeal) {
    return null;
  }

  const actions = availableActions(state);
  if (!actions.length) {
    return null;
  }

  const activeHand = state.player.hands.find((hand) => hand.active) ?? state.player.hands[0];
  if (!activeHand) {
    return null;
  }

  const { total, soft } = computeHandTotal(activeHand.cards);
  const dealerValue = dealerUpValue(state);
  const pair = isPair(activeHand.cards);
  const insuranceDecision =
    state.askingForInsurance && (state.controls.insure || state.controls.decline);

  const recommendation = resolveRecommendation(state);
  const recommendedAction = actions.includes(recommendation.action)
    ? recommendation.action
    : actions[0];

  const scored = actions.map((action): BlackjackStrategyActionInsight & { score: number } => {
    let score = actionBaseScore({
      action,
      total,
      dealerValue,
      soft,
      pair,
      canDouble: state.controls.double && activeHand.cards.length === 2,
      canSplit: state.controls.split,
      insuranceDecision,
    });

    if (action === recommendedAction) {
      score += 0.6;
    }

    return {
      action,
      label: ACTION_LABELS[action],
      isRecommended: action === recommendedAction,
      score,
      evDeltaPct: 0,
      explanation: explainAction({
        action,
        recommendedAction,
        total,
        dealerValue,
        soft,
        pair,
        insuranceDecision,
      }),
    };
  });

  const bestScore = Math.max(...scored.map((entry) => entry.score));
  const actionInsights = scored
    .map((entry) => {
      const delta = Math.min(0, entry.score - bestScore);
      return {
        action: entry.action,
        label: entry.label,
        isRecommended: entry.isRecommended,
        evDeltaPct: Math.round(delta * 1200) / 10,
        explanation: entry.explanation,
      } satisfies BlackjackStrategyActionInsight;
    })
    .sort((left, right) => right.evDeltaPct - left.evDeltaPct);

  return {
    scenarioLabel: recommendation.scenarioLabel,
    recommendationLabel: ACTION_LABELS[recommendedAction],
    rationale: recommendation.rationale,
    actionInsights,
  };
}
