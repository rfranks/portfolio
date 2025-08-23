//go:build !js && !wasm
// +build !js,!wasm

// How often does a bust card bust?
// We need some dials, how is the player playing???

package main

import (
	"flag"
	"io"
	"log"
	"math/rand"
	"os"
	"runtime"
	"sync"
	"time"

	"blackjack/cards"
	"blackjack/constants"
	"blackjack/dealer"
	"blackjack/flags"
	"blackjack/game"
	"blackjack/player"
	"blackjack/rules"
	"blackjack/sidebets"
	"blackjack/ui"
	"blackjack/ui/terminal"
	"blackjack/utils"
)

var onlyOnce sync.Once
var console ui.IO
var cfg flags.Config

func init() {
	onlyOnce.Do(func() {
		rand.New(rand.NewSource(time.Now().UnixNano())) // only run once
	})
	if runtime.GOOS != "js" {
		f, err := os.OpenFile("log.out", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		if err != nil {
			log.Fatalf("error opening file: %v", err)
		}
		defer f.Close()
		wrt := io.MultiWriter(os.Stdout, f)
		log.SetOutput(wrt)
	}

	if runtime.GOOS == "windows" {
		constants.Reset = ""
		constants.Red = ""
		constants.Green = ""
		constants.Yellow = ""
		constants.Blue = ""
		constants.Purple = ""
		constants.Cyan = ""
		constants.Gray = ""
		constants.White = ""
	}
}

func initBlackjack() {
	flag.Parse()
	cfg = flags.FromFlags()

	if len(flag.Args()) > 0 {
		log.Println("I am sorry, I didn't understand that.  Try -h for help?")
		if runtime.GOOS != "js" {
			os.Exit(1)
		}
		return
	}

	var err error
	console, err = terminal.New(cfg)
	if err != nil {
		log.Fatal(err)
	}

	sidebets.TrifectaProgressives = append(sidebets.TrifectaProgressives, int(rand.Float64()*15000000))
	sidebets.TrifectaProgressives = append(sidebets.TrifectaProgressives, int(rand.Float64()*5000000))
	sidebets.TrifectaProgressives = append(sidebets.TrifectaProgressives, int(rand.Float64()*2500000))
	sidebets.TrifectaProgressives = append(sidebets.TrifectaProgressives, int(rand.Float64()*100000))

	err = game.LoadBlackjackStateYaml(cfg.Clean)

	if err != nil {
		game.State = game.BlackjackState{
			House:            cfg.HouseStart,
			Wins:             0,
			Losses:           0,
			Pushes:           0,
			DealerBlackjacks: 0,
			DealerBusts:      0,
			PlayerBlackjacks: 0,
			PlayerBusts:      0,
			BustCards:        []cards.Card{},
			BustCounts:       make(map[cards.CardValue]int),
			SidebetWinnings:  0,
			SidebetLosings:   0,
			Players:          make([]player.Player, 0),
			Dealer:           player.Player{Dealer: true},
			Rounds:           0,
		}

		for _, value := range cards.CardValues {
			game.State.BustCounts[value] = 0
		}

		game.CreateShoe(cfg.NumOfDecks)
		// loadShoe()
		dealer.BurnCard()
		game.CutShoe()
	}

	if game.State.Players == nil || len(game.State.Players) == 0 {
		for i := 0; i < cfg.NumOfPlayers; i++ {
			game.State.Players = append(game.State.Players, player.CreatePlayer(cfg.PlayerStartStack, cfg.MinWager))
		}
	}

	if !game.State.Dealer.Dealer {
		game.State.Dealer = player.Player{Dealer: true}
	}

	if cfg.Autoplay {
		for i := 0; i < len(game.State.Players); i++ {
			cardPlayer := &game.State.Players[i]

			cardPlayer.PlaceWager = func() int {
				if cardPlayer.LastHandPushed {
					// if we pushed, let it ride
					return cardPlayer.LastWager
				}

				if cardPlayer.LastHandWon {
					// if we won, lets try to capitalize
					if cardPlayer.WinStreak > 6 {
						// go for the gusto!
						return cardPlayer.Stack
					} else if cardPlayer.WinStreak > 3 {
						return utils.Min(cardPlayer.Stack, (2^cardPlayer.WinStreak%3)*cfg.MinWager)
					} else {
						return cfg.MinWager
					}
				}

				return cfg.MinWager
			}

			cardPlayer.DoAction = func() (rune, error) {
				defer func() {
					if r := recover(); r != nil {
						err := r.(error)
						if err != nil {
							log.Printf("We panicked!!! Why?!?!?")
						}
					}
				}()

				activeHand := player.ActiveHand(cardPlayer)
				dealerFaceUpCard := cards.CardToValue(game.State.Dealer.Hands[0].Cards[0], true)

				return rules.GetAutoPlayPlayerAction(activeHand, dealerFaceUpCard)
			}
		}
	}
}

func main() {
	var char rune

	initBlackjack()

	if closer, ok := console.(interface{ Close() error }); ok {
		defer closer.Close()
	}

	for ok := true; ok; ok = char != 'q' {
		char, _ = dealer.DealRound(console, cfg)
	}

	if runtime.GOOS != "js" {
		os.Exit(0)
	}
}
