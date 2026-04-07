//go:build js && wasm

package web

import (
	"blackjack/cards"
	"blackjack/game"
	"blackjack/player"
	"blackjack/rules"
	"blackjack/sidebets"
	"blackjack/ui"
	"blackjack/ui/messages"
)

type BlackjackActionMessage struct {
	Type   string `json:"type"`
	Action string `json:"action"`
}

type BlackjackStateMessage struct {
	Type  string               `json:"type"`
	State BlackjackRenderState `json:"state"`
}

type BlackjackRenderState struct {
	AskingForInsurance  bool                  `json:"askingForInsurance"`
	AskingToDeal        bool                  `json:"askingToDeal"`
	CanToggleGameMode   bool                  `json:"canToggleGameMode"`
	Controls            BlackjackControlsView `json:"controls"`
	Count               int                   `json:"count"`
	Dealer              BlackjackDealerView   `json:"dealer"`
	GameMode            string                `json:"gameMode"`
	GameModeDescription string                `json:"gameModeDescription"`
	GameModeLabel       string                `json:"gameModeLabel"`
	GameModeRules       []string              `json:"gameModeRules"`
	HasRendered         bool                  `json:"hasRendered"`
	HintText            string                `json:"hintText"`
	House               int                   `json:"house"`
	Player              *BlackjackPlayerView  `json:"player"`
	Progressives        []int                 `json:"progressives"`
	Result              *BlackjackResultView  `json:"result"`
	StatusText          string                `json:"statusText"`
}

type BlackjackControlsView struct {
	Deal    bool `json:"deal"`
	Decline bool `json:"decline"`
	Double  bool `json:"double"`
	Hit     bool `json:"hit"`
	Insure  bool `json:"insure"`
	Split   bool `json:"split"`
	Stand   bool `json:"stand"`
}

type BlackjackDealerView struct {
	Blackjack    bool                `json:"blackjack"`
	Busted       bool                `json:"busted"`
	Cards        []BlackjackCardView `json:"cards"`
	OutcomeLabel string              `json:"outcomeLabel"`
	Total        int                 `json:"total"`
	TotalLabel   string              `json:"totalLabel"`
}

type BlackjackPlayerView struct {
	Hands           []BlackjackPlayerHandView `json:"hands"`
	Stack           int                       `json:"stack"`
	Winnings        int                       `json:"winnings"`
	WinningsDisplay string                    `json:"winningsDisplay"`
	WinningsTone    string                    `json:"winningsTone"`
}

type BlackjackPlayerHandView struct {
	Active        bool                `json:"active"`
	Busted        bool                `json:"busted"`
	Cards         []BlackjackCardView `json:"cards"`
	Index         int                 `json:"index"`
	Insured       bool                `json:"insured"`
	Note          string              `json:"note"`
	OutcomeLabel  string              `json:"outcomeLabel"`
	Split         bool                `json:"split"`
	TotalLabel    string              `json:"totalLabel"`
	TrifectaWager int                 `json:"trifectaWager"`
	Wager         int                 `json:"wager"`
}

type BlackjackCardView struct {
	Masked bool   `json:"masked"`
	Suit   string `json:"suit"`
	Value  string `json:"value"`
}

type BlackjackResultView struct {
	Badge       string   `json:"badge"`
	DetailLines []string `json:"detailLines"`
	Summary     string   `json:"summary"`
	Tone        string   `json:"tone"`
}

func (w *WebUI) buildRenderState(state ui.GameState) BlackjackRenderState {
	return BlackjackRenderState{
		AskingForInsurance:  state.AskingForInsurance,
		AskingToDeal:        state.AskingToDeal,
		CanToggleGameMode:   canToggleGameMode(state),
		Controls:            w.buildControlsView(state),
		Count:               game.State.Count,
		Dealer:              buildDealerView(state),
		GameMode:            gameModeKey(game.GameMode),
		GameModeDescription: gameModeDescription(game.GameMode),
		GameModeLabel:       gameModeLabel(game.GameMode),
		GameModeRules:       gameModeRules(game.GameMode),
		HasRendered:         hasRenderedGameState(),
		HintText:            buildHintText(),
		House:               game.State.House,
		Player:              buildPlayerView(),
		Progressives:        append([]int(nil), sidebets.TrifectaProgressives...),
		Result:              w.buildResultView(state),
		StatusText:          buildStatusText(state),
	}
}

