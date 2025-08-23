package sidebets

import (
	"blackjack/cards"
	"blackjack/game"
	"blackjack/player"
	"blackjack/rules"
)

var TrifectaProgressives []int

const Spanish21MatchUnsuitedMultiplier = 3
const Spanish21MatchSuitMultiplier = 12

func DealerUpCard() cards.Card {
	return game.State.Dealer.Hands[0].Cards[0]
}

func DealerDownCard() cards.Card {
	return game.State.Dealer.Hands[0].Cards[1]
}

func HandToTrifectaHand(hand player.Hand) player.Hand {
	trifectaHand := player.CreateHand()
	trifectaHand.Player = hand.Player

	for i := 0; i < len(hand.Cards); i++ {
		trifectaHand.Cards = append(trifectaHand.Cards, cards.CreateCard(hand.Cards[i].Suite, hand.Cards[i].Value))
	}
	trifectaHand.Cards = append(trifectaHand.Cards, cards.CreateCard(game.State.Dealer.Hands[0].Cards[0].Suite, game.State.Dealer.Hands[0].Cards[0].Value))

	return trifectaHand
}

func IsTrifectaFlush(hand player.Hand) bool {
	if rules.IsDealer(*hand.Player) {
		return false
	}

	if hand.Split {
		return false
	}

	trifectaHand := HandToTrifectaHand(hand)

	if len(trifectaHand.Cards) != 3 {
		return false
	}

	return rules.IsFlush(trifectaHand)
}

func IsTrifectaJacksOrBetter(hand player.Hand) bool {
	if rules.IsDealer(*hand.Player) {
		return false
	}

	if hand.Split {
		return false
	}

	trifectaHand := HandToTrifectaHand(hand)

	if len(trifectaHand.Cards) != 3 {
		return false
	}

	return IsTrifectaPair(hand, cards.Jack) || IsTrifectaPair(hand, cards.Queen) || IsTrifectaPair(hand, cards.King) || IsTrifectaPair(hand, cards.Ace) || IsTrifectaTrips(hand, false) || IsTrifectaStraight(hand) || IsTrifectaFlush(hand) || IsTrifectaStraightFlush(hand) || IsTrifectaRoyalFlush(hand)
}

func IsTrifectaPair(hand player.Hand, value cards.CardValue) bool {
	if rules.IsDealer(*hand.Player) {
		return false
	}

	if hand.Split {
		return false
	}

	trifectaHand := HandToTrifectaHand(hand)

	if len(trifectaHand.Cards) != 3 {
		return false
	}

	return trifectaHand.Cards[0].Value == value && trifectaHand.Cards[1].Value == value ||
		trifectaHand.Cards[0].Value == value && trifectaHand.Cards[2].Value == value ||
		trifectaHand.Cards[1].Value == value && trifectaHand.Cards[2].Value == value
}

func IsTrifectaStraight(hand player.Hand) bool {
	if rules.IsDealer(*hand.Player) {
		return false
	}

	if hand.Split {
		return false
	}

	trifectaHand := HandToTrifectaHand(hand)

	if len(trifectaHand.Cards) != 3 {
		return false
	}

	return rules.IsStraight(trifectaHand)
}

func IsTrifectaStraightFlush(hand player.Hand) bool {
	if rules.IsDealer(*hand.Player) {
		return false
	}

	if hand.Split {
		return false
	}

	trifectaHand := HandToTrifectaHand(hand)

	if len(trifectaHand.Cards) != 3 {
		return false
	}

	return rules.IsStraightFlush(trifectaHand)
}

func IsTrifectaRoyalFlush(hand player.Hand) bool {
	if rules.IsDealer(*hand.Player) {
		return false
	}

	if hand.Split {
		return false
	}

	trifectaHand := HandToTrifectaHand(hand)

	if len(trifectaHand.Cards) != 3 {
		return false
	}

	return rules.IsRoyalFlush(trifectaHand)
}

