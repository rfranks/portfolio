package dealer

import (
	"blackjack/cards"
	"blackjack/flags"
	"blackjack/game"
	"blackjack/player"
	"blackjack/random"
	"blackjack/rules"
	"blackjack/sidebets"
	"blackjack/ui"
	"blackjack/ui/terminal"
	"blackjack/utils"
	"log"
	"os"
	"runtime"
)

func AskForInsurance(u ui.IO, cfg flags.Config) {
	for i := 0; i < len(game.State.Players); i++ {
		player := &game.State.Players[i]
		u.Render(ui.GameState{AskingForInsurance: true})

		HandlePlayerAction(u, player, cfg)
	}
}

func BurnCard() {
	game.State.Shoe.Index = utils.Min(game.State.Shoe.Index+1, len(game.State.Shoe.Cards)-1)
}

func DealDealer() {
	game.State.Dealer.Hands[0].Cards[1].Masked = false

	if rules.CanHit(&game.State.Dealer.Hands[0]) {
		game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, DealUnmaskedCard())
		DealDealer()
	}
}

func DealHand(cfg flags.Config) {
	// make player hands
	for i := 0; i < len(game.State.Players); i++ {
		currPlayer := &game.State.Players[i]

		currPlayer.Hands = make([]player.Hand, 0)

		if currPlayer.Stack < cfg.MinWager {
			if currPlayer.Winnings > 0 {
				currPlayer.Stack = currPlayer.Winnings
				log.Printf("Player reloaded %s\n", terminal.PrintCurrency(currPlayer.Winnings*100))
				currPlayer.Winnings = 0
			} else {
				currPlayer.Stack = cfg.PlayerStartStack
				log.Printf("Player takes credit of %s\n", terminal.PrintCurrency(currPlayer.Stack*100))
				currPlayer.Winnings -= cfg.PlayerStartStack
			}
		}

		if currPlayer.Stack >= cfg.MinWager {
			hand := player.Hand{Active: true, Cards: make([]cards.Card, 0), Player: currPlayer, Wager: cfg.MinWager}
			currPlayer.Hands = append(currPlayer.Hands, hand)

			if cfg.Autoplay {
				hand.Wager = currPlayer.PlaceWager()
				currPlayer.LastWager = hand.Wager
			}
			currPlayer.Stack -= hand.Wager

			if currPlayer.Stack > 0 {
				if currPlayer.WillPlayTrifecta == nil {
					currPlayer.WillPlayTrifecta = func(stack int) bool {
						return true
					}
				}

				if currPlayer.WillPlayTrifecta(currPlayer.Stack) {
					currPlayer.Stack -= cfg.MinWager / 2
					currPlayer.Hands[0].TrifectaWager = cfg.MinWager / 2
				}
			}
		}
	}

	// make dealer hand
	game.State.Dealer.Hands = make([]player.Hand, 0)
	game.State.Dealer.Hands = append(game.State.Dealer.Hands, player.Hand{Active: true, Cards: make([]cards.Card, 0), Player: &game.State.Dealer})

	// deal first card to players
	player.ForAllPlayers(game.State.Players, func(currPlayer *player.Player) {
		activeHand := player.ActiveHand(currPlayer)
		if activeHand != nil {
			activeHand.Cards = append(activeHand.Cards, DealUnmaskedCard())
		}
	})

	// deal first card to dealer
	game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, DealUnmaskedCard())

	// deal second card to players
	player.ForAllPlayers(game.State.Players, func(currPlayer *player.Player) {
		activeHand := player.ActiveHand(currPlayer)
		if activeHand != nil {
			activeHand.Cards = append(activeHand.Cards, DealUnmaskedCard())
		}
	})

	// deal second card to dealer
	game.State.Dealer.Hands[0].Cards = append(game.State.Dealer.Hands[0].Cards, DealMaskedCard())
}

func DealPlayers(u ui.IO, cfg flags.Config) {
	for i := 0; i < len(game.State.Players); i++ {
		player := &game.State.Players[i]
		for playerCanPlay := rules.CanPlay(*player, cfg.MinWager); playerCanPlay; playerCanPlay = rules.CanPlay(*player, cfg.MinWager) {
			u.Render(ui.GameState{})

			HandlePlayerAction(u, player, cfg)
		}
	}
}

