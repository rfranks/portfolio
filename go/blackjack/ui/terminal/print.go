//go:build !js && !wasm
// +build !js,!wasm

package terminal

import (
	"blackjack/cards"
	"blackjack/constants"
	"blackjack/flags"
	"blackjack/game"
	"blackjack/player"
	"blackjack/rules"
	"blackjack/sidebets"
	"blackjack/utils"
	"fmt"
	"unicode"
)

func ClearScr() {
	fmt.Printf("\x1bc")
	fmt.Printf("\033[2J")
}

func DrawHand(hand player.Hand, colorTerminal bool) {
	for i := 0; i < len(hand.Cards); i++ {
		fmt.Printf("╭────────╮   ")
	}
	fmt.Println()

	for i := 0; i < len(hand.Cards); i++ {
		card := hand.Cards[i]
		suiteStr := cards.SuiteToString[card.Suite]
		if colorTerminal {
			suiteStr = cards.SuiteToColorString[card.Suite]
		}

		if card.Masked {
			fmt.Printf("│░░░░░░░░│   ")
		} else {
			if card.Value == cards.Ten {
				fmt.Printf("│%s%s     │   ", suiteStr, cards.CardValueToString[card.Value])
			} else {
				fmt.Printf("│%s%s      │   ", suiteStr, cards.CardValueToString[card.Value])
			}
		}
	}
	fmt.Println()

	for j := 0; j < 3; j++ {
		for i := 0; i < len(hand.Cards); i++ {
			if hand.Cards[i].Masked {
				fmt.Printf("│░░░░░░░░│   ")
			} else {
				fmt.Printf("│        │   ")
			}
		}
		fmt.Println()
	}

	for i := 0; i < len(hand.Cards); i++ {
		card := hand.Cards[i]

		suiteStr := cards.SuiteToString[card.Suite]
		if colorTerminal {
			suiteStr = cards.SuiteToColorString[card.Suite]
		}

		if card.Masked {
			fmt.Printf("│░░░░░░░░│   ")
		} else {
			if card.Value == cards.Ten {
				fmt.Printf("│     %s%s│   ", cards.CardValueToString[card.Value], suiteStr)
			} else {
				fmt.Printf("│      %s%s│   ", cards.CardValueToString[card.Value], suiteStr)
			}
		}
	}
	fmt.Println()

	for i := 0; i < len(hand.Cards); i++ {
		fmt.Printf("╰────────╯   ")
	}
	fmt.Println()
}

func PrintAutoplayString(chr rune) string {
	switch chr {
	case 'h':
		return "HIT"
	case 's':
		return "STAND"
	case 'd':
		return "DOUBLE DOWN"
	case 'p':
		return "SPLIT"
	default:
		return "?????"
	}
}

func PrintAutoPlayTable() {
	fmt.Println(" AUTOPLAY TABLE")
	fmt.Println("=============================================================================")
	fmt.Print("Dealer ==> ")
	cards.ForAllCardValues(func(card cards.Card) {
		if card.Value != 1 {
			fmt.Printf(" %s ", cards.CardValueToString[card.Value])
		}
	})
	fmt.Println()
	fmt.Println("=============================================================================")
	cards.ForAllCardValues(func(firstCard cards.Card) {
		cards.ForAllCardValues(func(secondCard cards.Card) {
			if firstCard.Value != 1 && secondCard.Value != 1 {
				fmt.Printf("%s,%s\t   ", cards.CardValueToString[firstCard.Value], cards.CardValueToString[secondCard.Value])
				cards.ForAllCardValues(func(dealerCard cards.Card) {
					if dealerCard.Value != 1 {
						hand := player.Hand{Active: true, Cards: make([]cards.Card, 0)}
						hand.Cards = append(hand.Cards, firstCard)
						hand.Cards = append(hand.Cards, secondCard)
						hand.Player = &game.State.Players[0]
						char, err := rules.GetAutoPlayPlayerAction(&hand, cards.CardToValue(dealerCard, true))
						if err != nil {
							panic(err)
						} else {
							switch char {
							case 'h':
								fmt.Print(constants.Red)
							case 's':
								fmt.Print(constants.Green)
							case 'd':
								fmt.Print(constants.Yellow)
							case 'p':
								fmt.Print(constants.Cyan)
							}
							fmt.Printf("░%c░", unicode.ToUpper(char))
							fmt.Print(constants.Reset)
						}
					}
				})
				fmt.Println()
			}
		})
	})
}

