package dealer

import (
	"blackjack/cards"
	"blackjack/game"
	"blackjack/player"
	"testing"
)

func setupShoe() {
	game.CreateShoe(1)
	game.State.Shoe.Index = 0
}

func TestBurnCard(t *testing.T) {
	setupShoe()
	initial := game.State.Shoe.Index
	BurnCard()
	if game.State.Shoe.Index != initial+1 {
		t.Fatalf("expected index %d got %d", initial+1, game.State.Shoe.Index)
	}
	game.State.Shoe.Index = len(game.State.Shoe.Cards) - 1
	BurnCard()
	if game.State.Shoe.Index != len(game.State.Shoe.Cards)-1 {
		t.Fatalf("burn should not advance past end")
	}
}

func TestDealMaskedCard(t *testing.T) {
	setupShoe()
	c := DealMaskedCard()
	if !c.Masked {
		t.Fatalf("card should be masked")
	}
	if c.Demoted || c.DoubleDown {
		t.Fatalf("card flags not reset: %+v", c)
	}
	if game.State.Shoe.Index != 1 {
		t.Fatalf("expected shoe index 1 got %d", game.State.Shoe.Index)
	}
}

func TestPayWinners_PlayerBustStillLosesWhenDealerBusts(t *testing.T) {
	game.State = game.BlackjackState{
		BustCounts: make(map[cards.CardValue]int),
		Dealer: player.Player{
			Dealer: true,
			Hands: []player.Hand{
				{
					Cards: []cards.Card{
						cards.ToCard("♠10"),
						cards.ToCard("♥8"),
						cards.ToCard("♣5"),
					},
				},
			},
		},
		Players: []player.Player{
			{
				Hands: []player.Hand{
					{
						Wager: 10,
						Cards: []cards.Card{
							cards.ToCard("♣10"),
							cards.ToCard("♦9"),
							cards.ToCard("♥5"),
						},
					},
				},
			},
		},
	}
	for _, v := range cards.CardValues {
		game.State.BustCounts[v] = 0
	}
	game.State.Dealer.Hands[0].Player = &game.State.Dealer
	game.State.Players[0].Hands[0].Player = &game.State.Players[0]

	PayWinners(true, true, false)

	if got := game.State.Players[0].Winnings; got != -10 {
		t.Fatalf("expected player to lose busted hand for -10 winnings, got %d", got)
	}
	if game.State.Wins != 0 {
		t.Fatalf("expected no win to be recorded, got %d", game.State.Wins)
	}
	if game.State.Losses != 1 {
		t.Fatalf("expected one loss to be recorded, got %d", game.State.Losses)
	}
	if game.State.Players[0].LastHandPushed {
		t.Fatalf("busted hand should not be marked as push")
	}
}