func DealRound(u ui.IO, cfg flags.Config) (rune, error) {
	var err error
	var char rune

	game.State.Rounds += 1

	if cfg.Autoplay {
		if game.State.Rounds > 500 {
			// clearScr()
			terminal.PrintStats(cfg.TrifectaStax)
			if closer, ok := u.(interface{ Close() error }); ok {
				closer.Close()
			}
			if runtime.GOOS != "js" {
				os.Exit(0)
			}
			return 'q', nil
		}
	}

	DealHand(cfg)

	if cfg.TrifectaStax {
		// why does this fail during autoplay?
		// if !*Autoplay {
		switch game.GameMode {
		case game.JackAttack:
			sidebets.PayJackAttack()
		case game.Spanish21:
			sidebets.PaySpanish21Matches()
		case game.Trifecta:
			sidebets.PayTrifecta()
		case game.Trifecta3:
			sidebets.PayTrifecta3()
		case game.TrifectaStaxx:
			sidebets.PayTrifectaStax()
		case game.Blackjack:
		default:
			break
		}
		// }
	}

	if game.State.Dealer.Hands[0].Cards[0].Value == cards.Ace {
		switch game.GameMode {
		case game.Spanish21:
			// in Spanish21 Blackjacks are paid out first
			PayWinners(true, true, false)
		default:
			// no pre-conditions
		}

		AskForInsurance(u, cfg)

		if rules.IsBlackjack(game.State.Dealer.Hands[0]) {
			PayInsured()
		} else {
			DealPlayers(u, cfg)
		}
	} else {
		DealPlayers(u, cfg)
	}

	DealDealer()

	if !rules.CanHit(&game.State.Dealer.Hands[0]) {
		switch game.GameMode {
		case game.Spanish21:
			// payBlackjack is false, because we already paid them in Spanish21
			PayWinners(false, true, true)
		default:
			PayWinners(true, true, true)
		}

		u.Render(ui.GameState{AskingToDeal: true})

		if cfg.Autoplay {
			// if autoplay is on, automatically deal
			char, err = 'd', nil
		} else {
			char, err = u.ReadAction()
		}

		if err != nil {
			log.Fatal(err)
		}

		if char == 'w' {
			terminal.PrintStats(cfg.TrifectaStax)
			char, err = u.ReadAction()
			if err != nil {
				log.Fatal(err)
			}
		}

		game.ShuffleShoeIfNeeded()
	} else {
		u.Render(ui.GameState{})
	}

	return char, err
}

func DeclineInsurance(playerToAct *player.Player) {
	activeHand := player.ActiveHand(playerToAct)
	if activeHand != nil {
		activeHand.InsuranceWager = 0
		activeHand.Insured = true
	}
}

func DoubleDown(playerToAct *player.Player) {
	activeHand := player.ActiveHand(playerToAct)
	if activeHand != nil {
		if rules.CanDoubleDown(activeHand) {
			HitHand(activeHand, true)
			playerToAct.Stack -= activeHand.Wager
			activeHand.Wager += activeHand.Wager
		}
	}
}

func EvenMoney(playerToAct *player.Player) {
	activeHand := player.ActiveHand(playerToAct)

	if activeHand != nil {
		if rules.CanEvenMoney(activeHand) {
			activeHand.Active = false
			activeHand.Stand = true
			activeHand.EvenMoney = true

			DeclineInsurance(playerToAct)
		}
	}
}

func HandlePlayerAction(u ui.IO, playerToAct *player.Player, cfg flags.Config) {
	var char rune
	var err error

	if cfg.Autoplay {
		char, err = playerToAct.DoAction()
	} else {
		char, err = u.ReadAction()
	}

	if err != nil {
		if closer, ok := u.(interface{ Close() error }); ok {
			closer.Close()
		}
		log.Fatal(err)
	}

	switch char {
	case 'a':
		terminal.PrintAutoPlayTable()
		HandlePlayerAction(u, playerToAct, cfg)
	case 'd':
		DoubleDown(playerToAct)
	case 'e':
		EvenMoney(playerToAct)
	case 'h':
		Hit(playerToAct)
	case 'i':
		Insure(playerToAct)
	case 'n':
		DeclineInsurance(playerToAct)
	case 'p':
		SplitHand(playerToAct)
	case 'r':
		game.State.Dealer.Hands[0].Cards[1].Masked = false
	case 's':
		Stand(playerToAct)
	case 'v':
		terminal.PrintShoeDetails()
		HandlePlayerAction(u, playerToAct, cfg)
	case 'w':
		terminal.PrintStats(cfg.TrifectaStax)
		log.Printf("\n=== Bust Cards ===\n")
		terminal.PrintCards(game.State.BustCards)
		HandlePlayerAction(u, playerToAct, cfg)
	case 'x':
	case 'q':
		if closer, ok := u.(interface{ Close() error }); ok {
			closer.Close()
		}
		if runtime.GOOS != "js" {
			os.Exit(0)
		}
	default:
		break
	}

	game.SaveBlackjackStateYaml()
}

func HitHand(hand *player.Hand, doubleDown bool) {
	if rules.CanHit(hand) {
		card := DealUnmaskedCard()

		if doubleDown {
			card.DoubleDown = true
			hand.DoubleDown = true
			hand.Active = false
			hand.Stand = true
		}

		hand.Cards = append(hand.Cards, card)
	}
}