func PrintCards(cards []cards.Card) {
	if len(cards) > 0 {
		fmt.Println("==")
	}

	for i := 0; i < len(cards); i++ {
		card := cards[i]
		PrintCard(card)
		fmt.Println()
	}

	if len(cards) > 0 {
		fmt.Println("==")
	}
}

func PrintCurrency(value int) string {
	var result string
	var isNegative bool

	if value < 0 {
		value = value * -1
		isNegative = true
	}

	// apply the decimal separator
	result = fmt.Sprintf("%s%02d%s", ".", value%100, result)
	value /= 100

	// for each 3 dígits put a dot "."
	for value >= 1000 {
		result = fmt.Sprintf("%s%03d%s", ",", value%1000, result)
		value /= 1000
	}

	if isNegative {
		return fmt.Sprintf("$-%d%s", value, result)
	}

	return fmt.Sprintf("$%d%s", value, result)
}

func PrintCard(card cards.Card) {
	fmt.Print(cards.CardToString(card, true, false, false))
}

func PrintDoubleDownString(hand player.Hand) string {
	if rules.CanDoubleDown(&hand) {
		return fmt.Sprintf("%sd%souble down?        ", constants.UnderlineOn, constants.UnderlineOff)
	}
	return ""
}

func PrintEvenMoneyString(hand player.Hand) string {
	if rules.CanEvenMoney(&hand) {
		return fmt.Sprintf("%se%sven money?        ", constants.UnderlineOn, constants.UnderlineOff)
	}
	return ""
}

func PrintGameString(trifectaStax bool) string {
	if trifectaStax {
		// why does this fail during autoplay?
		// if !*Autoplay {
		switch game.GameMode {
		case game.JackAttack:
			return "JackAttack"
		case game.Spanish21:
			return "Spanish21"
		case game.Trifecta:
			return "Trifecta"
		case game.Trifecta3:
			return "Trifecta3"
		case game.TrifectaStaxx:
			return "TrifectaStaxx"
		case game.Blackjack:
		default:
			return ""
		}
		// }
	}

	return ""
}

func PrintHitString(hand player.Hand) string {
	if rules.CanHit(&hand) {
		return fmt.Sprintf("%sh%sit?        ", constants.UnderlineOn, constants.UnderlineOff)
	}
	return ""
}

func PrintInsuranceString(hand player.Hand) string {
	if rules.CanInsurance(&hand) {
		return fmt.Sprintf("%si%snsurance?        %sn%so thanks!\t", constants.UnderlineOn, constants.UnderlineOff, constants.UnderlineOn, constants.UnderlineOff)
	}
	return ""
}

func PrintSplitString(hand player.Hand) string {
	if rules.CanSplit(hand) {
		return fmt.Sprintf("s%sp%slit?        ", constants.UnderlineOn, constants.UnderlineOff)
	}
	return ""
}

func PrintShoe(shoe game.Shoe) {
	cards := shoe.Cards

	if len(cards) > 0 {
		fmt.Println("==")
	}

	for i := 0; i < len(cards); i++ {
		card := cards[i]
		PrintCard(card)
		if i == shoe.Index {
			fmt.Printf("%s%s%s%s%s%s%s%s", "<", "=", "=", "n", "ex", "t", " ", "card")
		}
		if i == shoe.Cut {
			fmt.Printf("%s%s%s%s%s%s%s%s", "<", "=", "=", "c", "u", "t", " ", "card")
		}
		fmt.Println()
	}

	if len(cards) > 0 {
		fmt.Println("==")
	}
}

