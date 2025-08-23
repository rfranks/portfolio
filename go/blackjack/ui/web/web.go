//go:build js && wasm

package web

import (
	"blackjack/cards"
	"blackjack/flags"
	"blackjack/game"
	"blackjack/player"
	"blackjack/rules"
	"blackjack/sidebets"
	"blackjack/ui"
	"errors"
	"fmt"
	"syscall/js"
)

type WebUI struct {
	actionCh chan rune
	handlers []handler
	cfg      flags.Config
}

type handler struct {
	el js.Value
	fn js.Func
}

func New(cfg flags.Config) *WebUI {
	w := &WebUI{
		actionCh: make(chan rune),
		handlers: make([]handler, 0),
		cfg:      cfg,
	}
	// bind action buttons to dispatch runes
	w.bind("hit", 'h')
	w.bind("stand", 's')
	w.bind("double", 'd')
	w.bind("split", 'p')
	w.bind("deal", 'd')
	w.bind("insure", 'i')
	w.bind("decline", 'n')
	return w
}

func (w *WebUI) bind(id string, r rune) {
	doc := js.Global().Get("document")
	el := doc.Call("getElementById", id)
	if !el.Truthy() {
		return
	}
	cb := js.FuncOf(func(this js.Value, args []js.Value) any {
		w.actionCh <- r
		return nil
	})
	el.Call("addEventListener", "click", cb)
	w.handlers = append(w.handlers, handler{el: el, fn: cb})
}

func (w *WebUI) ReadAction() (rune, error) {
	r, ok := <-w.actionCh
	if !ok {
		return 0, errors.New("action channel closed")
	}
	return r, nil
}