func Hit(playerToAct *player.Player) {
	activeHand := player.ActiveHand(playerToAct)
	if activeHand != nil {
		HitHand(activeHand, false)
	}
}

func Insure(playerToAct *player.Player) {
	activeHand := player.ActiveHand(playerToAct)
	if activeHand != nil {
		activeHand.Insured = true
		activeHand.InsuranceWager = activeHand.Wager / 2
		activeHand.Player.Stack -= activeHand.InsuranceWager
	}
}

func loadShoe() {
	game.State.Shoe.Cards = make([]cards.Card, 0)
	game.State.Shoe.Cards = append(game.State.Shoe.Cards, cards.ToCard("♣6"))
	game.State.Shoe.Cards = append(game.State.Shoe.Cards, cards.ToCard("♠10"))
	game.State.Shoe.Cards = append(game.State.Shoe.Cards, cards.ToCard("♣6"))
	game.State.Shoe.Cards = append(game.State.Shoe.Cards, cards.ToCard("♥A"))
	game.State.Shoe.Cards = append(game.State.Shoe.Cards, cards.ToCard("♥A"))
	game.State.Shoe.Cards = append(game.State.Shoe.Cards, cards.ToCard("♦6"))
	game.State.Shoe.Cards = append(game.State.Shoe.Cards, cards.ToCard("♥6"))
	game.State.Shoe.Cards = append(game.State.Shoe.Cards, cards.ToCard("♥3"))
	game.State.Shoe.Cards = append(game.State.Shoe.Cards, cards.ToCard("♥Q"))
	game.State.Shoe.Cards = append(game.State.Shoe.Cards, cards.ToCard("♣10"))

	for i := len(game.State.Shoe.Cards); i < len(game.State.Shoe.Decks)*52; i++ {
		game.State.Shoe.Cards = append(game.State.Shoe.Cards, random.RandomCard())
	}
}

func DealUnmaskedCard() cards.Card {
	cardToDeal := game.State.Shoe.Cards[game.State.Shoe.Index]
	cardToDeal.Masked = false
	cardToDeal.Demoted = false
	cardToDeal.DoubleDown = false

	// basic hi-lo counting
	// 2-6 = +1
	// 7-9 = 0
	// 10-Ace= -1
	if cards.CardToValue(cardToDeal, false) == 10 || cardToDeal.Value == cards.Ace || cardToDeal.Value == cards.One {
		game.State.Count -= 1
	} else if cardToDeal.Value == 2 || cardToDeal.Value == 3 || cardToDeal.Value == 4 || cardToDeal.Value == 5 || cardToDeal.Value == 6 {
		game.State.Count += 1
	} else {
		game.State.Count += 0
	}

	game.State.Shoe.Index += 1
	return cardToDeal
}

func DealMaskedCard() cards.Card {
	cardToDeal := game.State.Shoe.Cards[game.State.Shoe.Index]
	cardToDeal.Masked = true
	cardToDeal.Demoted = false
	cardToDeal.DoubleDown = false
	game.State.Shoe.Index += 1
	return cardToDeal
}

func PayInsured() {
	player.ForAllPlayers(game.State.Players, func(currPlayer *player.Player) {
		player.ForAllHands(currPlayer, func(hand *player.Hand) {
			if hand.Insured {
				hand.Player.Stack += 2 * hand.InsuranceWager
				game.State.House -= hand.InsuranceWager
			}
		})
	})

	game.SaveBlackjackStateYaml()
}

