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
	"blackjack/ui/messages"
	"errors"
	"fmt"
	"html"
	"syscall/js"
)

type WebUI struct {
	actionCh            chan rune
	handlers            []handler
	cfg                 flags.Config
	hasRendered         bool
	lastAskingToDeal    bool
	lastHandBusts       []bool
	lastTotalCardCount  int
	lastWinnings        int
	lastSidebetWinnings int
	lastSidebetLosses   int
}

type handler struct {
	el js.Value
	fn js.Func
}

func New(cfg flags.Config) *WebUI {
	w := &WebUI{
		actionCh:     make(chan rune),
		handlers:     make([]handler, 0),
		cfg:          cfg,
		lastWinnings: 0,
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

	w.playSoundsForRender(state)

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
	if len(game.State.Players) > 0 {
		p := &game.State.Players[0]
		activeHand := player.ActiveHand(p)
		if activeHand != nil && rules.CanPlay(*p, w.cfg.MinWager) && !state.AskingForInsurance && !state.AskingToDeal {
			if rules.CanHit(activeHand) {
				hitDisplay = "inline"
			}
			if rules.CanStand(*activeHand) {
				standDisplay = "inline"
			}
			if rules.CanDoubleDown(activeHand) {
				doubleDisplay = "inline"
			}
			if rules.CanSplit(*activeHand) {
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
				html += "<img class=\"card\" src=\"" + src + "\" style=\"display:none\" onload=\"this.style.display='block'\" onerror=\"this.style.display='none'\"/>"
				html += "<img class=\"card\" src=\"/portfolio" + src + "\" style=\"display:none\" onload=\"this.style.display='block'\" onerror=\"this.style.display='none'\"/>"
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

	if len(game.State.Players) > 0 {
		p := &game.State.Players[0]
		if el := doc.Call("getElementById", "player-stack"); el.Truthy() {
			el.Set("innerText", fmt.Sprintf("$%d", p.Stack))
		}
		if el := doc.Call("getElementById", "player-winnings"); el.Truthy() {
			el.Set("innerText", fmt.Sprintf(" %s", PrintCurrency(p.Winnings*100)))
			switch {
			case p.Winnings > 0:
				el.Set("className", "positive")
			case p.Winnings < 0:
				el.Set("className", "negative")
			default:
				el.Set("className", "")
			}
		}
		if el := doc.Call("getElementById", "player-hands"); el.Truthy() {
			el.Set("innerHTML", "")
			html := ""
			for i := 0; i < len(p.Hands); i++ {
				html += renderPlayerHandHTML(i, p.Hands[i])
			}
			el.Set("innerHTML", html)
		}
	} else if el := doc.Call("getElementById", "player-hands"); el.Truthy() {
		el.Set("innerHTML", "")
	}

	// round result
	if el := doc.Call("getElementById", "result"); el.Truthy() {
		if state.AskingToDeal {
			message := ""
			if len(game.State.Players) > 0 {
				p := game.State.Players[0]
				baseDiff := p.Winnings - w.lastWinnings
				bonusWinDiff := game.State.SidebetWinnings - w.lastSidebetWinnings
				bonusLossDiff := game.State.SidebetLosses - w.lastSidebetLosses
				bonusDiff := bonusWinDiff - bonusLossDiff
				netDiff := baseDiff + bonusDiff
				dealerHasBlackjack := len(game.State.Dealer.Hands) > 0 && rules.IsBlackjack(game.State.Dealer.Hands[0])
				playerBlackjackCount := 0
				for i := 0; i < len(p.Hands); i++ {
					if rules.IsBlackjack(p.Hands[i]) {
						playerBlackjackCount++
					}
				}

				bonusReasonText := ""
				if bonusDiff > 0 && len(p.Hands) > 0 {
					if reasons := messages.SidebetReasons(p.Hands[0]); len(reasons) > 0 {
						if joined := messages.JoinReasons(reasons, " "); joined != "" {
							bonusReasonText = fmt.Sprintf(" <span class=\"text-bonus-reason\">%s</span>", html.EscapeString(joined))
						}
					}
				}

				netClass := func(amount int) string {
					if amount > 0 {
						return "text-win"
					}
					if amount < 0 {
						return "text-loss"
					}
					return "text-neutral"
				}

				switch {
				case dealerHasBlackjack && playerBlackjackCount > 0:
					message = "<span class=\"text-neutral\">Blackjack on both sides.</span> " + renderResultBadgeHTML("Push")
				case dealerHasBlackjack:
					message = "<span class=\"text-loss\">Dealer blackjack.</span> " + renderResultBadgeHTML("Lost!")
					if baseDiff < 0 {
						message += fmt.Sprintf(" <span class=\"text-loss\">You lost %s on the hand!</span>", PrintCurrency(-baseDiff*100))
					}
				case playerBlackjackCount > 0:
					message = "<span class=\"text-win\">Blackjack!</span> " + renderResultBadgeHTML("Won!")
					if baseDiff > 0 {
						message += fmt.Sprintf(" <span class=\"text-win\">You won %s on the hand!</span>", PrintCurrency(baseDiff*100))
					} else if len(p.Hands) > 0 {
						for i := 0; i < len(p.Hands); i++ {
							if rules.IsBlackjack(p.Hands[i]) {
								winnings := p.Hands[i].Wager + (p.Hands[i].Wager / 2.0) + p.Hands[i].Wager
								message += fmt.Sprintf(" <span class=\"text-win\">You won %s on the hand!</span>", PrintCurrency(winnings*100))
								break
							}
						}
					}
				case baseDiff > 0:
					message = fmt.Sprintf("<span class=\"text-win\">You won %s for the hand!</span> %s", PrintCurrency(baseDiff*100), renderResultBadgeHTML("Won!"))
					switch {
					case bonusDiff > 0:
						message += fmt.Sprintf(" You also won a <span class=\"text-bonus\">bonus of %s</span>!%s", PrintCurrency(bonusDiff*100), bonusReasonText)
					case bonusDiff < 0:
						message += fmt.Sprintf(" but <span class=\"text-loss\">lost %s on bonus wagers</span>.", PrintCurrency(-bonusDiff*100))
						message += fmt.Sprintf(" For a net of <span class=\"%s\">%s</span>.", netClass(netDiff), PrintCurrency(netDiff*100))
					}
				case baseDiff < 0:
					message = fmt.Sprintf("<span class=\"text-loss\">You lost %s on the hand!</span> %s", PrintCurrency(-baseDiff*100), renderResultBadgeHTML("Lost!"))
					switch {
					case bonusDiff > 0:
						message += fmt.Sprintf(", but <span class=\"text-bonus\">won a bonus of %s</span>%s,", PrintCurrency(bonusDiff*100), bonusReasonText)
						message += fmt.Sprintf(" for a net of <span class=\"%s\">%s</span>.", netClass(netDiff), PrintCurrency(netDiff*100))
					case bonusDiff < 0:
						message += fmt.Sprintf(" and <span class=\"text-loss\">lost %s on bonus wagers</span>.", PrintCurrency(-bonusDiff*100))
						message += fmt.Sprintf(" For a net of <span class=\"%s\">%s</span>.", netClass(netDiff), PrintCurrency(netDiff*100))
					}
				default:
					message = "<span class=\"text-neutral\">Push.</span> " + renderResultBadgeHTML("Push")
					switch {
					case bonusDiff > 0:
						message += fmt.Sprintf(" You also won a <span class=\"text-bonus\">bonus of %s</span>!%s", PrintCurrency(bonusDiff*100), bonusReasonText)
					case bonusDiff < 0:
						message += fmt.Sprintf(" <span class=\"text-loss\">You lost %s on bonus wagers</span>.", PrintCurrency(-bonusDiff*100))
						message += fmt.Sprintf(" For a net of <span class=\"%s\">%s</span>.", netClass(netDiff), PrintCurrency(netDiff*100))
					}
				}
			}
			el.Set("innerHTML", message)
		} else {
			if len(game.State.Players) > 0 {
				w.lastWinnings = game.State.Players[0].Winnings
			}
			w.lastSidebetWinnings = game.State.SidebetWinnings
			w.lastSidebetLosses = game.State.SidebetLosses
			el.Set("innerHTML", "")
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
		if len(game.State.Players) > 0 && len(game.State.Dealer.Hands) > 0 && len(game.State.Dealer.Hands[0].Cards) > 0 {
			p := &game.State.Players[0]
			activeHand := player.ActiveHand(p)
			if activeHand != nil && rules.CanPlay(*p, w.cfg.MinWager) {
				chr, err := rules.GetAutoPlayPlayerAction(activeHand, cards.CardToValue(game.State.Dealer.Hands[0].Cards[0], true))
				if err == nil {
					advice := ""
					switch chr {
					case 'h':
						advice = "Your hand is somewhat weak. You should hit to try and improve your position."
						if len(activeHand.Cards) > 1 && activeHand.Cards[0].Value == activeHand.Cards[1].Value {
							advice += " You have a pair but splitting it here could be risky."
						}
					case 's':
						if player.HandValue(activeHand, false) >= 17 {
							advice = "Your hand is strong. You should stand."
						} else {
							advice = "The dealer is weak and may bust. You should stand."
						}
						if len(activeHand.Cards) > 1 && activeHand.Cards[0].Value == activeHand.Cards[1].Value {
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
	suit := ""
	switch c.Suit {
	case cards.Spades:
		suit = "Spades"
	case cards.Hearts:
		suit = "Hearts"
	case cards.Diamonds:
		suit = "Diamonds"
	case cards.Clubs:
		suit = "Clubs"
	}
	val := cards.CardValueToString[c.Value]
	return fmt.Sprintf("/assets/boardgame/PNG/Cards/card%s%s.png", suit, val)
}

func renderCardImages(hand player.Hand) string {
	html := ""
	for _, c := range hand.Cards {
		src := cardToImage(c)
		html += "<img class=\"card\" src=\"" + src + "\" style=\"display:none\" onload=\"this.style.display='block'\" onerror=\"this.style.display='none'\"/>"
		html += "<img class=\"card\" src=\"/portfolio" + src + "\" style=\"display:none\" onload=\"this.style.display='block'\" onerror=\"this.style.display='none'\"/>"
	}
	return html
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

func renderPlayerHandHTML(index int, hand player.Hand) string {
	classes := "blackjack-seat blackjack-hand"
	if hand.Active {
		classes += " blackjack-hand--active"
	}

	handNote := ""
	if hand.TrifectaWager > 0 {
		handNote = fmt.Sprintf("<span class=\"blackjack-hand-note\">Trifecta Wager: $%d</span>", hand.TrifectaWager)
	} else if hand.Split {
		handNote = "<span class=\"blackjack-hand-note\">Split Hand</span>"
	}

	bustedBadge := ""
	if handIsBusted(hand) {
		bustedBadge = "<span class=\"blackjack-busted-badge\">Busted!</span>"
	}

	stampHTML := renderHandStampHTML(index, &hand)

	return fmt.Sprintf(
		"<div class=\"%s\">"+
			"<div class=\"blackjack-hand-header\">"+
			"<span class=\"blackjack-hand-label\">Hand %d</span>"+
			"<span class=\"blackjack-hand-meta\">Wager: $%d</span>%s"+
			"</div>"+
			"<div class=\"blackjack-hand-cards-wrap\">"+
			"<div class=\"blackjack-hand-cards-stack\">"+
			"<div class=\"cards\">%s</div>%s"+
			"</div>"+
			"</div>"+
			"<div class=\"blackjack-hand-total\">%s%s</div>"+
			"</div>",
		classes,
		index+1,
		hand.Wager,
		handNote,
		renderCardImages(hand),
		stampHTML,
		html.EscapeString(playerTotalString(&hand)),
		bustedBadge,
	)
}

func handIsBusted(hand player.Hand) bool {
	if hand.Busted {
		return true
	}
	hard := player.HandValue(&hand, false)
	return hard > 21
}

func totalCardCount() int {
	total := 0
	if len(game.State.Dealer.Hands) > 0 {
		total += len(game.State.Dealer.Hands[0].Cards)
	}
	for i := 0; i < len(game.State.Players); i++ {
		for j := 0; j < len(game.State.Players[i].Hands); j++ {
			total += len(game.State.Players[i].Hands[j].Cards)
		}
	}
	return total
}

func currentHandBusts() []bool {
	if len(game.State.Players) == 0 {
		return nil
	}
	busts := make([]bool, 0, len(game.State.Players[0].Hands))
	for i := 0; i < len(game.State.Players[0].Hands); i++ {
		busts = append(busts, handIsBusted(game.State.Players[0].Hands[i]))
	}
	return busts
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

	if rules.CanHit(dealerHand) || (rules.IsBlackjack(*dealerHand) && !hand.Insured) {
		return ""
	}

	playerValue := player.HandValue(hand, false)
	dealerValue := player.HandValue(dealerHand, false)

	switch {
	case rules.IsBlackjack(*hand):
		return "Winner!"
	case playerValue < dealerValue:
		if dealerHand.Busted {
			return "Winner!"
		}
		return "Loser!"
	case playerValue == dealerValue:
		if dealerHand.Busted {
			return "Winner!"
		}
		return ""
	default:
		return "Winner!"
	}
}

func handStampClass(label string) string {
	switch label {
	case "Winner!":
		return " blackjack-hand-stamp--winner"
	case "Loser!", "Busted!":
		return " blackjack-hand-stamp--loser"
	default:
		return ""
	}
}

func handStampAngle(index int, hand *player.Hand, label string) int {
	seed := (index + 1) * 7
	seed += len(hand.Cards) * 5
	seed += player.HandValue(hand, false)
	seed += len(label) * 3
	return (seed % 21) - 10
}

func renderHandStampHTML(index int, hand *player.Hand) string {
	label := handOutcomeLabel(hand)
	if label == "" {
		return ""
	}

	return fmt.Sprintf(
		"<div class=\"blackjack-hand-stamp%s\" style=\"transform: translate(-50%%, -50%%) rotate(%ddeg);\">%s</div>",
		handStampClass(label),
		handStampAngle(index, hand, label),
		html.EscapeString(label),
	)
}

func renderResultBadgeHTML(label string) string {
	if label == "" {
		return ""
	}

	className := "blackjack-result-badge"
	switch label {
	case "Won!":
		className += " blackjack-result-badge--winner"
	case "Lost!":
		className += " blackjack-result-badge--loser"
	case "Push":
		className += " blackjack-result-badge--push"
	}

	return fmt.Sprintf("<span class=\"%s\">%s</span>", className, html.EscapeString(label))
}

func (w *WebUI) playSound(key string) {
	player := js.Global().Get("blackjackPlaySound")
	if player.Truthy() {
		player.Invoke(key)
	}
}

func (w *WebUI) playSoundsForRender(state ui.GameState) {
	currentTotalCards := totalCardCount()
	currentBusts := currentHandBusts()

	if w.hasRendered {
		for i := 0; i < len(currentBusts); i++ {
			if currentBusts[i] && (i >= len(w.lastHandBusts) || !w.lastHandBusts[i]) {
				w.playSound("bust")
				break
			}
		}

		if !state.AskingToDeal && currentTotalCards > w.lastTotalCardCount {
			if !(w.lastAskingToDeal || w.lastTotalCardCount == 0) {
				w.playSound("hit")
			}
		}

		if state.AskingToDeal && !w.lastAskingToDeal && len(game.State.Players) > 0 {
			p := game.State.Players[0]
			baseDiff := p.Winnings - w.lastWinnings
			bonusWinDiff := game.State.SidebetWinnings - w.lastSidebetWinnings
			bonusLossDiff := game.State.SidebetLosses - w.lastSidebetLosses
			netDiff := baseDiff + bonusWinDiff - bonusLossDiff
			switch {
			case netDiff > 0:
				w.playSound("win")
			case netDiff < 0:
				w.playSound("lose")
			}
		}
	}

	w.hasRendered = true
	w.lastAskingToDeal = state.AskingToDeal
	w.lastHandBusts = currentBusts
	w.lastTotalCardCount = currentTotalCards
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
