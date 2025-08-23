package sidebets

import (
	"blackjack/cards"
	"blackjack/game"
	"blackjack/player"
	"testing"
)

func setupDealer(card cards.Card) {
	game.State.Dealer = player.Player{Dealer: true, Hands: []player.Hand{{Cards: []cards.Card{card}, Player: &player.Player{Dealer: true}}}}
}

func TestIsTrifectaFlush(t *testing.T) {
	setupDealer(cards.CreateCard(cards.Spades, cards.King))
	p := player.Player{}
	hand := player.Hand{Cards: []cards.Card{
		cards.CreateCard(cards.Spades, cards.Three),
		cards.CreateCard(cards.Spades, cards.Four),
	}, Player: &p}
	if !IsTrifectaFlush(hand) {
		t.Fatalf("expected flush")
	}
	hand.Cards[1].Suite = cards.Hearts
	if IsTrifectaFlush(hand) {
		t.Fatalf("expected not flush")
	}
	hand.Split = true
	if IsTrifectaFlush(hand) {
		t.Fatalf("split hand should not qualify")
	}
}

func TestIsTrifectaTrips(t *testing.T) {
	setupDealer(cards.CreateCard(cards.Hearts, cards.Five))
	p := player.Player{}
	hand := player.Hand{Cards: []cards.Card{
		cards.CreateCard(cards.Clubs, cards.Five),
		cards.CreateCard(cards.Spades, cards.Five),
	}, Player: &p}
	if !IsTrifectaTrips(hand, false) {
		t.Fatalf("expected trips")
	}
	hand.Cards[1].Value = cards.Six
	if IsTrifectaTrips(hand, false) {
		t.Fatalf("expected not trips")
	}
	hand.Split = true
	if IsTrifectaTrips(hand, false) {
		t.Fatalf("split hand should not qualify")
	}
}