func PrintStandString(hand player.Hand) string {
	if rules.CanStand(hand) {
		return fmt.Sprintf("%ss%stand?        ", constants.UnderlineOn, constants.UnderlineOff)
	}
	return ""
}

func PrintStats(trifectaStax bool) {
	state := game.State
	hands := state.Wins + state.Losses + state.Pushes
	winPct := float32(game.State.Wins) / float32(utils.Max(hands-state.Pushes, 1)) * 100
	fmt.Printf(constants.BoldOn+"Round #%d"+constants.BoldOff+"\n\n   Wins | Losses | Pushes\n"+constants.Reset+"     %d | %d | %d\n\n   Hands: %d   Win Pct: %.2f%%\n", state.Rounds, state.Wins, state.Losses, state.Pushes, hands, winPct)
	if trifectaStax {
		fmt.Printf("   %s Earnings:  %s\n", PrintGameString(trifectaStax), PrintCurrency((game.State.SidebetWinnings-state.SidebetLosings)*100))
	}

	totalNet := 0
	for i := 0; i < len(game.State.Players); i++ {
		player := state.Players[i]
		totalNet += player.Winnings + player.Stack
	}

	if totalNet > 0 {
		fmt.Printf(constants.Green+"   Total Winnings:  %s\n"+constants.Reset, PrintCurrency(totalNet*100))
	} else {
		fmt.Printf(constants.Red+"   Total Losses:  %s\n"+constants.Reset, PrintCurrency(totalNet*100))
	}

	fmt.Printf(constants.UnderlineOn+"\n    Dealer    "+constants.UnderlineOff+"\n   Blackjacks: %d   Busts:  %d   Bust %%: %.2f%%  Blackjack %%: %.2f%%\n", state.DealerBlackjacks, state.DealerBusts, float32(game.State.DealerBusts)/float32(game.State.Rounds)*100, float32(game.State.DealerBlackjacks)/float32(game.State.Rounds)*100)
	fmt.Printf(constants.UnderlineOn+"\n    Player    "+constants.UnderlineOff+"\n   Blackjacks: %d   Busts:  %d   Bust %%: %.2f%%  Blackjack %%: %.2f%%\n", state.PlayerBlackjacks, state.PlayerBusts, float32(game.State.PlayerBusts)/float32(hands)*100, float32(game.State.PlayerBlackjacks)/float32(hands)*100)
	fmt.Printf("\nDecks: %d Cards: %d Index: %d Cut: %d Penetration: %.2f%%\n", len(state.Shoe.Decks), len(state.Shoe.Cards), state.Shoe.Index, state.Shoe.Cut, float32(state.Shoe.Index)/float32(len(state.Shoe.Cards))*100)

	fmt.Printf("\n" + constants.UnderlineOn + "=== Bust Heuristics ===" + constants.UnderlineOff + "\n")
	for _, value := range cards.CardValues {
		switch value {
		case cards.Two, cards.Three, cards.Four, cards.Five, cards.Six, cards.Seven, cards.Eight, cards.Nine, cards.Jack, cards.Queen, cards.King, cards.Ace:
			fmt.Printf(" %s ", cards.CardValueToString[value])
		case cards.Ten:
			fmt.Printf("%s ", cards.CardValueToString[value])
		}

		if value != cards.One {
			for i := 0; i < state.BustCounts[value]; i++ {
				fmt.Printf("░")
			}

			fmt.Printf(" (%d)\n", state.BustCounts[value])
		}
	}
}