func canToggleGameMode(state ui.GameState) bool {
	return state.AskingToDeal || !hasRenderedGameState()
}

func gameModeKey(mode game.Game) string {
	switch mode {
	case game.Blackjack:
		return "blackjack"
	case game.JackAttack:
		return "jack-attack"
	case game.Trifecta:
		return "trifecta"
	case game.Trifecta3:
		return "trifecta3"
	case game.TrifectaStaxx:
		return "trifecta-staxx"
	case game.Spanish21:
		return "spanish21"
	default:
		return "blackjack"
	}
}

func gameModeLabel(mode game.Game) string {
	switch mode {
	case game.Blackjack:
		return "Blackjack"
	case game.JackAttack:
		return "Jack Attack"
	case game.Trifecta:
		return "Trifecta"
	case game.Trifecta3:
		return "Trifecta 3"
	case game.TrifectaStaxx:
		return "Trifecta Staxx"
	case game.Spanish21:
		return "Spanish 21"
	default:
		return "Blackjack"
	}
}

func gameModeDescription(mode game.Game) string {
	switch mode {
	case game.Blackjack:
		return "Classic blackjack with standard win, loss, push, split, double, and insurance flow."
	case game.JackAttack:
		return "Blackjack with a side wager that pays extra for jack-heavy starting combinations."
	case game.Trifecta:
		return "Blackjack with a three-card side bet based on the player hand plus dealer up card."
	case game.Trifecta3:
		return "A higher-volatility trifecta variant that emphasizes premium three-card patterns."
	case game.TrifectaStaxx:
		return "Trifecta with progressive jackpots layered on top of the base side-bet outcomes."
	case game.Spanish21:
		return "Spanish 21 style play with Spanish decks and special match/bonus side-bet behavior."
	default:
		return "Classic blackjack with configurable side-bet variants."
	}
}

func gameModeRules(mode game.Game) []string {
	switch mode {
	case game.Blackjack:
		return []string{
			"Standard blackjack hand resolution with insurance, split, and double when allowed.",
			"Natural blackjack pays 3:2 when it is not tied by the dealer.",
		}
	case game.JackAttack:
		return []string{
			"Includes the Jack Attack side wager using the player's first two cards and dealer up card.",
			"Premium jack combinations pay larger side-bet multipliers before the main hand settles.",
		}
	case game.Trifecta:
		return []string{
			"The trifecta side wager scores the player's two cards plus the dealer up card.",
			"Pairs, flushes, straights, trips, and straight flush patterns pay on the side bet.",
		}
	case game.Trifecta3:
		return []string{
			"A tighter trifecta pay table focused on stronger three-card combinations.",
			"Trips and straight flush style outcomes are weighted more aggressively than base trifecta.",
		}
	case game.TrifectaStaxx:
		return []string{
			"Progressive trifecta jackpots build when side wagers lose and reset on premium hits.",
			"Trip aces, premium triplets, and top-tier three-card hands can trigger the progressive pools.",
		}
	case game.Spanish21:
		return []string{
			"Uses Spanish decks, which remove the tens from the shoe.",
			"Blackjacks may resolve differently and the match-style side bet pays from player cards against dealer cards.",
		}
	default:
		return []string{
			"Standard blackjack hand flow with optional side-bet variants.",
		}
	}
}

func hasRenderedGameState() bool {
	if len(game.State.Dealer.Hands) > 0 && len(game.State.Dealer.Hands[0].Cards) > 0 {
		return true
	}

	if len(game.State.Players) == 0 {
		return false
	}

	for _, hand := range game.State.Players[0].Hands {
		if len(hand.Cards) > 0 {
			return true
		}
	}

	return false
}

func (w *WebUI) buildControlsView(state ui.GameState) BlackjackControlsView {
	controls := BlackjackControlsView{
		Deal:    state.AskingToDeal,
		Decline: state.AskingForInsurance,
		Insure:  state.AskingForInsurance,
	}

	if len(game.State.Players) == 0 {
		return controls
	}

	p := &game.State.Players[0]
	activeHand := player.ActiveHand(p)
	if activeHand == nil || !rules.CanPlay(*p, w.cfg.MinWager) || state.AskingForInsurance || state.AskingToDeal {
		return controls
	}

	controls.Hit = rules.CanHit(activeHand)
	controls.Stand = rules.CanStand(*activeHand)
	controls.Double = rules.CanDoubleDown(activeHand)
	controls.Split = rules.CanSplit(*activeHand)
	return controls
}

