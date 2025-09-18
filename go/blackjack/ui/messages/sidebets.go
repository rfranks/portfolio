package messages

import (
	"fmt"
	"strings"

	"blackjack/cards"
	"blackjack/game"
	"blackjack/player"
	"blackjack/sidebets"
)

// SidebetReasons returns the textual descriptions for any winning sidebet
// outcomes on the provided hand. The strings mirror the messaging produced by
// the terminal UI so other front-ends can render consistent explanations.
func SidebetReasons(hand player.Hand) []string {
	switch game.GameMode {
	case game.Spanish21:
		return spanish21Reasons(hand)
	case game.TrifectaStaxx:
		return trifectaStaxxReasons(hand)
	default:
		return nil
	}
}

func spanish21Reasons(hand player.Hand) []string {
	if hand.TrifectaWager <= 0 || len(hand.Cards) < 2 {
		return nil
	}

	winnings := sidebets.GetSpanish21Winnings(hand)
	if winnings <= 0 {
		return nil
	}

	reasons := make([]string, 0, 4)
	firstCard := hand.Cards[0]
	secondCard := hand.Cards[1]
	dealerUpCard := sidebets.DealerUpCard()
	dealerDownCard := sidebets.DealerDownCard()

	if firstCard.Value == dealerUpCard.Value {
		if sidebets.CardsMatchSuit(firstCard, dealerUpCard) {
			reasons = append(reasons, fmt.Sprintf("First Card Matches Up Card, Matches Suit! %d to 1 WINNER!", sidebets.Spanish21MatchSuitMultiplier))
		} else {
			reasons = append(reasons, fmt.Sprintf("First Card Matches Up Card! %d to 1 WINNER!", sidebets.Spanish21MatchUnsuitedMultiplier))
		}
	}

	if secondCard.Value == dealerUpCard.Value {
		if sidebets.CardsMatchSuit(secondCard, dealerUpCard) {
			reasons = append(reasons, fmt.Sprintf("Second Card Matches Up Card, Matches Suit! %d to 1 WINNER!", sidebets.Spanish21MatchSuitMultiplier))
		} else {
			reasons = append(reasons, fmt.Sprintf("Second Card Matches Up Card! %d to 1 WINNER!", sidebets.Spanish21MatchUnsuitedMultiplier))
		}
	}

	if !dealerDownCard.Masked {
		if firstCard.Value == dealerDownCard.Value {
			if sidebets.CardsMatchSuit(firstCard, dealerDownCard) {
				reasons = append(reasons, fmt.Sprintf("First Card Matches Down Card, Matches Suit! %d to 1 WINNER!", sidebets.Spanish21MatchSuitMultiplier))
			} else {
				reasons = append(reasons, fmt.Sprintf("First Card Matches Down Card! %d to 1 WINNER!", sidebets.Spanish21MatchUnsuitedMultiplier))
			}
		}

		if secondCard.Value == dealerDownCard.Value {
			if sidebets.CardsMatchSuit(secondCard, dealerDownCard) {
				reasons = append(reasons, fmt.Sprintf("Second Card Matches Down Card, Matches Suit! %d to 1 WINNER!", sidebets.Spanish21MatchSuitMultiplier))
			} else {
				reasons = append(reasons, fmt.Sprintf("Second Card Matches Down Card! %d to 1 WINNER!", sidebets.Spanish21MatchUnsuitedMultiplier))
			}
		}
	}

	return reasons
}

func trifectaStaxxReasons(hand player.Hand) []string {
	if hand.TrifectaWager <= 0 {
		return nil
	}

	switch {
	case sidebets.IsTrifectaTripAces(hand, true) || sidebets.IsTrifectaTripAces(hand, false) ||
		sidebets.IsTrifectaTriplet(hand, cards.King, false) || sidebets.IsTrifectaTriplet(hand, cards.Queen, false):
		return []string{"Trifecta PROGRESSIVE!"}
	case sidebets.IsTrifectaStraightFlush(hand):
		return []string{"Trifecta STRAIGHT FLUSH!"}
	case sidebets.IsTrifectaTrips(hand, false):
		return []string{"Trifecta TRIPS!"}
	case sidebets.IsTrifectaFlush(hand):
		return []string{"Trifecta FLUSH!"}
	case sidebets.IsTrifectaStraight(hand):
		return []string{"Trifecta STRAIGHT!"}
	default:
		return nil
	}
}

// JoinReasons formats the provided reason strings with a separator suited for
// human-readable output while preserving the original ordering used in the
// terminal UI.
func JoinReasons(reasons []string, separator string) string {
	if len(reasons) == 0 {
		return ""
	}
	return strings.Join(reasons, separator)
}