func PayWinners(payBlackjacks bool, payAllOthers bool, updateStats bool) {
	if payBlackjacks || payAllOthers {
		dealerHand := game.State.Dealer.Hands[0]
		softValue := player.HandValue(&dealerHand, true)
		hardValue := player.HandValue(&dealerHand, false)
		dealerValue := softValue

		if dealerValue != hardValue {
			if hardValue <= 21 {
				dealerValue = hardValue
			}
		}

		// update dealer stats
		if updateStats {
			if rules.IsBlackjack(game.State.Dealer.Hands[0]) {
				game.State.DealerBlackjacks += 1
			} else if dealerValue > 21 {
				game.State.DealerBusts += 1
				firstCard := cards.CreateCard(dealerHand.Cards[0].Suite, dealerHand.Cards[0].Value)
				game.State.BustCards = append(game.State.BustCards, firstCard)
				game.State.BustCounts[firstCard.Value] += 1
			}
		}

		for i := 0; i < len(game.State.Players); i++ {
			currPlayer := &game.State.Players[i]
			for j := 0; j < len(currPlayer.Hands); j++ {
				hand := &currPlayer.Hands[j]

				// if hand.Active {
				softValue := player.HandValue(hand, true)
				hardValue := player.HandValue(hand, false)
				playerValue := softValue

				if playerValue != hardValue {
					if hardValue <= 21 {
						playerValue = hardValue
					}
				}

				if playerValue > 21 {
					game.State.PlayerBusts += 1
					game.State.BustCards = append(game.State.BustCards, cards.CreateCard(hand.Cards[0].Suite, hand.Cards[0].Value))
					game.State.BustCounts[hand.Cards[0].Value] += 1
				}

				if rules.IsBlackjack(game.State.Dealer.Hands[0]) {
					if payBlackjacks {
						if hand.EvenMoney {
							// you win original bet + original bet (or 2 * hand.Wager)
							// this path shouldn't happen for Spanish21 because we don't AskForInsurance() by the dealer
							currPlayer.Stack += (2 * hand.Wager)
							game.State.House -= hand.Wager
							game.State.Wins += 1
							currPlayer.LastHandWon = true
							currPlayer.LastHandPushed = false
							currPlayer.Winnings += hand.Wager
							currPlayer.WinStreak += 1
						} else {
							game.State.House += hand.Wager
							game.State.Losses += 1
							currPlayer.LastHandWon = false
							currPlayer.LastHandPushed = false
							currPlayer.WinStreak = 0
							currPlayer.Winnings -= hand.Wager
						}
					}
				} else {
					if rules.IsBlackjack(*hand) {
						if payBlackjacks {
							// you win time and a half + orignal bet
							winnings := hand.Wager + (hand.Wager / 2.0) + hand.Wager
							currPlayer.Stack += winnings
							game.State.House -= winnings
							game.State.Wins += 1
							currPlayer.LastHandWon = true
							currPlayer.LastHandPushed = false
							currPlayer.Winnings += winnings
							game.State.PlayerBlackjacks += 1
							currPlayer.WinStreak += 1
						}
					} else if dealerValue < playerValue {
						if playerValue <= 21 {
							// you win original bet + original bet (or 2 * hand.Wager)
							currPlayer.Stack += 2 * hand.Wager
							game.State.House -= hand.Wager
							game.State.Wins += 1
							currPlayer.LastHandWon = true
							currPlayer.LastHandPushed = false
							currPlayer.Winnings += hand.Wager
							currPlayer.WinStreak += 1
						} else {
							// player busted
							currPlayer.Stack += 0
							game.State.House += hand.Wager
							game.State.Losses += 1
							currPlayer.LastHandWon = false
							currPlayer.LastHandPushed = false
							currPlayer.WinStreak = 0
							currPlayer.Winnings -= hand.Wager
						}
					} else if dealerValue > 21 {
						if payAllOthers {
							// you win original bet + original bet (or 2 * hand.Wager)
							currPlayer.Stack += 2 * hand.Wager
							game.State.House -= hand.Wager
							game.State.Wins += 1
							currPlayer.LastHandWon = true
							currPlayer.LastHandPushed = false
							currPlayer.Winnings += 2 * hand.Wager
							currPlayer.WinStreak += 1
						}
					} else if dealerValue == playerValue {
						if payAllOthers { // you win your original bet back (or hand.Wager)
							currPlayer.Stack += hand.Wager
							game.State.House -= 0
							game.State.Pushes += 1
							currPlayer.LastHandWon = false
							currPlayer.LastHandPushed = true
							currPlayer.WinStreak = 0
							currPlayer.Winnings += 0
						}
					} else {
						if payAllOthers {
							currPlayer.Stack += 0
							game.State.House += hand.Wager
							game.State.Losses += 1
							currPlayer.LastHandWon = false
							currPlayer.LastHandPushed = false
							currPlayer.WinStreak = 0
							currPlayer.Winnings -= hand.Wager
						}
					}
				}
				// }
			}
		}
	}

	game.SaveBlackjackStateYaml()
}

func SplitHand(playerToAct *player.Player) {
	activeHand := player.ActiveHand(playerToAct)

	if activeHand != nil {
		if rules.CanSplit(*activeHand) {
			activeHand.Split = true
			newHand := player.Hand{Active: true, Cards: make([]cards.Card, 0), Player: playerToAct, Split: true, Wager: activeHand.Wager}
			playerToAct.Stack -= newHand.Wager

			newHand.Cards = append(newHand.Cards, activeHand.Cards[1])

			// repromote the aces
			activeHand.Cards[0].Demoted = false
			newHand.Cards[0].Demoted = false

			activeHand.Cards[1] = DealUnmaskedCard()
			newHand.Cards = append(newHand.Cards, DealUnmaskedCard())

			playerToAct.Hands = append(playerToAct.Hands, newHand)
		}
	}
}

func Stand(playerToAct *player.Player) {
	activeHand := player.ActiveHand(playerToAct)
	if activeHand != nil {
		activeHand.Active = false
		activeHand.Stand = true
	}
}