func (w *WebUI) Render(state ui.GameState) {
	doc := js.Global().Get("document")

	// toggle insurance buttons
	insureDisplay := "none"
	if state.AskingForInsurance {
		insureDisplay = "inline"
	}
	if el := doc.Call("getElementById", "insure"); el.Truthy() {
		el.Get("style").Set("display", insureDisplay)
	}
	if el := doc.Call("getElementById", "decline"); el.Truthy() {
		el.Get("style").Set("display", insureDisplay)
	}

	// toggle deal button
	dealDisplay := "none"
	if state.AskingToDeal {
		dealDisplay = "inline"
	}
	if el := doc.Call("getElementById", "deal"); el.Truthy() {
		el.Get("style").Set("display", dealDisplay)
	}

	// toggle player action buttons
	hitDisplay := "none"
	standDisplay := "none"
	doubleDisplay := "none"
	splitDisplay := "none"
	if len(game.State.Players) > 0 && len(game.State.Players[0].Hands) > 0 {
		p := game.State.Players[0]
		hand := p.Hands[0]
		if rules.CanPlay(p, w.cfg.MinWager) && !state.AskingForInsurance && !state.AskingToDeal {
			if rules.CanHit(&hand) {
				hitDisplay = "inline"
			}
			if rules.CanStand(hand) {
				standDisplay = "inline"
			}
			if rules.CanDoubleDown(&hand) {
				doubleDisplay = "inline"
			}
			if rules.CanSplit(hand) {
				splitDisplay = "inline"
			}
		}
	}
	if el := doc.Call("getElementById", "hit"); el.Truthy() {
		el.Get("style").Set("display", hitDisplay)
	}
	if el := doc.Call("getElementById", "stand"); el.Truthy() {
		el.Get("style").Set("display", standDisplay)
	}
	if el := doc.Call("getElementById", "double"); el.Truthy() {
		el.Get("style").Set("display", doubleDisplay)
	}
	if el := doc.Call("getElementById", "split"); el.Truthy() {
		el.Get("style").Set("display", splitDisplay)
	}

	// update dealer cards
	if el := doc.Call("getElementById", "dealer-cards"); el.Truthy() {
		html := ""
		if len(game.State.Dealer.Hands) > 0 {
			for _, c := range game.State.Dealer.Hands[0].Cards {
				src := cardToImage(c)
				html += "<img class=\"card\" src=\"" + src + "\" />"
			}
		}
		el.Set("innerHTML", html)
	}
	if el := doc.Call("getElementById", "dealer-total"); el.Truthy() {
		total := 0
		if len(game.State.Dealer.Hands) > 0 {
			hand := game.State.Dealer.Hands[0]
			total = player.HandValue(&hand, false)
		}
		el.Set("innerText", fmt.Sprintf("Total: %d", total))
	}

	// update player cards (first player, first hand)
	if el := doc.Call("getElementById", "player-cards"); el.Truthy() {
		html := ""
		if len(game.State.Players) > 0 && len(game.State.Players[0].Hands) > 0 {
			for _, c := range game.State.Players[0].Hands[0].Cards {
				src := cardToImage(c)
				html += "<img class=\"card\" src=\"" + src + "\" />"
			}
		}
		el.Set("innerHTML", html)
	}
	if len(game.State.Players) > 0 && len(game.State.Players[0].Hands) > 0 {
		p := game.State.Players[0]
		hand := p.Hands[0]
		if el := doc.Call("getElementById", "player-stack"); el.Truthy() {
			el.Set("innerText", fmt.Sprintf("$%d", p.Stack))
		}
		if el := doc.Call("getElementById", "player-winnings"); el.Truthy() {
			el.Set("innerText", fmt.Sprintf(" +%s", PrintCurrency(p.Winnings*100)))
		}
		if el := doc.Call("getElementById", "hand-wager"); el.Truthy() {
			el.Set("innerText", fmt.Sprintf("$%d", hand.Wager))
		}
		if el := doc.Call("getElementById", "hand-trifecta"); el.Truthy() {
			if hand.TrifectaWager > 0 {
				el.Set("innerText", fmt.Sprintf("Trifecta Wager: $%d", hand.TrifectaWager))
			} else {
				el.Set("innerText", "")
			}
		}
		if el := doc.Call("getElementById", "player-total"); el.Truthy() {
			soft := player.HandValue(&hand, true)
			hard := player.HandValue(&hand, false)
			totalStr := fmt.Sprintf("Total: %d", hard)
			if soft != hard && rules.CanHit(&hand) {
				totalStr = fmt.Sprintf("Total: %d/%d", soft, hard)
			}
			el.Set("innerText", totalStr)
		}
	}

	// progressives and game stats
	for i := 0; i < 4 && i < len(sidebets.TrifectaProgressives); i++ {
		id := fmt.Sprintf("prog%d", i)
		if el := doc.Call("getElementById", id); el.Truthy() {
			el.Set("innerText", PrintCurrency(sidebets.TrifectaProgressives[i]))
		}
	}
	if el := doc.Call("getElementById", "house"); el.Truthy() {
		el.Set("innerText", fmt.Sprintf("%d", game.State.House))
	}
	if el := doc.Call("getElementById", "count"); el.Truthy() {
		el.Set("innerText", fmt.Sprintf("%d", game.State.Count))
	}

	// update status text
	if el := doc.Call("getElementById", "status"); el.Truthy() {
		status := ""
		switch {
		case state.AskingForInsurance:
			status = "Insurance?"
		case state.AskingToDeal:
			status = "Deal again?"
		}
		el.Set("innerText", status)
	}

	// hint text
	if el := doc.Call("getElementById", "hint"); el.Truthy() {
		hint := ""
		if len(game.State.Players) > 0 && len(game.State.Players[0].Hands) > 0 {
			p := game.State.Players[0]
			hand := p.Hands[0]
			if rules.CanPlay(p, w.cfg.MinWager) {
				chr, err := rules.GetAutoPlayPlayerAction(&hand, cards.CardToValue(game.State.Dealer.Hands[0].Cards[0], true))
				if err == nil {
					advice := ""
					switch chr {
					case 'h':
						advice = "Your hand is somewhat weak. You should hit to try and improve your position."
						if hand.Cards[0].Value == hand.Cards[1].Value {
							advice += " You have a pair but splitting it here could be risky."
						}
					case 's':
						if player.HandValue(&hand, false) >= 17 {
							advice = "Your hand is strong. You should stand."
						} else {
							advice = "The dealer is weak and may bust. You should stand."
						}
						if hand.Cards[0].Value == hand.Cards[1].Value {
							advice += " You have a pair but splitting it here could be risky and weaken your hand."
						}
					case 'd':
						advice = "Odds are in your favor. You should double down."
					case 'p':
						advice = "You have a pair in a favorable position. You should split."
					}
					hint = fmt.Sprintf("Hint: Autoplay says you should %s!\n%s", printAutoplayString(chr), advice)
				}
			}
		}
		el.Set("innerText", hint)
	}
}

func (w *WebUI) Close() error {
	for _, h := range w.handlers {
		h.el.Call("removeEventListener", "click", h.fn)
		h.fn.Release()
	}
	close(w.actionCh)
	return nil
}

func cardToImage(c cards.Card) string {
	if c.Masked {
		return "/assets/boardgame/PNG/Cards/cardBack_blue1.png"
	}
	suite := ""
	switch c.Suite {
	case cards.Spades:
		suite = "Spades"
	case cards.Hearts:
		suite = "Hearts"
	case cards.Diamonds:
		suite = "Diamonds"
	case cards.Clubs:
		suite = "Clubs"
	}
	val := cards.CardValueToString[c.Value]
	return fmt.Sprintf("/assets/boardgame/PNG/Cards/card%s%s.png", suite, val)
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
		return fmt.Sprintf("$-%d%s", value, result)
	}
	return fmt.Sprintf("$%d%s", value, result)
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
