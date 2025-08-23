package rules

import (
	"blackjack/cards"
	"blackjack/game"
	"blackjack/player"
	"errors"
)

func CanDoubleDown(hand *player.Hand) bool {
	if hand.Player.Stack < hand.Wager {
		return false
	}

	if hand.Stand {
		return false
	}

	if hand.EvenMoney {
		return false
	}

	if hand.DoubleDown {
		return false
	}

	if len(game.State.Dealer.Hands) == 1 && len(game.State.Dealer.Hands[0].Cards) > 1 && !game.State.Dealer.Hands[0].Cards[1].Masked {
		return false
	}

	if len(hand.Cards) != 2 {
		return false
	}

	if cards.IsAce(hand.Cards[0]) && hand.Split {
		return false
	}

	if IsBlackjack(*hand) {
		return false

	}

	softValue := player.HandValue(hand, true)
	hardValue := player.HandValue(hand, false)

	if softValue < 21 {
		return hardValue != 21
	}

	return false
}

func CanEvenMoney(hand *player.Hand) bool {
	if hand.Split {
		return false
	}

	if hand.EvenMoney {
		return false
	}

	if hand.Stand {
		return false
	}

	if !cards.IsAce(game.State.Dealer.Hands[0].Cards[0]) {
		return false
	}

	if !game.State.Dealer.Hands[0].Cards[1].Masked {
		return false
	}

	if len(hand.Cards) != 2 {
		return false
	}

	if !IsBlackjack(*hand) {
		return false
	}

	hardValue := player.HandValue(hand, false)
	return hardValue != 21
}

func CanInsurance(hand *player.Hand) bool {
	if game.State.Dealer.Hands[0].Cards[0].Value == cards.Ace && !hand.Split {
		if hand.EvenMoney {
			return false
		} else {
			return !hand.Insured
		}
	} else {
		return false
	}
}

func CanHit(hand *player.Hand) bool {
	if hand == nil {
		// todo how is this possible? !@#$@#%@$#%@#$!@
		return false
	}

	if len(hand.Cards) < 2 {
		return false
	}

	if !IsDealer(*hand.Player) {
		if CanEvenMoney(hand) {
			return false
		}

		if IsBlackjack(game.State.Dealer.Hands[0]) {
			return false
		}

		if hand.Stand {
			return false
		}

		if hand.DoubleDown {
			return false
		}

		if hand.Cards[0].Value == cards.Ace && hand.Split {
			return false
		}

		if IsBlackjack(*hand) {
			return false
		}
	}

	softValue := player.HandValue(hand, true)
	hardValue := player.HandValue(hand, false)

	if IsDealer(*hand.Player) {
		// stands on hard and soft 17s
		return hardValue <= 16
	} else {
		if hardValue == 21 {
			return false
		}
		return softValue < 21
	}
}

func CanPlay(playerToTest player.Player, minWager int) bool {
	activeHand := player.ActiveHand(&playerToTest)

	if activeHand == nil {
		return false
	}

	if playerToTest.Stack < minWager {
		return false
	}

	if IsBlackjack(game.State.Dealer.Hands[0]) {
		return false
	}

	if IsDealer(playerToTest) {
		return CanHit(&playerToTest.Hands[0])
	} else {
		if !game.State.Dealer.Hands[0].Cards[1].Masked {
			return false
		}

		for i := 0; i < len(playerToTest.Hands); i++ {
			hand := playerToTest.Hands[i]
			if hand.Player == nil {
				hand.Player = &playerToTest
			}

			if CanHit(&hand) || CanEvenMoney(&hand) || CanSplit(hand) || CanStand(hand) || CanInsurance(&hand) {
				return true
			}
		}

		return false
	}
}

func CanSplit(hand player.Hand) bool {
	if hand.Player.Stack < hand.Wager {
		return false
	}

	if hand.Stand {
		return false
	}

	if len(hand.Cards) != 2 {
		return false
	}

	if cards.IsAce(hand.Cards[0]) && hand.Split {
		return false
	}

	pipsAreEqual := cards.CardToPips(hand.Cards[0]) == cards.CardToPips(hand.Cards[1])
	areAces := cards.IsAce(hand.Cards[0]) && cards.IsAce(hand.Cards[1])

	return pipsAreEqual || areAces
}

func CanStand(hand player.Hand) bool {
	if hand.Stand {
		return false
	}

	if CanEvenMoney(&hand) {
		return true
	}

	if hand.Cards[0].Value == cards.Ace && hand.Split {
		if cards.IsAce(hand.Cards[0]) && hand.Split {
			if len(hand.Cards) == 2 {
				if cards.IsAce(hand.Cards[1]) {
					return true
				} else {
					return false
				}
			} else {
				return false
			}
		} else {
			return false
		}
	}

	softValue := player.HandValue(&hand, true)
	hardValue := player.HandValue(&hand, false)
	if softValue < 21 {
		if IsDealer(*hand.Player) {
			return softValue >= 17
		} else {
			if hardValue == 21 {
				return false
			} else {
				return true
			}
		}
	} else {
		return false
	}
}

