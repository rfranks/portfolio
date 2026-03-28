//go:build js && wasm

package web

import (
	"blackjack/flags"
	"blackjack/game"
	"blackjack/player"
	"blackjack/rules"
	"blackjack/ui"
	"encoding/json"
	"errors"
	"fmt"
	"syscall/js"
)

type WebUI struct {
	actionCh            chan rune
	messageFn           js.Func
	cfg                 flags.Config
	lastWinnings        int
	lastSidebetWinnings int
	lastSidebetLosses   int
}

func New(cfg flags.Config) *WebUI {
	w := &WebUI{
		actionCh:     make(chan rune),
		cfg:          cfg,
		lastWinnings: 0,
	}
	w.bindMessageBus()
	return w
}

func (w *WebUI) bindMessageBus() {
	w.messageFn = js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) == 0 {
			return nil
		}

		event := args[0]
		origin := event.Get("origin")
		if origin.Truthy() && origin.String() != js.Global().Get("location").Get("origin").String() {
			return nil
		}

		data := event.Get("data")
		if !data.Truthy() || data.Type() != js.TypeObject {
			return nil
		}

		switch data.Get("type").String() {
		case "blackjack/start":
			w.actionCh <- 'd'
		case "blackjack/toggle-game-mode":
			if w.canToggleGameMode() {
				w.toggleGameMode()
				w.postStateMessage(ui.GameState{AskingToDeal: true})
			}
		case "blackjack/action":
			switch data.Get("action").String() {
			case "hit":
				w.actionCh <- 'h'
			case "stand":
				w.actionCh <- 's'
			case "double", "deal":
				w.actionCh <- 'd'
			case "split":
				w.actionCh <- 'p'
			case "insure":
				w.actionCh <- 'i'
			case "decline":
				w.actionCh <- 'n'
			}
		}

		return nil
	})

	js.Global().Call("addEventListener", "message", w.messageFn)
}

func (w *WebUI) canToggleGameMode() bool {
	if len(game.State.Dealer.Hands) == 0 {
		return true
	}

	return !rules.CanHit(&game.State.Dealer.Hands[0])
}

func (w *WebUI) toggleGameMode() {
	switch game.GameMode {
	case game.Blackjack:
		game.GameMode = game.JackAttack
	case game.JackAttack:
		game.GameMode = game.Trifecta
	case game.Trifecta:
		game.GameMode = game.Trifecta3
	case game.Trifecta3:
		game.GameMode = game.TrifectaStaxx
	case game.TrifectaStaxx:
		game.GameMode = game.Spanish21
	case game.Spanish21:
		game.GameMode = game.Blackjack
	default:
		game.GameMode = game.Blackjack
	}

	game.State.Count = 0
	game.State.Dealer.Hands = nil
	game.CreateShoe(w.cfg.NumOfDecks)
	game.CutShoe()
	if len(game.State.Shoe.Cards) > 0 {
		game.State.Shoe.Index = 1
	}
	for i := 0; i < len(game.State.Players); i++ {
		game.State.Players[i].Hands = nil
	}
	game.SaveBlackjackStateYaml()
}

func (w *WebUI) ReadAction() (rune, error) {
	r, ok := <-w.actionCh
	if !ok {
		return 0, errors.New("action channel closed")
	}
	return r, nil
}

func (w *WebUI) Render(state ui.GameState) {
	w.postStateMessage(state)

	if !state.AskingToDeal {
		if len(game.State.Players) > 0 {
			w.lastWinnings = game.State.Players[0].Winnings
		}
		w.lastSidebetWinnings = game.State.SidebetWinnings
		w.lastSidebetLosses = game.State.SidebetLosses
	}
}

func (w *WebUI) Close() error {
	if w.messageFn.Truthy() {
		js.Global().Call("removeEventListener", "message", w.messageFn)
		w.messageFn.Release()
	}
	close(w.actionCh)
	return nil
}

func (w *WebUI) postStateMessage(state ui.GameState) {
	payload := BlackjackStateMessage{
		Type:  "blackjack/state",
		State: w.buildRenderState(state),
	}

	encoded, err := json.Marshal(payload)
	if err != nil {
		return
	}

	messageObject := js.Global().Get("JSON").Call("parse", string(encoded))
	js.Global().Call("postMessage", messageObject, js.Global().Get("location").Get("origin"))
}

func playerTotalString(hand *player.Hand) string {
	soft := player.HandValue(hand, true)
	hard := player.HandValue(hand, false)
	totalStr := fmt.Sprintf("Total: %d", hard)
	if soft != hard && rules.CanHit(hand) {
		totalStr = fmt.Sprintf("Total: %d/%d", soft, hard)
	}
	return totalStr
}

func handIsBusted(hand player.Hand) bool {
	if hand.Busted {
		return true
	}
	hard := player.HandValue(&hand, false)
	return hard > 21
}

func handOutcomeLabel(hand *player.Hand) string {
	if len(game.State.Dealer.Hands) == 0 {
		if handIsBusted(*hand) {
			return "Busted!"
		}
		return ""
	}

	dealerHand := &game.State.Dealer.Hands[0]
	if handIsBusted(*hand) {
		return "Busted!"
	}

	if rules.CanHit(dealerHand) {
		return ""
	}

	if rules.IsBlackjack(*dealerHand) && !hand.Insured {
		if rules.IsBlackjack(*hand) {
			return "Push!"
		}
		return "Loss!"
	}

	playerValue := player.HandValue(hand, false)
	dealerValue := player.HandValue(dealerHand, false)

	switch {
	case rules.IsBlackjack(*hand):
		return "Blackjack!"
	case playerValue < dealerValue:
		if dealerHand.Busted {
			return "Won!"
		}
		return "Loss!"
	case playerValue == dealerValue:
		if dealerHand.Busted {
			return "Won!"
		}
		return "Push!"
	default:
		return "Won!"
	}
}

func PrintCurrency(value int) string {
	result := ""
	isNegative := false
	if value < 0 {
		value = value * -1
		isNegative = true
	}
	result = fmt.Sprintf(".%02d%s", value%100, result)
	value /= 100
	for value >= 1000 {
		result = fmt.Sprintf(",%03d%s", value%1000, result)
		value /= 1000
	}
	if isNegative {
		return fmt.Sprintf("-$%d%s", value, result)
	}
	return fmt.Sprintf("+$%d%s", value, result)
}

func printAutoplayString(chr rune) string {
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
		return ""
	}
}
