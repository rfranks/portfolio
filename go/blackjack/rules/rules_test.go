//go:build integration
// +build integration

package rules_test

import (
	"blackjack/cards"
	"blackjack/flags"
	"blackjack/game"
	"blackjack/player"
	"blackjack/random"
	"blackjack/rules"
	"blackjack/ui/terminal"
	"blackjack/utils"
	"testing"
)

var shortSampleSize = 1000
var cfg = flags.FromFlags()
var useGlyphs = &cfg.UseGlyphs
var colorTerminal = false
var playerStartStack = &cfg.PlayerStartStack
var minWager = &cfg.MinWager

func init() {
	game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}
	game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: random.RandomCardSlice(2), Player: &game.State.Dealer})
}

func CardsAreOrdered(hand player.Hand, acesLow bool) bool {
	sortedHand := player.SortHand(hand, acesLow)

	ordered := true
	for i := 0; i < len(sortedHand.Cards); i++ {
		if i > 0 {
			ordered = ordered && cards.CardToPips(sortedHand.Cards[i-1])+1 == cards.CardToPips(sortedHand.Cards[i])
		}
		if !ordered {
			break
		}
	}

	return ordered
}

func suitesAreEqual(hand player.Hand) bool {
	suitesAreEqual := true
	for i := 0; i < len(hand.Cards); i++ {
		if i == 0 {
			continue
		}

		suitesAreEqual = suitesAreEqual && hand.Cards[i].Suite == hand.Cards[i-1].Suite
		if !suitesAreEqual {
			return false
		}
	}

	return suitesAreEqual
}

func TestCanDoubleDown(t *testing.T) {
	testHand := func(hand player.Hand) {
		game.State.Dealer.Hands[0].Cards[1].Masked = false
		if rules.CanDoubleDown(&hand) {
			t.Fatalf(`rules.CanDoubleDown(%s) = %t [fail], want match for %t (second dealer cards.Card is not masked)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), false)
		} else {
			t.Logf(`rules.CanDoubleDown(%s) = %t [pass] (second dealer cards.Card is not masked)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand))
		}
		game.State.Dealer.Hands[0].Cards[1].Masked = true

		if rules.CanDoubleDown(&hand) && rules.IsBlackjack(hand) {
			t.Fatalf(`rules.CanDoubleDown(%s) = %t [fail], want match for %t (rules.IsBlackjack = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), rules.IsBlackjack(hand), rules.IsBlackjack(hand))
		} else {
			t.Logf(`rules.CanDoubleDown(%s) = %t [pass] (rules.IsBlackjack = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), rules.IsBlackjack(hand))
		}

		hand.Stand = true
		if rules.CanDoubleDown(&hand) {
			t.Fatalf(`rules.CanDoubleDown(%s) = %t [fail], want match for %t (Stand = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), false, hand.Stand)
		} else {
			t.Logf(`rules.CanDoubleDown(%s) = %t [pass] (Stand = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), hand.Stand)
		}
		hand.Stand = false

		hand.EvenMoney = true
		if rules.CanDoubleDown(&hand) {
			t.Fatalf(`rules.CanDoubleDown(%s) = %t [fail], want match for %t (EvenMoney = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), false, hand.EvenMoney)
		} else {
			t.Logf(`rules.CanDoubleDown(%s) = %t [pass] (EvenMoney = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), hand.EvenMoney)
		}
		hand.EvenMoney = false

		hand.Split = true
		softValue := player.HandValue(&hand, true)
		if !rules.CanDoubleDown(&hand) && (softValue >= 8 && softValue <= 11) && !cards.IsAce(hand.Cards[0]) {
			t.Fatalf(`rules.CanDoubleDown(%s) = %t [fail], want match for %t (Split = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), true, hand.Split)
		} else {
			t.Logf(`rules.CanDoubleDown(%s) = %t [pass] (Split = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), hand.Split)
		}
		hand.Split = false

		hand.DoubleDown = true
		if rules.CanDoubleDown(&hand) {
			t.Fatalf(`rules.CanDoubleDown(%s) = %t [fail], want match for %t (DoubleDown = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), false, hand.DoubleDown)
		} else {
			t.Logf(`rules.CanDoubleDown(%s) = %t [pass] (DoubleDown = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), hand.DoubleDown)
		}
		hand.DoubleDown = false
	}

	if testing.Short() {
		// in short mode, just try a sample
		for i := 0; i < shortSampleSize; i++ {

			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}
			game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: random.RandomCardSlice(2), Player: &game.State.Dealer})

			cardPlayer := player.CreatePlayer(*playerStartStack, *minWager)
			hand := player.Hand{Cards: random.RandomCardSlice(2), Player: &cardPlayer}

			testHand(hand)
		}
	} else {
		// in long mode, run for all possible combinations
		cards.ForAllCards(func(theCard cards.Card) {
			// for every combination of first dealer cards.Card
			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}
			game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: make([]cards.Card, 0), Player: &game.State.Dealer})
			game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, theCard)

			cards.ForAllCards(func(theCard cards.Card) {
				// for every combination of second dealer cards.Card (Masked = true)
				theCard.Masked = true
				if len(game.State.Dealer.Hands[0].Cards) == 2 {
					game.State.Dealer.Hands[0].Cards[1] = theCard
				} else {
					game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, theCard)
				}

				cards.ForAllCards(func(theCard cards.Card) {
					// for every combination of the player's first cards.Card
					hand := player.Hand{Cards: make([]cards.Card, 0), Player: &player.Player{}}
					hand.Cards = append(hand.Cards, theCard)

					if rules.CanDoubleDown(&hand) {
						t.Fatalf(`rules.CanDoubleDown(%s) = %t [fail], want match for %t (len(Cards) < 2)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand), false)
					} else {
						t.Logf(`rules.CanDoubleDown(%s) = %t [pass] (len(Cards) < 2)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanDoubleDown(&hand))
					}

					cards.ForAllCards(func(theCard cards.Card) {
						// for every combination of the player's second cards.Card
						if len(hand.Cards) == 2 {
							hand.Cards[1] = theCard
						} else if len(hand.Cards) < 2 {
							hand.Cards = append(hand.Cards, theCard)
						}

						testHand(hand)
					})
				})
			})
		})
	}
}