func GetAutoPlayPlayerAction(activeHand *player.Hand, dealerFaceUpCard int) (rune, error) {
	// todo
	if activeHand == nil || !activeHand.Active {
		// we don't have an active hand try to stand
		return 's', nil
	}

	softValue := player.HandValue(activeHand, true)
	hardValue := player.HandValue(activeHand, false)

	if !CanSplit(*activeHand) && cards.IsAce(activeHand.Cards[0]) && cards.IsAce(activeHand.Cards[1]) {
		// todo this is really a defect, we should not be prompting the user for an action at all since they cannot re-split aces
		return 's', nil
	}

	if CanSplit(*activeHand) {
		if cards.IsAce(activeHand.Cards[0]) {
			return 'p', nil
		}

		if hardValue == 20 {
			return 's', nil
		}

		if hardValue == 18 {
			if dealerFaceUpCard >= 8 {
				return 's', nil
			} else {
				return 'p', nil
			}
		}

		if hardValue == 16 || hardValue == 14 {
			if dealerFaceUpCard >= 8 {
				return 'h', nil
			} else {
				return 'p', nil
			}
		}

		if hardValue == 8 || hardValue == 10 {
			if dealerFaceUpCard >= 2 && dealerFaceUpCard <= 7 {
				return 'd', nil
			} else {
				return 'h', nil
			}
		}

		if dealerFaceUpCard >= 2 && dealerFaceUpCard <= 6 {
			return 'p', nil
		} else {
			return 'h', nil
		}
	}

	if hardValue <= 8 {
		return 'h', nil
	}

	if hardValue == 9 {
		if dealerFaceUpCard >= 3 && dealerFaceUpCard <= 6 {
			if CanDoubleDown(activeHand) {
				return 'd', nil
			} else {
				return 'h', nil
			}
		}

		return 'h', nil
	}

	if hardValue == 10 {
		if dealerFaceUpCard >= 2 && dealerFaceUpCard <= 9 {
			if CanDoubleDown(activeHand) {
				return 'd', nil
			} else {
				return 'h', nil
			}
		}
		return 'h', nil
	}

	if hardValue == 11 {
		if CanDoubleDown(activeHand) {
			return 'd', nil
		} else {
			return 'h', nil
		}
	}

	if hardValue >= 12 && hardValue <= 16 {
		if dealerFaceUpCard >= 2 && dealerFaceUpCard <= 6 {
			return 's', nil
		} else {
			return 'h', nil
		}
	}

	if hardValue >= 17 {
		return 's', nil
	}

	if softValue != hardValue {
		if softValue <= 8 {
			if dealerFaceUpCard <= 6 {
				if CanDoubleDown(activeHand) {
					return 'd', nil
				} else {
					return 'h', nil
				}
			} else {
				if softValue >= 8 {
					return 's', nil
				} else {
					return 'h', nil
				}
			}
		}
	}

	// if canInsurance(activeHand) {
	// // always say no to insurance
	// return 'n', nil
	// }

	// if canEvenMoney(activeHand) {
	// // always take even money
	// return 'e', nil
	// }

	// if canDoubleDown(activeHand) {
	// if (dealerFaceUpCard >= 3 && dealerFaceUpCard <= 6) || (softValue > dealerFaceUpCard && softValue <= 11) {
	// // assume these are bust cards for the dealer
	// if softValue <= 11 && softValue >= 8 {
	// return 'd', nil
	// }
	// } else if softValue == 11 {
	// // always double down on 11
	// return 'd', nil
	// }
	// }

	// if canStand(*activeHand) {
	// if hardValue >= 17 && dealerFaceUpCard <= 7 {
	// return 's', nil
	// }
	// }

	// // if we get to this point and canSplit, why not? more money on the table
	// if canSplit(*activeHand) {
	// if hardValue <= 16 && hardValue >= 12 {
	// return 'p', nil
	// }
	// }

	// // if we can hit at this point, hit...
	// if canHit(activeHand) {
	// if hardValue >= 17 {
	// // we don't want to hit a 17 or more
	// return 's', nil
	// }

	// log.Printf("Hitting...")
	// if (dealerFaceUpCard >= 3 && dealerFaceUpCard <= 5 && hardValue <= 14) || dealerFaceUpCard >= 10 {
	// // if hardValue == 14 || hardValue == 15 || hardValue == 16 {
	// // hit a 14,15,16? really?
	// // return 's', nil
	// // }
	// // do we need some rudimentary card counting?
	// return 'h', nil
	// }

	// if hardValue < 11 {
	// if canDoubleDown(activeHand) {
	// // sure, why not? more money on the table?
	// return 'd', nil
	// }
	// }

	// return 'h', nil
	// } else {
	// return 's', nil
	// }

	// otherwise, we didn't understand
	return 'q', errors.New("I didn't understand... What should I do?")
}

