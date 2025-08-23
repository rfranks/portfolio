package dealer

import (
	"blackjack/game"
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