func TestCanEvenMoney(t *testing.T) {
	testHand := func(hand player.Hand) {
		if rules.CanEvenMoney(&hand) && len(hand.Cards) != 2 {
			t.Fatalf(`rules.CanEvenMoney(%s) = %t [fail], want match for %t (len(Cards) != 2)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanEvenMoney(&hand), false)
		} else {
			t.Logf(`rules.CanEvenMoney(%s) = %t [pass]`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanEvenMoney(&hand))
		}

		if rules.CanEvenMoney(&hand) && !cards.IsAce(game.State.Dealer.Hands[0].Cards[0]) {
			t.Fatalf(`rules.CanEvenMoney(%s) = %t [fail], want match for %t (first dealer cards.Card is not an ace)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanEvenMoney(&hand), false)
		}

		game.State.Dealer.Hands[0].Cards[1].Masked = false
		if rules.CanEvenMoney(&hand) {
			t.Fatalf(`rules.CanEvenMoney(%s) = %t [fail], want match for %t (second dealer cards.Card is not masked)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanEvenMoney(&hand), false)
		}
		game.State.Dealer.Hands[0].Cards[1].Masked = true

		if rules.CanEvenMoney(&hand) && !rules.IsBlackjack(hand) {
			t.Fatalf(`rules.CanEvenMoney(%s) = %t [fail], want match for %t (rules.IsBlackjack = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanEvenMoney(&hand), rules.IsBlackjack(hand), rules.IsBlackjack(hand))
		}

		hand.Stand = true
		if rules.CanEvenMoney(&hand) {
			t.Fatalf(`rules.CanEvenMoney(%s) = %t [fail], want match for %t (Stand = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanEvenMoney(&hand), false, hand.Stand)
		}
		hand.Stand = false

		hand.EvenMoney = true
		if rules.CanEvenMoney(&hand) {
			t.Fatalf(`rules.CanEvenMoney(%s) = %t [fail], want match for %t (EvenMoney = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanEvenMoney(&hand), false, hand.EvenMoney)
		}
		hand.EvenMoney = false

		hand.Split = true
		if rules.CanEvenMoney(&hand) {
			t.Fatalf(`rules.CanEvenMoney(%s) = %t [fail], want match for %t (Split = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanEvenMoney(&hand), false, hand.Split)
		}
		hand.Split = false
	}

	if testing.Short() {
		for i := 0; i < shortSampleSize; i++ {

			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}
			game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: random.RandomCardSlice(2), Player: &game.State.Dealer})

			cardPlayer := player.CreatePlayer(*playerStartStack, *minWager)
			die1 := utils.RollDice() / 4

			hand := player.Hand{Cards: random.RandomCardSlice(die1), Player: &cardPlayer}

			testHand(hand)
		}
	} else {
		cards.ForAllCards(func(dealerCard1 cards.Card) {
			// for every combination of first dealer cards.Card
			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}

			cards.ForAllCards(func(dealerCard2 cards.Card) {
				game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: []cards.Card{dealerCard1, dealerCard2}, Player: &game.State.Dealer})
				game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, dealerCard1)

				// for every combination of second dealer cards.Card (Masked = true)
				dealerCard2.Masked = true
				if len(game.State.Dealer.Hands[0].Cards) == 2 {
					game.State.Dealer.Hands[0].Cards[1] = dealerCard2
				} else {
					game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, dealerCard2)
				}

				cards.ForAllCards(func(theCard1 cards.Card) {
					// for every combination of the player's first cards.Card
					hand1 := player.Hand{Cards: []cards.Card{theCard1}, Player: &player.Player{}}

					testHand(hand1)

					cards.ForAllCards(func(theCard2 cards.Card) {
						hand2 := player.Hand{Cards: []cards.Card{theCard1, theCard2}, Player: &player.Player{}}

						testHand(hand2)

						cards.ForAllCards(func(theCard3 cards.Card) {
							// for every combination of the player's third?!??! cards.Card
							hand3 := player.Hand{Cards: []cards.Card{theCard1, theCard2, theCard3}, Player: &player.Player{}}

							testHand(hand3)
						})
					})
				})
			})
		})
	}
}

func TestCanHit(t *testing.T) {
	testHand := func(hand player.Hand) {
		if rules.CanHit(&hand) && rules.CanEvenMoney(&hand) {
			t.Fatalf(`rules.CanHit(%s) = %t [fail], want match for %t (rules.CanEvenMoney == %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanHit(&hand), rules.CanEvenMoney(&hand), true)
		}

		if rules.CanHit(&hand) && rules.IsBlackjack(game.State.Dealer.Hands[0]) {
			t.Fatalf(`rules.CanHit(%s) = %t [fail], want match for %t (dealer has blackjack!)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanHit(&hand), false)
		}

		if rules.CanHit(&hand) && rules.IsBlackjack(hand) {
			t.Fatalf(`rules.CanHit(%s) = %t [fail], want match for %t (player has blackjack!)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanHit(&hand), false)
		}

		hand.Split = true
		if rules.CanHit(&hand) && (hand.Cards[0].Value == cards.Ace && hand.Split) {
			t.Fatalf(`rules.CanHit(%s) = %t [fail], want match for %t (we split an ace!)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanHit(&hand), false)
		}
		hand.Split = false

		softValue := player.HandValue(&hand, true)
		if !rules.CanHit(&hand) && softValue < 21 && len(hand.Cards) >= 2 && !rules.IsBlackjack(hand) && !rules.CanEvenMoney(&hand) && !rules.IsBlackjack(game.State.Dealer.Hands[0]) {
			t.Fatalf(`rules.CanHit(%s) = %t [fail], want match for %t (softValue < 21 and player != Dealer)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanHit(&hand), true)
		}

		hardValue := player.HandValue(&game.State.Dealer.Hands[0], false)
		if rules.CanHit(&game.State.Dealer.Hands[0]) && hardValue >= 17 {
			t.Fatalf(`rules.CanHit(%s) = %t [fail], want match for %t (softValue < 21 and player == Dealer)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanHit(&game.State.Dealer.Hands[0]), false)
		}

		hand.DoubleDown = true
		if rules.CanHit(&hand) {
			t.Fatalf(`rules.CanHit(%s) = %t [fail], want match for %t (DoubleDown = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanHit(&hand), false, hand.DoubleDown)
		}
		hand.DoubleDown = false

		hand.Stand = true
		if rules.CanHit(&hand) {
			t.Fatalf(`rules.CanHit(%s) = %t [fail], want match for %t (Stand = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanHit(&hand), false, hand.Stand)
		}
		hand.Stand = false

		t.Logf(`rules.CanHit(%s) = %t [pass]`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanHit(&hand))
	}

	if testing.Short() {
		for i := 0; i < shortSampleSize; i++ {
			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}
			game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: random.RandomCardSlice(2), Player: &game.State.Dealer})

			cardPlayer := player.CreatePlayer(*playerStartStack, *minWager)
			die1 := utils.RollDice()

			hand := player.Hand{Cards: random.RandomCardSlice(die1), Player: &cardPlayer}

			testHand(hand)
		}
	} else {
		cards.ForAllCards(func(dealerCard1 cards.Card) {
			// for every combination of first dealer cards.Card
			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}

			cards.ForAllCards(func(dealerCard2 cards.Card) {
				game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: []cards.Card{dealerCard1, dealerCard2}, Player: &game.State.Dealer})
				game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, dealerCard1)

				// for every combination of second dealer cards.Card (Masked = true)
				dealerCard2.Masked = true
				if len(game.State.Dealer.Hands[0].Cards) == 2 {
					game.State.Dealer.Hands[0].Cards[1] = dealerCard2
				} else {
					game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, dealerCard2)
				}

				cards.ForAllCards(func(theCard1 cards.Card) {
					// for every combination of the player's first cards.Card
					hand1 := player.Hand{Cards: []cards.Card{theCard1}, Player: &player.Player{}}

					testHand(hand1)

					cards.ForAllCards(func(theCard2 cards.Card) {
						hand2 := player.Hand{Cards: []cards.Card{theCard1, theCard2}, Player: &player.Player{}}

						testHand(hand2)

						cards.ForAllCards(func(theCard3 cards.Card) {
							// for every combination of the player's third?!??! cards.Card
							hand3 := player.Hand{Cards: []cards.Card{theCard1, theCard2, theCard3}, Player: &player.Player{}}

							testHand(hand3)

							cards.ForAllCards(func(theCard4 cards.Card) {
								// for every combination of the player's third?!??! cards.Card
								hand4 := player.Hand{Cards: []cards.Card{theCard1, theCard2, theCard3, theCard4}, Player: &player.Player{}}

								testHand(hand4)
							})
						})
					})
				})
			})
		})
	}
}

func TestCanSplit(t *testing.T) {
	testHand := func(hand player.Hand) {
		hand.Stand = true
		if rules.CanSplit(hand) {
			t.Fatalf(`rules.CanSplit(%s) = %t [fail], want match for %t (Stand = %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanSplit(hand), false, hand.Stand)
		}
		hand.Stand = false

		if rules.CanSplit(hand) && len(hand.Cards) != 2 {
			t.Fatalf(`rules.CanSplit(%s) = %t [fail], want match for %t (len(Cards) != 2)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanSplit(hand), false)
		}

		if len(hand.Cards) == 2 {
			pipsAreEqual := cards.CardToPips(hand.Cards[0]) == cards.CardToPips(hand.Cards[1])
			areAces := cards.IsAce(hand.Cards[0]) && cards.IsAce(hand.Cards[1])

			if rules.CanSplit(hand) && !(pipsAreEqual || areAces) {
				t.Fatalf(`rules.CanSplit(%s) = %t [fail], want match for %t (pips must be equal)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanSplit(hand), pipsAreEqual || areAces)
			}
		}

		t.Logf(`rules.CanSplit(%s) = %t [pass]`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanSplit(hand))
	}

	if testing.Short() {
		for i := 0; i < shortSampleSize; i++ {
			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}
			game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: random.RandomCardSlice(2), Player: &game.State.Dealer})

			cardPlayer := player.CreatePlayer(*playerStartStack, *minWager)
			die1 := utils.RollDice() / 2

			hand := player.Hand{Cards: random.RandomCardSlice(die1), Player: &cardPlayer}

			testHand(hand)
		}
	} else {
		cards.ForAllCards(func(dealerCard1 cards.Card) {
			// for every combination of first dealer cards.Card
			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}

			cards.ForAllCards(func(dealerCard2 cards.Card) {
				game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: []cards.Card{dealerCard1, dealerCard2}, Player: &game.State.Dealer})
				game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, dealerCard1)

				// for every combination of second dealer cards.Card (Masked = true)
				dealerCard2.Masked = true
				if len(game.State.Dealer.Hands[0].Cards) == 2 {
					game.State.Dealer.Hands[0].Cards[1] = dealerCard2
				} else {
					game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, dealerCard2)
				}

				cards.ForAllCards(func(theCard1 cards.Card) {
					// for every combination of the player's first cards.Card
					hand1 := player.Hand{Cards: []cards.Card{theCard1}, Player: &player.Player{}}

					testHand(hand1)

					cards.ForAllCards(func(theCard2 cards.Card) {
						hand2 := player.Hand{Cards: []cards.Card{theCard1, theCard2}, Player: &player.Player{}}

						testHand(hand2)

						cards.ForAllCards(func(theCard3 cards.Card) {
							// for every combination of the player's third?!??! cards.Card
							hand3 := player.Hand{Cards: []cards.Card{theCard1, theCard2, theCard3}, Player: &player.Player{}}

							testHand(hand3)
						})
					})
				})
			})
		})
	}
}

