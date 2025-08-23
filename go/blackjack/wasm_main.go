//go:build js && wasm

package main

import (
	"log"
	"math/rand"
	"sync"
	"syscall/js"
	"time"

	"blackjack/cards"
	"blackjack/dealer"
	"blackjack/flags"
	"blackjack/game"
	"blackjack/player"
	"blackjack/rules"
	"blackjack/sidebets"
	"blackjack/ui"
	"blackjack/ui/web"
	"blackjack/utils"
)

var onlyOnce sync.Once
var console ui.IO
var cfg flags.Config

func init() {
	onlyOnce.Do(func() {
		rand.New(rand.NewSource(time.Now().UnixNano()))
	})
}

// Start initializes the game using a JavaScript configuration object and the
// Web UI. It is exported to the surrounding JS environment.
func Start(this js.Value, args []js.Value) any {
	cfg = flags.FromFlags()
	if len(args) > 0 {
		jsCfg := flags.FromJS(args[0])
		if jsCfg.NumOfDecks != 0 {
			cfg.NumOfDecks = jsCfg.NumOfDecks
		}
		if jsCfg.NumOfPlayers != 0 {
			cfg.NumOfPlayers = jsCfg.NumOfPlayers
		}
		if jsCfg.MinWager != 0 {
			cfg.MinWager = jsCfg.MinWager
		}
		if jsCfg.HouseStart != 0 {
			cfg.HouseStart = jsCfg.HouseStart
		}
		if jsCfg.PlayerStartStack != 0 {
			cfg.PlayerStartStack = jsCfg.PlayerStartStack
		}
		cfg.UseGlyphs = jsCfg.UseGlyphs
		cfg.DrawCards = jsCfg.DrawCards
		cfg.TrifectaStax = jsCfg.TrifectaStax
		cfg.Autoplay = jsCfg.Autoplay
		cfg.Clean = jsCfg.Clean
		cfg.ColorTerminal = jsCfg.ColorTerminal
	}

	console = web.New(cfg)

	sidebets.TrifectaProgressives = append(sidebets.TrifectaProgressives, int(rand.Float64()*15000000))
	sidebets.TrifectaProgressives = append(sidebets.TrifectaProgressives, int(rand.Float64()*5000000))
	sidebets.TrifectaProgressives = append(sidebets.TrifectaProgressives, int(rand.Float64()*2500000))
	sidebets.TrifectaProgressives = append(sidebets.TrifectaProgressives, int(rand.Float64()*100000))

	if err := game.LoadBlackjackStateYaml(cfg.Clean); err != nil {
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
					return cardPlayer.LastWager
				}

				if cardPlayer.LastHandWon {
					if cardPlayer.WinStreak > 6 {
						return cardPlayer.Stack
					} else if cardPlayer.WinStreak > 3 {
						return utils.Min(cardPlayer.Stack, (2^cardPlayer.WinStreak%3)*cfg.MinWager)
					}
					return cfg.MinWager
				}

				return cfg.MinWager
			}

			cardPlayer.DoAction = func() (rune, error) {
				defer func() {
					if r := recover(); r != nil {
						if err, ok := r.(error); ok && err != nil {
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

	go func() {
		if closer, ok := console.(interface{ Close() error }); ok {
			defer closer.Close()
		}
		var char rune
		for ok := true; ok; ok = char != 'q' {
			char, _ = dealer.DealRound(console, cfg)
		}
	}()

	return nil
}

func main() {
	js.Global().Set("Start", js.FuncOf(Start))
	select {}
}
