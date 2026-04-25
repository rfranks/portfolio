import type { BlackjackRenderState } from "../_types/messages";
import type { BlackjackRoundSnapshot } from "../_types/page";

export function buildRoundSnapshot(
  engineState: BlackjackRenderState | null,
  dealerOutcomeStampLabel: string,
): BlackjackRoundSnapshot | null {
  if (!engineState) {
    return null;
  }

  return {
    dealer: {
      cards: engineState.dealer.cards,
      totalLabel: engineState.dealer.totalLabel,
      outcomeLabel: dealerOutcomeStampLabel || engineState.dealer.outcomeLabel,
    },
    hands: (engineState.player?.hands ?? []).map((hand) => ({
      cards: hand.cards,
      index: hand.index,
      outcomeLabel: hand.outcomeLabel,
      split: hand.split,
      totalLabel: hand.totalLabel,
    })),
  };
}