func IsTrifectaTripAces(hand player.Hand, suited bool) bool {
	if IsTrifectaTrips(hand, suited) {
		if cards.IsAce(hand.Cards[0]) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}

func IsTrifectaTriplet(hand player.Hand, value cards.CardValue, suited bool) bool {
	if IsTrifectaTrips(hand, suited) {
		if hand.Cards[0].Value == value {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}

func IsTrifectaTrips(hand player.Hand, suited bool) bool {
	if rules.IsDealer(*hand.Player) {
		return false
	}

	if hand.Split {
		return false
	}

	trifectaHand := HandToTrifectaHand(hand)

	if len(trifectaHand.Cards) != 3 {
		return false
	}

	value := trifectaHand.Cards[0].Value
	if suited {
		suite := trifectaHand.Cards[0].Suite
		return (trifectaHand.Cards[1].Value == value &&
			trifectaHand.Cards[2].Value == value) || (cards.IsAce(trifectaHand.Cards[0]) && cards.IsAce(trifectaHand.Cards[1]) && cards.IsAce(trifectaHand.Cards[2])) &&
			(trifectaHand.Cards[1].Suite == suite &&
				trifectaHand.Cards[2].Suite == suite)
	} else {
		return (trifectaHand.Cards[1].Value == value &&
			trifectaHand.Cards[2].Value == value) || (cards.IsAce(trifectaHand.Cards[0]) && cards.IsAce(trifectaHand.Cards[1]) && cards.IsAce(trifectaHand.Cards[2]))
	}
}

func IsTwentyHand(hand player.Hand) bool {
	if rules.IsDealer(*hand.Player) {
		return false
	}

	if hand.Split {
		return false
	}

	if len(hand.Cards) != 2 {
		return false
	}

	return hand.Cards[0].Value == cards.Ten && hand.Cards[1].Value == cards.Ten
}

func PayJackAttack() {
	for i := 0; i < len(game.State.Players); i++ {
		playerToTest := &game.State.Players[i]
		hand := player.ActiveHand(playerToTest)
		winnings := 0

		if rules.IsPairHand(*hand, cards.Jack, true) && cards.IsOneEyedJack(hand.Cards[0]) && cards.IsOneEyedJack(hand.Cards[1]) {
			winnings += 100 * hand.TrifectaWager
		} else if rules.IsPairHand(*hand, cards.Jack, false) && cards.IsOneEyedJack(hand.Cards[0]) && cards.IsOneEyedJack(hand.Cards[1]) {
			// any two one-eyed jacks = 50 to 1
			winnings += 50 * hand.TrifectaWager
		} else if rules.IsPairHand(*hand, cards.Jack, true) {
			// any suited jacks = 25 to 1
			winnings += 25 * hand.TrifectaWager
		} else if rules.IsPairHand(*hand, cards.Jack, false) {
			// any two jacks = 10 to 1
			winnings += 10 * hand.TrifectaWager
		} else if IsTwentyHand(*hand) {
			// any twenty = 5 to 1
			winnings += 5 * hand.TrifectaWager
		}

		if winnings > 0 {
			// you get your wager back?
			playerToTest.Stack += winnings + hand.TrifectaWager

			// track our winnings
			game.State.SidebetWinnings += winnings
		} else {
			game.State.SidebetLosings += hand.TrifectaWager
		}
	}

	game.SaveBlackjackStateYaml()
}

func GetSpanish21Winnings(hand player.Hand) int {
	winnings := 0

	if hand.TrifectaWager > 0 {
		firstCard := hand.Cards[0]
		secondCard := hand.Cards[1]

		dealerUpCard := DealerUpCard()
		dealerDownCard := DealerDownCard()

		if firstCard.Value == dealerUpCard.Value {
			if CardsMatchSuite(firstCard, dealerUpCard) {
				winnings += Spanish21MatchSuitMultiplier * hand.TrifectaWager
			} else {
				winnings += Spanish21MatchUnsuitedMultiplier * hand.TrifectaWager
			}
		}

		if secondCard.Value == dealerUpCard.Value {
			if CardsMatchSuite(secondCard, dealerUpCard) {
				winnings += Spanish21MatchSuitMultiplier * hand.TrifectaWager
			} else {
				winnings += Spanish21MatchUnsuitedMultiplier * hand.TrifectaWager
			}
		}

		if firstCard.Value == dealerDownCard.Value {
			if CardsMatchSuite(firstCard, dealerDownCard) {
				winnings += Spanish21MatchSuitMultiplier * hand.TrifectaWager
			} else {
				winnings += Spanish21MatchUnsuitedMultiplier * hand.TrifectaWager
			}
		}

		if secondCard.Value == dealerDownCard.Value {
			if CardsMatchSuite(secondCard, dealerDownCard) {
				winnings += Spanish21MatchSuitMultiplier * hand.TrifectaWager
			} else {
				winnings += Spanish21MatchUnsuitedMultiplier * hand.TrifectaWager
			}
		}
	}

	return winnings
}

func PaySpanish21Matches() {
	player.ForAllPlayers(game.State.Players, func(currPlayer *player.Player) {
		player.ForAllHands(currPlayer, func(hand *player.Hand) {
			winnings := GetSpanish21Winnings(*hand)

			if winnings > 0 {
				currPlayer.Stack += winnings + hand.TrifectaWager
				game.State.SidebetWinnings += winnings
			}
		})
	})

	game.SaveBlackjackStateYaml()
}

func PayTrifecta() {
	for i := 0; i < len(game.State.Players); i++ {
		playerToTest := &game.State.Players[i]
		hand := player.ActiveHand(playerToTest)
		trifectaWinnings := 0

		if IsTrifectaTriplet(*hand, cards.Five, false) {
			//unsuited fives = 60 to 1
			trifectaWinnings += 60 * hand.TrifectaWager
		} else if IsTrifectaStraightFlush(*hand) {
			//straight flush = 40 to 1
			trifectaWinnings += 40 * hand.TrifectaWager
		} else if IsTrifectaTrips(*hand, false) {
			// three of a kind = 30 to 1
			trifectaWinnings += 30 * hand.TrifectaWager
		} else if IsTrifectaStraight(*hand) {
			// straight = 6 to 1
			trifectaWinnings += 6 * hand.TrifectaWager
		} else if IsTrifectaFlush(*hand) {
			// flush = 4 to 1
			trifectaWinnings += 4 * hand.TrifectaWager
		} else if IsTrifectaJacksOrBetter(*hand) {
			trifectaWinnings += 2 * hand.TrifectaWager
		}

		if trifectaWinnings > 0 {
			// you get your wager back?
			playerToTest.Stack += trifectaWinnings + hand.TrifectaWager

			// track our winnings
			game.State.SidebetWinnings += trifectaWinnings
		} else {
			game.State.SidebetLosings += hand.TrifectaWager
		}
	}

	game.SaveBlackjackStateYaml()
}

func PayTrifecta3() {
	for i := 0; i < len(game.State.Players); i++ {
		playerToTest := &game.State.Players[i]
		hand := player.ActiveHand(playerToTest)
		trifectaWinnings := 0

		if IsTrifectaTrips(*hand, true) {
			//suited trips = 270 to 1
			trifectaWinnings += 270 * hand.TrifectaWager
		} else if IsTrifectaStraightFlush(*hand) {
			// straight flush 180 to 1
			trifectaWinnings += 180 * hand.TrifectaWager
		} else if IsTrifectaTrips(*hand, false) {
			// three of a kind = 90 to 1
			trifectaWinnings += 90 * hand.TrifectaWager
		}

		if trifectaWinnings > 0 {
			// you get your wager back?
			playerToTest.Stack += trifectaWinnings + hand.TrifectaWager

			// track our winnings
			game.State.SidebetWinnings += trifectaWinnings
		} else {
			game.State.SidebetLosings += hand.TrifectaWager
		}
	}

	game.SaveBlackjackStateYaml()
}

func PayTrifectaStax() {
	for i := 0; i < len(game.State.Players); i++ {
		playerToTest := &game.State.Players[i]
		hand := *player.ActiveHand(playerToTest)
		trifectaWinnings := 0

		if IsTrifectaTripAces(hand, true) {
			//suited trip aces win the jackpot progressive
			trifectaWinnings += TrifectaProgressives[0] / 100
			TrifectaProgressives[0] = 1000000
		} else if IsTrifectaTripAces(hand, false) {
			//unsuited trip aces win the mega progressive
			trifectaWinnings += TrifectaProgressives[1] / 100
			TrifectaProgressives[1] = 500000
		} else if IsTrifectaTriplet(hand, cards.King, false) {
			//unsuited trip kings win the super progressive
			trifectaWinnings += TrifectaProgressives[2] / 100
			TrifectaProgressives[2] = 100000
		} else if IsTrifectaTriplet(hand, cards.Queen, false) {
			//unsuited trip queens win the progressive
			trifectaWinnings += TrifectaProgressives[3] / 100
			TrifectaProgressives[3] = 50000
		} else if IsTrifectaStraightFlush(hand) {
			trifectaWinnings += 150
		} else if IsTrifectaTrips(hand, false) {
			trifectaWinnings += 100
		} else if IsTrifectaStraight(hand) {
			trifectaWinnings += 30
		} else if IsTrifectaFlush(hand) {
			trifectaWinnings += 20
		} else {
			// add losing trifecta stax wagers to the progressives, weighted
			TrifectaProgressives[0] += int(.6 * float64(hand.TrifectaWager) * 100)
			TrifectaProgressives[1] += int(.25 * float64(hand.TrifectaWager) * 100)
			TrifectaProgressives[2] += int(.1 * float64(hand.TrifectaWager) * 100)
			TrifectaProgressives[3] += int(.05 * float64(hand.TrifectaWager) * 100)
		}

		if trifectaWinnings > 0 {
			// you get your wager back?
			playerToTest.Stack += trifectaWinnings + hand.TrifectaWager

			// track our winnings
			game.State.SidebetWinnings += trifectaWinnings
		} else {
			game.State.SidebetLosings += hand.TrifectaWager
		}
	}

	game.SaveBlackjackStateYaml()
}

func CardsMatchSuite(aCard cards.Card, bCard cards.Card) bool {
	return aCard.Suite == bCard.Suite
}