func buildDealerView(state ui.GameState) BlackjackDealerView {
	view := BlackjackDealerView{
		Cards:        []BlackjackCardView{},
		OutcomeLabel: "",
		TotalLabel:   "Total: 0",
	}
	if len(game.State.Dealer.Hands) == 0 {
		return view
	}

	hand := game.State.Dealer.Hands[0]
	view.Cards = buildCardViews(hand.Cards)

	if dealerHasHiddenCard(hand) && !state.AskingToDeal {
		view.Total = 0
		view.TotalLabel = "Total: ?"
		return view
	}

	view.Blackjack = rules.IsBlackjack(hand)
	view.Busted = handIsBusted(hand)
	view.OutcomeLabel = dealerOutcomeLabel(&hand)
	view.Total = player.HandValue(&hand, false)
	view.TotalLabel = playerTotalString(&hand)
	return view
}

func dealerHasHiddenCard(hand player.Hand) bool {
	for _, card := range hand.Cards {
		if card.Masked {
			return true
		}
	}
	return false
}

func dealerOutcomeLabel(hand *player.Hand) string {
	if hand == nil {
		return ""
	}

	switch {
	case rules.IsBlackjack(*hand):
		return "Blackjack!"
	case handIsBusted(*hand):
		return "Busted!"
	default:
		return ""
	}
}

func buildPlayerView() *BlackjackPlayerView {
	if len(game.State.Players) == 0 {
		return nil
	}

	p := game.State.Players[0]
	view := &BlackjackPlayerView{
		Hands:           make([]BlackjackPlayerHandView, 0, len(p.Hands)),
		Stack:           p.Stack,
		Winnings:        p.Winnings,
		WinningsDisplay: PrintCurrency(p.Winnings * 100),
		WinningsTone:    winningsTone(p.Winnings),
	}

	for i := 0; i < len(p.Hands); i++ {
		hand := p.Hands[i]
		view.Hands = append(view.Hands, BlackjackPlayerHandView{
			Active:        hand.Active,
			Busted:        handIsBusted(hand),
			Cards:         buildCardViews(hand.Cards),
			Index:         i,
			Insured:       hand.Insured,
			Note:          handNote(hand),
			OutcomeLabel:  handOutcomeLabel(&hand),
			Split:         hand.Split,
			TotalLabel:    playerTotalString(&hand),
			TrifectaWager: hand.TrifectaWager,
			Wager:         hand.Wager,
		})
	}

	return view
}

func buildCardViews(cardsList []cards.Card) []BlackjackCardView {
	views := make([]BlackjackCardView, 0, len(cardsList))
	for _, c := range cardsList {
		views = append(views, BlackjackCardView{
			Masked: c.Masked,
			Suit:   cardSuitString(c),
			Value:  cards.CardValueToString[c.Value],
		})
	}
	return views
}

func cardSuitString(c cards.Card) string {
	switch c.Suit {
	case cards.Spades:
		return "Spades"
	case cards.Hearts:
		return "Hearts"
	case cards.Diamonds:
		return "Diamonds"
	case cards.Clubs:
		return "Clubs"
	default:
		return ""
	}
}

func handNote(hand player.Hand) string {
	if hand.TrifectaWager > 0 {
		return "Bonus Bet: " + PrintCurrency(hand.TrifectaWager*100)
	}
	if hand.Split {
		return "Split Hand"
	}
	return ""
}

func winningsTone(winnings int) string {
	switch {
	case winnings > 0:
		return "positive"
	case winnings < 0:
		return "negative"
	default:
		return "neutral"
	}
}

func buildStatusText(state ui.GameState) string {
	switch {
	case state.AskingForInsurance:
		return "Insurance?"
	case state.AskingToDeal:
		return "Deal again?"
	default:
		return ""
	}
}

