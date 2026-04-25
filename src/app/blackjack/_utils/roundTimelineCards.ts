import type { BlackjackRenderState } from "../_types/messages";
import type { BlackjackRoundTimelineEntry } from "../_types/page";

export type RoundTimelineCardEvent = {
  card?: BlackjackRoundTimelineEntry["card"];
  detail: string;
  kind: BlackjackRoundTimelineEntry["kind"];
  title: string;
};

const getPlayerHandLabel = (handIndex: number) => `Player 1 Hand ${handIndex + 1}`;

export function getRoundTimelineCardEvents({
  enteredNewRound,
  nextState,
  previousState,
}: {
  enteredNewRound: boolean;
  nextState: BlackjackRenderState;
  previousState: BlackjackRenderState;
}): RoundTimelineCardEvent[] {
  const events: RoundTimelineCardEvent[] = [];
  const previousDealerCards = enteredNewRound ? [] : previousState.dealer.cards;
  const nextDealerCards = nextState.dealer.cards;
  const previousHands = enteredNewRound ? [] : (previousState.player?.hands ?? []);
  const nextHands = nextState.player?.hands ?? [];

  const pushDealEvent = (
    card: BlackjackRenderState["dealer"]["cards"][number] | undefined,
    detail: string,
  ) => {
    if (!card) {
      return;
    }

    events.push({
      kind: "state",
      title: "Dealt",
      detail,
      card,
    });
  };

  if (nextHands.length > previousHands.length && nextHands.length > 1) {
    events.push({
      kind: "action",
      title: "Split",
      detail: `${nextHands.length} hands now in play`,
    });
  }

  if (enteredNewRound && previousDealerCards.length === 0 && previousHands.length === 0) {
    const firstHand = nextHands[0];
    pushDealEvent(firstHand?.cards[0], `to ${getPlayerHandLabel(0)}`);
    pushDealEvent(nextDealerCards[0], "to Dealer");
    pushDealEvent(firstHand?.cards[1], `to ${getPlayerHandLabel(0)}`);
    pushDealEvent(nextDealerCards[1], "to Dealer");

    for (const hand of nextHands) {
      const cardStartIndex = hand.index === 0 ? 2 : 0;
      for (let cardIndex = cardStartIndex; cardIndex < hand.cards.length; cardIndex += 1) {
        pushDealEvent(hand.cards[cardIndex], `to ${getPlayerHandLabel(hand.index)}`);
      }
    }

    for (let cardIndex = 2; cardIndex < nextDealerCards.length; cardIndex += 1) {
      pushDealEvent(nextDealerCards[cardIndex], "to Dealer");
    }

    return events;
  }

  const previousHandsByIndex = new Map(previousHands.map((hand) => [hand.index, hand] as const));

  for (const hand of nextHands) {
    const previousHand = previousHandsByIndex.get(hand.index);
    const previousCards = previousHand?.cards ?? [];
    const nextCards = hand.cards;

    for (let cardIndex = previousCards.length; cardIndex < nextCards.length; cardIndex += 1) {
      pushDealEvent(nextCards[cardIndex], `to ${getPlayerHandLabel(hand.index)}`);
    }
  }

  for (
    let cardIndex = 0;
    cardIndex < Math.min(previousDealerCards.length, nextDealerCards.length);
    cardIndex += 1
  ) {
    const previousCard = previousDealerCards[cardIndex];
    const nextCard = nextDealerCards[cardIndex];
    if (previousCard?.masked && !nextCard?.masked) {
      events.push({
        kind: "state",
        title: "Dealer revealed",
        detail: cardIndex === 1 ? "for hole card" : "a card",
        card: nextCard,
      });
    }
  }

  for (
    let cardIndex = previousDealerCards.length;
    cardIndex < nextDealerCards.length;
    cardIndex += 1
  ) {
    pushDealEvent(nextDealerCards[cardIndex], "to Dealer");
  }

  for (const hand of nextHands) {
    const previousHand = previousHandsByIndex.get(hand.index);
    const previousCards = previousHand?.cards ?? [];
    const nextCards = hand.cards;

    for (
      let cardIndex = 0;
      cardIndex < Math.min(previousCards.length, nextCards.length);
      cardIndex += 1
    ) {
      const previousCard = previousCards[cardIndex];
      const nextCard = nextCards[cardIndex];
      if (previousCard?.masked && !nextCard?.masked) {
        events.push({
          kind: "state",
          title: "Revealed",
          detail: `for ${getPlayerHandLabel(hand.index)}`,
          card: nextCard,
        });
      }
    }
  }

  return events;
}