func PrintWinnerLoserString(hand *player.Hand) string {
	var dealer bool
	dealerHand := &game.State.Dealer.Hands[0]

	// what is causing this? @#!$#!#$@
	if hand.Player == nil {
		dealer = false
	} else {
		dealer = rules.IsDealer(*hand.Player)
	}

	if rules.CanHit(dealerHand) || rules.IsBlackjack(*dealerHand) && !hand.Insured {
		return ""
	} else {
		if hand.Busted {
			return constants.Red + "LOSER!" + constants.Reset
		} else if rules.IsBlackjack(*hand) {
			return constants.Green + "WINNER!" + constants.Reset
		} else if player.HandValue(hand, false) < player.HandValue(dealerHand, false) {
			if dealerHand.Busted && !dealer {
				return constants.Green + "WINNER!" + constants.Reset
			} else {
				return constants.Red + "LOSER!" + constants.Reset
			}
		} else if player.HandValue(hand, false) == player.HandValue(dealerHand, false) {
			if dealerHand.Busted {
				if dealer {
					return constants.Red + "LOSER!" + constants.Reset
				} else {
					return constants.Green + "WINNER!" + constants.Reset
				}
			} else {
				if !dealerHand.Busted && dealer {
					return ""
				} else {
					return constants.Cyan + "PUSH!" + constants.Reset
				}
			}
		} else {
			return constants.Green + "WINNER!" + constants.Reset
		}
	}
}

func PrintGame(cfg flags.Config, askingForInsurance bool, askingToDeal bool) {
	ClearScr()

	if cfg.TrifectaStax { // && gameMode == TrifectaStax {
		fmt.Println("=============================================================================")
		fmt.Println("                              PROGRESSIVES")
		fmt.Println("=============================================================================")
		fmt.Printf(constants.Yellow+"     %s"+constants.Blue+"         %s"+constants.Purple+"         %s"+constants.Cyan+"         %s\n"+constants.Reset, PrintCurrency(sidebets.TrifectaProgressives[0]), PrintCurrency(sidebets.TrifectaProgressives[1]), PrintCurrency(sidebets.TrifectaProgressives[2]), PrintCurrency(sidebets.TrifectaProgressives[3]))
	}
	fmt.Println("=============================================================================")
	fmt.Printf("Dealer:   House: %d\tCount: %d\n", game.State.House, game.State.Count)
	PrintHand(game.State.Dealer.Hands[0], cfg)

	actionsPrinted := false
	autoplayHintPrinted := false

	for i := 0; i < len(game.State.Players); i++ {
		cardPlayer := game.State.Players[i]
		isActivePlayer := !actionsPrinted && rules.CanPlay(cardPlayer, cfg.MinWager)

		if isActivePlayer {
			fmt.Print(constants.BoldOn + constants.White)
		}

		fmt.Println("=============================================================================")
		fmt.Printf("Player %d:\t"+constants.Green+fmt.Sprintf("Stack: $%d", cardPlayer.Stack)+constants.Reset, i+1)
		if !isActivePlayer {
			fmt.Print(constants.BoldOn + constants.White)
		}
		if cardPlayer.Winnings >= 0 {
			fmt.Printf(constants.Green + "\t+" + PrintCurrency(cardPlayer.Winnings*100) + constants.Reset)
		} else {
			fmt.Printf(constants.Red + "\t" + PrintCurrency(cardPlayer.Winnings*100) + constants.Reset)
		}

		fmt.Println()

		for i := 0; i < len(cardPlayer.Hands); i++ {
			hand := cardPlayer.Hands[i]
			if isActivePlayer {
				fmt.Print(constants.BoldOn + constants.White)
			}
			fmt.Printf("Hand %d:   Wager: $%d   ", i+1, hand.Wager)
			if hand.TrifectaWager > 0 {
				fmt.Printf(constants.Purple+"Trifecta Wager: $%d"+constants.Reset, hand.TrifectaWager)
			}
			fmt.Println()

			if isActivePlayer {
				fmt.Print(constants.BoldOn + constants.White)
			}

			PrintHand(hand, cfg)

			if i == 0 {
				fmt.Println(PrintSidebetsOutcome(hand))
			}

			if isActivePlayer {
				fmt.Print(constants.BoldOn + constants.White)
			}

			if askingForInsurance && !hand.Insured && !actionsPrinted {
				if rules.CanEvenMoney(&hand) {
					fmt.Printf("   %s%s   \n", PrintEvenMoneyString(hand), PrintStandString(hand))
				} else if rules.CanInsurance(&hand) {
					fmt.Printf("   %s   \n", PrintInsuranceString(hand))
				}
				actionsPrinted = true
			} else if !askingForInsurance && !hand.Busted && hand.Active && rules.CanPlay(*hand.Player, cfg.MinWager) && !actionsPrinted {
				if rules.CanEvenMoney(&hand) {
					fmt.Printf("   %s%s   \n", PrintEvenMoneyString(hand), PrintStandString(hand))
				} else if rules.CanInsurance(&hand) {
					fmt.Printf("   %s   \n", PrintInsuranceString(hand))
				} else {
					fmt.Printf("   %s%s%s%s   \n", PrintSplitString(hand), PrintHitString(hand), PrintStandString(hand), PrintDoubleDownString(hand))
				}
				actionsPrinted = true
			}

			if !autoplayHintPrinted {
				if rules.CanPlay(cardPlayer, cfg.MinWager) {
					chr, err := rules.GetAutoPlayPlayerAction(&hand, cards.CardToValue(game.State.Dealer.Hands[0].Cards[0], true))
					if err != nil {
						panic(err)
					}
					fmt.Printf(constants.Cyan+"\nHint: Autoplay says you should %s!\n"+constants.Reset, PrintAutoplayString(chr))
					switch chr {
					case 'h':
						fmt.Println(constants.Yellow + "Your hand is somewhat weak. You should hit to try and improve your position." + constants.Reset)
						if hand.Cards[0].Value == hand.Cards[1].Value {
							fmt.Println(constants.Yellow + "You have a pair but splitting it here could be risky." + constants.Reset)
						}
					case 's':
						if player.HandValue(&hand, false) >= 17 {
							fmt.Println(constants.Green + "Your hand is strong. You should stand." + constants.Reset)
						} else {
							fmt.Println(constants.Yellow + "The dealer is weak and may bust. You should stand." + constants.Reset)
						}
						if hand.Cards[0].Value == hand.Cards[1].Value {
							fmt.Println(constants.Yellow + "You have a pair but splitting it here could be risky and weaken your hand." + constants.Reset)
						}
					case 'd':
						fmt.Println(constants.Cyan + "Odds are in your favor. You should double down." + constants.Reset)
					case 'p':
						fmt.Println(constants.Cyan + "You have a pair in a favorable position. You should split." + constants.Reset)
					}

					autoplayHintPrinted = true
				}
			}

			if isActivePlayer {
				fmt.Print(constants.Reset)
			}
		}
	}

	fmt.Println("=============================================================================")

	if askingToDeal {
		fmt.Printf("%s%s   DEAL?\t%sd%seal / %sq%suit %s\n", constants.BoldOn, constants.White, constants.UnderlineOn, constants.UnderlineOff, constants.UnderlineOn, constants.UnderlineOff, constants.Reset)
	}
}