func TestCanStand(t *testing.T) {
	testHand := func(hand player.Hand) {
		if !rules.CanStand(hand) && rules.CanEvenMoney(&hand) {
			t.Fatalf(`rules.CanStand(%s) = %t [fail], want match for %t (rules.CanEvenMoney == %t)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanStand(hand), rules.CanEvenMoney(&hand), true)
		}

		softValue := player.HandValue(&hand, true)

		if !rules.CanStand(hand) && softValue < 21 {
			t.Fatalf(`rules.CanStand(%s) = %t [fail], want match for %t (softValue < 21 and player != Dealer)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanStand(hand), true)
		}

		hand.Player.Dealer = true
		if !rules.CanStand(hand) && (softValue >= 17 && softValue < 21) {
			t.Fatalf(`rules.CanStand(%s) = %t [fail], want match for %t (softValue >= 17 and player == Dealer)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanStand(hand), true)
		}
		hand.Player.Dealer = false

		t.Logf(`rules.CanStand(%s) = %t [pass]`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.CanStand(hand))
	}

	if testing.Short() {
		for i := 0; i < shortSampleSize; i++ {
			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}
			game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: random.RandomCardSlice(2), Player: &game.State.Dealer})

			cardPlayer := player.CreatePlayer(*playerStartStack, *minWager)
			die1 := utils.RollDice() / 2

			hand := player.Hand{Cards: random.RandomCardSlice(die1), Player: &cardPlayer}

			testHand(hand)
		}
	} else {
		cards.ForAllCards(func(dealerCard1 cards.Card) {
			// for every combination of first dealer cards.Card
			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}

			cards.ForAllCards(func(dealerCard2 cards.Card) {
				game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: []cards.Card{dealerCard1, dealerCard2}, Player: &game.State.Dealer})
				game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, dealerCard1)

				// for every combination of second dealer cards.Card (Masked = true)
				dealerCard2.Masked = true
				if len(game.State.Dealer.Hands[0].Cards) == 2 {
					game.State.Dealer.Hands[0].Cards[1] = dealerCard2
				} else {
					game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, dealerCard2)
				}

				cards.ForAllCards(func(theCard1 cards.Card) {
					// for every combination of the player's first cards.Card
					hand1 := player.Hand{Cards: []cards.Card{theCard1}, Player: &player.Player{}}

					testHand(hand1)

					cards.ForAllCards(func(theCard2 cards.Card) {
						hand2 := player.Hand{Cards: []cards.Card{theCard1, theCard2}, Player: &player.Player{}}

						testHand(hand2)

						cards.ForAllCards(func(theCard3 cards.Card) {
							// for every combination of the player's third?!??! cards.Card
							hand3 := player.Hand{Cards: []cards.Card{theCard1, theCard2, theCard3}, Player: &player.Player{}}

							testHand(hand3)

							cards.ForAllCards(func(theCard4 cards.Card) {
								// for every combination of the player's third?!??! cards.Card
								hand4 := player.Hand{Cards: []cards.Card{theCard1, theCard2, theCard3, theCard4}, Player: &player.Player{}}

								testHand(hand4)
							})
						})
					})
				})
			})
		})
	}
}

func TestCreatePlayer(t *testing.T) {
	for i := 0; i < 100; i++ {
		cardPlayer := player.CreatePlayer(*playerStartStack, *minWager)

		if cardPlayer.Dealer {
			t.Fatalf(`cardPlayer.Dealer = %t [fail], want match for %t`, cardPlayer.Dealer, false)
		} else {
			t.Logf(`cardPlayer.Dealer = %t [pass]`, cardPlayer.Dealer)
		}

		if len(cardPlayer.Hands) != 0 {
			t.Fatalf(`len(cardPlayer.Hands) = %d [fail], want match for %d`, len(cardPlayer.Hands), 0)
		} else {
			t.Logf(`len(cardPlayer.Hands) = %d [pass]`, len(cardPlayer.Hands))
		}

		if cardPlayer.Stack < 100 || cardPlayer.Stack > 1200 {
			t.Fatalf(`cardPlayer.Stack = %d [fail], want match for >= 100 and <= 1200`, cardPlayer.Stack)
		} else {
			t.Logf(`cardPlayer.Stack = %d [pass]`, cardPlayer.Stack)
		}
	}
}

func TestDrawHand(t *testing.T) {
	testHand := func(hand player.Hand) {
		terminal.DrawHand(game.State.Dealer.Hands[0], colorTerminal)

		t.Logf(`terminal.DrawHand(%s) [exercised] (Dealer = true)`, player.HandToString(hand, *useGlyphs, colorTerminal))

		colorTerminal = true
		terminal.DrawHand(hand, colorTerminal)

		t.Logf(`terminal.DrawHand(%s) [exercised] (colorTerminal = true)`, player.HandToString(hand, *useGlyphs, colorTerminal))
		colorTerminal = false

		terminal.DrawHand(hand, colorTerminal)

		t.Logf(`terminal.DrawHand(%s) [exercised]`, player.HandToString(hand, *useGlyphs, colorTerminal))
	}

	if testing.Short() {
		for i := 0; i < shortSampleSize; i++ {
			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}
			game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: random.RandomCardSlice(2), Player: &game.State.Dealer})
			game.State.Dealer.Hands[0].Cards[1].Masked = true

			testHand(game.State.Dealer.Hands[0])

			cardPlayer := player.CreatePlayer(*playerStartStack, *minWager)
			die1 := utils.RollDice()
			if die1 == 6 {
				die1 = 5
			}

			hand := player.Hand{Cards: random.RandomCardSlice(die1), Player: &cardPlayer}

			testHand(hand)
		}
	} else {
		cards.ForAllCards(func(dealerCard1 cards.Card) {
			// for every combination of first dealer cards.Card
			game.State.Dealer = player.Player{Dealer: true, Hands: make([]player.Hand, 0)}

			cards.ForAllCards(func(dealerCard2 cards.Card) {
				game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Cards: []cards.Card{dealerCard1, dealerCard2}, Player: &game.State.Dealer})
				game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, dealerCard1)

				// for every combination of second dealer cards.Card (Masked = true)
				dealerCard2.Masked = true
				if len(game.State.Dealer.Hands[0].Cards) == 2 {
					game.State.Dealer.Hands[0].Cards[1] = dealerCard2
				} else {
					game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, dealerCard2)
				}

				cards.ForAllCards(func(theCard1 cards.Card) {
					// for every combination of the player's first cards.Card
					hand1 := player.Hand{Cards: []cards.Card{theCard1}, Player: &player.Player{}}

					testHand(hand1)

					cards.ForAllCards(func(theCard2 cards.Card) {
						hand2 := player.Hand{Cards: []cards.Card{theCard1, theCard2}, Player: &player.Player{}}

						testHand(hand2)

						cards.ForAllCards(func(theCard3 cards.Card) {
							// for every combination of the player's third?!??! cards.Card
							hand3 := player.Hand{Cards: []cards.Card{theCard1, theCard2, theCard3}, Player: &player.Player{}}

							testHand(hand3)

							cards.ForAllCards(func(theCard4 cards.Card) {
								// for every combination of the player's third?!??! cards.Card
								hand4 := player.Hand{Cards: []cards.Card{theCard1, theCard2, theCard3, theCard4}, Player: &player.Player{}}

								testHand(hand4)

								cards.ForAllCards(func(thecard5 cards.Card) {
									// for every combination of the player's third?!??! cards.Card
									hand5 := player.Hand{Cards: []cards.Card{theCard1, theCard2, theCard3, theCard4, thecard5}, Player: &player.Player{}}

									testHand(hand5)
								})
							})
						})
					})
				})
			})
		})
	}
}

func TestIsFlush(t *testing.T) {
	testHand := func(hand player.Hand) {
		if rules.IsFlush(hand) && len(hand.Cards) < 3 {
			t.Fatalf(`rules.IsFlush(%s) = %t [fail], want match for %t (len(Cards) < 3)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.IsFlush(hand), false)
		} else {
			t.Logf(`rules.IsFlush(%s) = %t [pass]`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.IsFlush(hand))
		}

		if rules.IsFlush(hand) && !suitesAreEqual(hand) {
			t.Fatalf(`rules.IsFlush(%s) = %t [fail], want match for %t (Suites do not match)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.IsFlush(hand), suitesAreEqual(hand))
		} else {
			t.Logf(`rules.IsFlush(%s) = %t [pass]`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.IsFlush(hand))
		}
	}

	cardPlayer := player.CreatePlayer(*playerStartStack, *minWager)

	if testing.Short() {
		for i := 0; i < shortSampleSize; i++ {
			die1 := utils.RollDice() / 2
			if die1 == 6 {
				die1 = 5
			}

			hand := player.Hand{Cards: random.RandomCardSlice(die1), Player: &cardPlayer}

			testHand(hand)
		}
	} else {
		cards.ForAllCards(func(card1 cards.Card) {
			hand0 := player.Hand{Cards: []cards.Card{card1}, Player: &cardPlayer}
			testHand(hand0)

			cards.ForAllCards(func(card2 cards.Card) {
				hand1 := player.Hand{Cards: []cards.Card{card1, card2}, Player: &cardPlayer}
				testHand(hand1)

				cards.ForAllCards(func(card3 cards.Card) {
					hand2 := player.Hand{Cards: []cards.Card{card1, card2, card3}, Player: &cardPlayer}
					testHand(hand2)

					cards.ForAllCards(func(card4 cards.Card) {
						hand3 := player.Hand{Cards: []cards.Card{card1, card2, card3, card4}, Player: &cardPlayer}
						testHand(hand3)

						cards.ForAllCards(func(card5 cards.Card) {
							hand4 := player.Hand{Cards: []cards.Card{card1, card2, card3, card4, card5}, Player: &cardPlayer}
							testHand(hand4)
						})
					})
				})
			})
		})
	}
}

func TestIsStraight(t *testing.T) {
	testHand := func(hand player.Hand) {
		if rules.IsStraight(hand) && len(hand.Cards) < 3 {
			t.Fatalf(`rules.IsStraight(%s) = %t [fail], want match for %t (len(Cards) < 3)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.IsStraight(hand), false)
		} else {
			t.Logf(`rules.IsStraight(%s) = %t [pass]`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.IsStraight(hand))
		}

		if rules.IsStraight(hand) && !(CardsAreOrdered(hand, false) || CardsAreOrdered(hand, true)) {
			t.Fatalf(`rules.IsStraight(%s) = %t [fail], want match for %t (Cards are not ordered)`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.IsStraight(hand), false)
		} else {
			t.Logf(`rules.IsStraight(%s) = %t [pass]`, player.HandToString(hand, *useGlyphs, colorTerminal), rules.IsStraight(hand))
		}
	}

	cardPlayer := player.CreatePlayer(*playerStartStack, *minWager)

	if testing.Short() {
		for i := 0; i < shortSampleSize; i++ {
			die1 := utils.RollDice() / 2
			if die1 == 6 {
				die1 = 5
			}

			hand := player.Hand{Cards: random.RandomCardSlice(die1), Player: &cardPlayer}

			testHand(hand)
		}
	} else {
		cards.ForAllCards(func(card1 cards.Card) {
			hand0 := player.Hand{Cards: []cards.Card{card1}, Player: &cardPlayer}
			testHand(hand0)

			cards.ForAllCards(func(card2 cards.Card) {
				hand1 := player.Hand{Cards: []cards.Card{card1, card2}, Player: &cardPlayer}
				testHand(hand1)

				cards.ForAllCards(func(card3 cards.Card) {
					hand2 := player.Hand{Cards: []cards.Card{card1, card2, card3}, Player: &cardPlayer}
					testHand(hand2)

					cards.ForAllCards(func(card4 cards.Card) {
						hand3 := player.Hand{Cards: []cards.Card{card1, card2, card3, card4}, Player: &cardPlayer}
						testHand(hand3)

						cards.ForAllCards(func(card5 cards.Card) {
							hand4 := player.Hand{Cards: []cards.Card{card1, card2, card3, card4, card5}, Player: &cardPlayer}
							testHand(hand4)
						})
					})
				})
			})
		})
	}
}