func IsBlackjack(hand player.Hand) bool {
	if !hand.Split {
		if len(hand.Cards) == 2 {
			if player.HandValue(&hand, false) == 21 {
				return true
			} else {
				// todo what is going on? !@@#$!$
				if hand.Player == nil {
					return false
				}

				if IsDealer(*hand.Player) {
					masked := hand.Cards[1].Masked
					hand.Cards[1].Masked = false

					if cards.CardToValue(hand.Cards[0], false)+cards.CardToValue(game.State.Dealer.Hands[0].Cards[1], false) == 21 {
						hand.Cards[1].Masked = masked
						return true
					} else {
						hand.Cards[1].Masked = masked
						return false
					}
				} else {
					return false
				}
			}
		} else {
			return false
		}
	} else {
		return false
	}
}

func IsDealer(player player.Player) bool {
	return player.Dealer
}

func IsFlush(hand player.Hand) bool {
	if len(hand.Cards) < 3 {
		return false
	}

	var suite cards.CardSuite
	isFlush := true

	for i := 0; i < len(hand.Cards); i++ {
		card := hand.Cards[i]
		if i == 0 {
			suite = card.Suite
		}
		isFlush = isFlush && card.Suite == suite
	}

	return isFlush
}

func IsPairHand(hand player.Hand, value cards.CardValue, suited bool) bool {
	if IsDealer(*hand.Player) {
		return false
	}

	if hand.Split {
		return false
	}

	if len(hand.Cards) != 2 {
		return false
	}

	isPair := hand.Cards[0].Value == value && hand.Cards[1].Value == value
	if suited {
		return isPair && hand.Cards[0].Suite == hand.Cards[1].Suite
	} else {
		return isPair
	}
}

func IsStraight(hand player.Hand) bool {
	if len(hand.Cards) < 3 {
		return false
	}

	return IsStraightAcesHigh(hand) || IsStraightAcesLow(hand)
}

func IsStraightAcesHigh(hand player.Hand) bool {
	if len(hand.Cards) < 3 {
		return false
	}

	sortedHand := player.SortHand(hand, true)

	isStraight := true
	for i := 0; i < len(sortedHand.Cards); i++ {
		if i > 0 {
			isStraight = isStraight && cards.CardToPips(sortedHand.Cards[i-1])+1 == cards.CardToPips(sortedHand.Cards[i])
		}
		if !isStraight {
			break
		}
	}

	return isStraight
}

func IsStraightAcesLow(hand player.Hand) bool {
	if len(hand.Cards) < 3 {
		return false
	}

	sortedHand := player.SortHand(hand, false)

	isStraight := true
	for i := 0; i < len(sortedHand.Cards); i++ {
		if i > 0 {
			isStraight = isStraight && cards.CardToPips(sortedHand.Cards[i-1])+1 == cards.CardToPips(sortedHand.Cards[i])
		}
		if !isStraight {
			break
		}
	}

	return isStraight
}

func IsStraightFlush(hand player.Hand) bool {
	if IsFlush(hand) {
		if IsStraight(hand) {
			return true
		} else {
			return false
		}
	}
	return false
}

func IsRoyal(hand player.Hand) bool {
	if len(hand.Cards) < 3 {
		return false
	}

	isRoyal := true

	for i := 0; i < len(hand.Cards); i++ {
		cardPips := cards.CardToPips(hand.Cards[i])
		isRoyal = isRoyal && cardPips >= 10

		// if last card is not ace
		if i == len(hand.Cards)-1 && cardPips != 14 {
			isRoyal = false
			break
		}
	}

	return isRoyal
}

func IsRoyalFlush(hand player.Hand) bool {
	if IsThreeOrMore(hand) {
		if IsFlush(hand) {
			if IsStraight(hand) {
				if IsRoyal(hand) {
					return true
				} else {
					return false
				}
			} else {
				return false
			}
		} else {
			return false
		}
	} else {
		return false
	}
}

func IsThreeCardHand(hand player.Hand) bool {
	return len(hand.Cards) == 3
}

func IsThreeOrMore(hand player.Hand) bool {
	return len(hand.Cards) >= 3
}

func IsFiveCardHand(hand player.Hand) bool {
	return len(hand.Cards) == 5
}