func PrintHand(hand player.Hand, cfg flags.Config) {
	if cfg.DrawCards {
		DrawHand(hand, cfg.ColorTerminal)
	} else {
		for i := 0; i < len(hand.Cards); i++ {
			fmt.Printf("%s   ", cards.CardToString(hand.Cards[i], true, cfg.UseGlyphs, cfg.ColorTerminal))
		}
	}

	softValue := player.HandValue(&hand, true)
	hardValue := player.HandValue(&hand, false)
	if softValue != hardValue && rules.CanHit(&hand) && !rules.IsBlackjack(hand) {
		fmt.Printf("Total: %d/%d   %s   ", softValue, hardValue, PrintWinnerLoserString(&hand))
	} else {
		fmt.Printf("Total: %d   %s   ", hardValue, PrintWinnerLoserString(&hand))
	}

	if rules.IsBlackjack(hand) && !rules.CanEvenMoney(&hand) && !hand.EvenMoney {
		fmt.Printf("Blackjack!   ")
	} else if hardValue > 21 {
		hand.Busted = true
		fmt.Printf("BUSTED!   ")
	}

	fmt.Println()
}

func PrintShoeDetails() {
	fmt.Printf("Decks: %d   Cards: %d   Index: %d   Cut: %d\n", len(game.State.Shoe.Decks), len(game.State.Shoe.Cards), game.State.Shoe.Index, game.State.Shoe.Cut)
	PrintShoe(game.State.Shoe)
}

