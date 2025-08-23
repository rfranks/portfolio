package dealer

import (
	"blackjack/cards"
	"blackjack/flags"
	"blackjack/game"
	"blackjack/player"
	"blackjack/ui"
	"testing"
)

type stubIO struct {
	actions []rune
	renders []ui.GameState
}

func (s *stubIO) ReadAction() (rune, error) {
	if len(s.actions) == 0 {
		return 'q', nil
	}
	ch := s.actions[0]
	s.actions = s.actions[1:]
	return ch, nil
}

func (s *stubIO) Render(state ui.GameState) {
	s.renders = append(s.renders, state)
}

func TestDealRoundUsesIO(t *testing.T) {
	cfg := flags.Config{
		NumOfDecks:       1,
		NumOfPlayers:     1,
		MinWager:         1,
		PlayerStartStack: 100,
		Autoplay:         false,
		DrawCards:        false,
		Clean:            true,
	}

	game.State = game.BlackjackState{
		BustCounts: make(map[cards.CardValue]int),
		Dealer:     player.Player{Dealer: true},
		Players:    make([]player.Player, 0),
	}
	for _, v := range cards.CardValues {
		game.State.BustCounts[v] = 0
	}

	p := player.CreatePlayer(cfg.PlayerStartStack, cfg.MinWager)
	p.PlaceWager = func() int { return cfg.MinWager }
	p.DoAction = func() (rune, error) { return 's', nil }
	game.State.Players = append(game.State.Players, p)

	game.CreateShoe(cfg.NumOfDecks)
	loadShoe()
	game.State.Shoe.Index = 0

	io := &stubIO{}
	if _, err := DealRound(io, cfg); err != nil {
		t.Fatalf("DealRound returned error: %v", err)
	}
	if len(io.renders) == 0 {
		t.Fatalf("expected DealRound to render game state")
	}
}
