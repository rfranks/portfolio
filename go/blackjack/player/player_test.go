package player

import "testing"

func TestActiveHand(t *testing.T) {
	h1 := Hand{Active: true}
	h2 := Hand{}
	p := Player{Hands: []Hand{h1, h2}}
	if ActiveHand(&p) != &p.Hands[0] {
		t.Fatalf("expected first hand active")
	}
	p.Hands[0].Active = false
	p.Hands[1].Active = true
	if ActiveHand(&p) != &p.Hands[1] {
		t.Fatalf("expected second hand active")
	}
	p.Hands[1].Active = false
	if ActiveHand(&p) != nil {
		t.Fatalf("expected nil when no active hand")
	}
}

func TestCreatePlayer(t *testing.T) {
	p := CreatePlayer(100, 1)
	if p.Dealer {
		t.Fatalf("created player should not be dealer")
	}
	if p.Stack != 100 {
		t.Fatalf("expected stack 100 got %d", p.Stack)
	}
	if len(p.Hands) != 0 {
		t.Fatalf("new player should have no hands")
	}
	if p.WillPlayTrifecta == nil {
		t.Fatalf("expected WillPlayTrifecta to be non-nil")
	}
}