func PrintSidebetsOutcome(hand player.Hand) string {
	switch game.GameMode {
	case game.Spanish21:
		firstCard := hand.Cards[0]
		secondCard := hand.Cards[1]

		outcome := constants.Purple
		dealerUpCard := sidebets.DealerUpCard()
		dealerDownCard := sidebets.DealerDownCard()

		if firstCard.Value == dealerUpCard.Value {
			if sidebets.CardsMatchSuite(firstCard, dealerUpCard) {
				outcome += fmt.Sprintf("First Card Matches Up Card, Matches Suite! %d to 1 WINNER!", sidebets.Spanish21MatchSuitMultiplier)
			} else {
				outcome += fmt.Sprintf("First Card Matches Up Card! %d to 1 WINNER!", sidebets.Spanish21MatchUnsuitedMultiplier)
			}
		}

		if secondCard.Value == dealerUpCard.Value {
			if sidebets.CardsMatchSuite(secondCard, dealerUpCard) {
				outcome += fmt.Sprintf("Second Card Matches Up Card, Matches Suite! %d to 1 WINNER!", sidebets.Spanish21MatchSuitMultiplier)
			} else {
				outcome += fmt.Sprintf("Second Card Matches Up Card! %d to 1 WINNER!", sidebets.Spanish21MatchUnsuitedMultiplier)
			}
		}

		if !dealerDownCard.Masked {
			if firstCard.Value == dealerDownCard.Value {
				if sidebets.CardsMatchSuite(firstCard, dealerDownCard) {
					outcome += fmt.Sprintf("First Card Matches Down Card, Matches Suite! %d to 1 WINNER!", sidebets.Spanish21MatchSuitMultiplier)
				} else {
					outcome += fmt.Sprintf("First Card Matches Down Card! %d to 1 WINNER!", sidebets.Spanish21MatchUnsuitedMultiplier)
				}
			}

			if secondCard.Value == dealerDownCard.Value {
				if sidebets.CardsMatchSuite(secondCard, dealerDownCard) {
					outcome += fmt.Sprintf("Second Card Matches Down Card, Matches Suite! %d to 1 WINNER!", sidebets.Spanish21MatchSuitMultiplier)
				} else {
					outcome += fmt.Sprintf("Second Card Matches Down Card! %d to 1 WINNER!", sidebets.Spanish21MatchUnsuitedMultiplier)
				}
			}
		}

		winnings := sidebets.GetSpanish21Winnings(hand)
		if winnings > 0 && !dealerDownCard.Masked {
			outcome += fmt.Sprintf("\t$%d", winnings)
		}

		outcome += constants.Reset

		return outcome
	case game.TrifectaStaxx:
		if hand.TrifectaWager > 0 && hand.TrifectaWinnings > 0 {
			outcome := constants.Purple

			if sidebets.IsTrifectaTripAces(hand, true) || sidebets.IsTrifectaTripAces(hand, false) || sidebets.IsTrifectaTriplet(hand, cards.King, false) || sidebets.IsTrifectaTriplet(hand, cards.Queen, false) {
				outcome += "Trifecta PROGRESSIVE!"
			} else if sidebets.IsTrifectaStraightFlush(hand) {
				outcome += "Trifecta STRAIGHT FLUSH!"
			} else if sidebets.IsTrifectaTrips(hand, false) {
				outcome += "Trifecta TRIPS!"
			} else if sidebets.IsTrifectaFlush(hand) {
				outcome += "Trifecta FLUSH!"
			} else if sidebets.IsTrifectaStraight(hand) {
				outcome += "Trifecta STRAIGHT!"
			}

			if hand.TrifectaWinnings > 0 {
				outcome += outcome + "\t" + PrintCurrency(hand.TrifectaWinnings)
			}

			outcome += constants.Reset

			return outcome
		}

		return ""
	case game.Blackjack:
	default:
		return ""
	}

	return ""
}
