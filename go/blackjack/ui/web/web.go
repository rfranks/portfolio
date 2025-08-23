//go:build js && wasm

package web

import (
	"blackjack/cards"
	"blackjack/game"
	"blackjack/ui"
	"errors"
	"syscall/js"
)

type WebUI struct {
	actionCh chan rune
	handlers []handler
}

type handler struct {
	el js.Value
	fn js.Func
}

func New() *WebUI {
	w := &WebUI{
		actionCh: make(chan rune),
		handlers: make([]handler, 0),
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

	// update dealer cards
	if el := doc.Call("getElementById", "dealer-cards"); el.Truthy() {
		html := ""
		if len(game.State.Dealer.Hands) > 0 {
			for _, c := range game.State.Dealer.Hands[0].Cards {
				glyph := "🂠"
				if !c.Masked {
					glyph = cards.CardToGlyph(c)
				}
				html += "<span class=\"card\">" + glyph + "</span>"
			}
		}
		el.Set("innerHTML", html)
	}

	// update player cards (first player, first hand)
	if el := doc.Call("getElementById", "player-cards"); el.Truthy() {
		html := ""
		if len(game.State.Players) > 0 && len(game.State.Players[0].Hands) > 0 {
			for _, c := range game.State.Players[0].Hands[0].Cards {
				glyph := "🂠"
				if !c.Masked {
					glyph = cards.CardToGlyph(c)
				}
				html += "<span class=\"card\">" + glyph + "</span>"
			}
		}
		el.Set("innerHTML", html)
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
}

func (w *WebUI) Close() error {
	for _, h := range w.handlers {
		h.el.Call("removeEventListener", "click", h.fn)
		h.fn.Release()
	}
	close(w.actionCh)
	return nil
}