func buildHintText() string {
	if len(game.State.Players) == 0 || len(game.State.Dealer.Hands) == 0 || len(game.State.Dealer.Hands[0].Cards) == 0 {
		return ""
	}

	p := &game.State.Players[0]
	activeHand := player.ActiveHand(p)
	if activeHand == nil || !rules.CanPlay(*p, 0) {
		return ""
	}

	chr, err := rules.GetAutoPlayPlayerAction(activeHand, cards.CardToValue(game.State.Dealer.Hands[0].Cards[0], true))
	if err != nil {
		return ""
	}

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

	return "Hint: Autoplay says you should " + printAutoplayString(chr) + "!\n" + advice
}

func (w *WebUI) buildResultView(state ui.GameState) *BlackjackResultView {
	if !state.AskingToDeal || len(game.State.Players) == 0 {
		return nil
	}

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
			bonusReasonText = messages.JoinReasons(reasons, " ")
		}
	}

	view := &BlackjackResultView{
		Badge:       "",
		DetailLines: []string{},
		Summary:     "",
		Tone:        "neutral",
	}

	switch {
	case dealerHasBlackjack && playerBlackjackCount > 0:
		view.Summary = "Blackjack on both sides."
		view.Badge = "Push"
	case dealerHasBlackjack:
		view.Summary = "Dealer blackjack."
		view.Badge = "Lost!"
		view.Tone = "loss"
		if baseDiff < 0 {
			view.DetailLines = append(view.DetailLines, "You lost "+PrintCurrency(-baseDiff*100)+" on the hand!")
		}
	case playerBlackjackCount > 0:
		view.Summary = "Blackjack!"
		view.Badge = "Won!"
		view.Tone = "win"
		if baseDiff > 0 {
			view.DetailLines = append(view.DetailLines, "You won "+PrintCurrency(baseDiff*100)+" on the hand!")
		} else if len(p.Hands) > 0 {
			for i := 0; i < len(p.Hands); i++ {
				if rules.IsBlackjack(p.Hands[i]) {
					winnings := p.Hands[i].Wager + (p.Hands[i].Wager / 2.0) + p.Hands[i].Wager
					view.DetailLines = append(view.DetailLines, "You won "+PrintCurrency(winnings*100)+" on the hand!")
					break
				}
			}
		}
	case baseDiff > 0:
		view.Summary = "You won " + PrintCurrency(baseDiff*100) + " for the hand!"
		view.Badge = "Won!"
		view.Tone = "win"
		switch {
		case bonusDiff > 0:
			line := "You also won a bonus of " + PrintCurrency(bonusDiff*100) + "!"
			if bonusReasonText != "" {
				line += " " + bonusReasonText
			}
			view.DetailLines = append(view.DetailLines, line)
		case bonusDiff < 0:
			view.DetailLines = append(view.DetailLines, "You lost "+PrintCurrency(-bonusDiff*100)+" on bonus wagers.")
			view.DetailLines = append(view.DetailLines, "Net: "+PrintCurrency(netDiff*100)+".")
		}
	case baseDiff < 0:
		view.Summary = "You lost " + PrintCurrency(-baseDiff*100) + " on the hand!"
		view.Badge = "Lost!"
		view.Tone = "loss"
		switch {
		case bonusDiff > 0:
			line := "You won a bonus of " + PrintCurrency(bonusDiff*100) + "."
			if bonusReasonText != "" {
				line += " " + bonusReasonText
			}
			view.DetailLines = append(view.DetailLines, line)
			view.DetailLines = append(view.DetailLines, "Net: "+PrintCurrency(netDiff*100)+".")
		case bonusDiff < 0:
			view.DetailLines = append(view.DetailLines, "You lost "+PrintCurrency(-bonusDiff*100)+" on bonus wagers.")
			view.DetailLines = append(view.DetailLines, "Net: "+PrintCurrency(netDiff*100)+".")
		}
	default:
		view.Summary = "Push."
		view.Badge = "Push"
		switch {
		case bonusDiff > 0:
			line := "You also won a bonus of " + PrintCurrency(bonusDiff*100) + "!"
			if bonusReasonText != "" {
				line += " " + bonusReasonText
			}
			view.DetailLines = append(view.DetailLines, line)
		case bonusDiff < 0:
			view.DetailLines = append(view.DetailLines, "You lost "+PrintCurrency(-bonusDiff*100)+" on bonus wagers.")
			view.DetailLines = append(view.DetailLines, "Net: "+PrintCurrency(netDiff*100)+".")
		}
	}

	return view
}
