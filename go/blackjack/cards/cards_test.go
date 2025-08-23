package cards

import "testing"

// TestCreateCard verifies that CreateCard sets basic fields correctly
func TestCreateCard(t *testing.T) {
	ForAllCards(func(card Card) {
		created := CreateCard(card.Suite, card.Value)
		if created.Suite != card.Suite || created.Value != card.Value {
			t.Fatalf("CreateCard(%v,%v)=%v want %v", card.Suite, card.Value, created, card)
		}
		if created.Demoted || created.DoubleDown || created.Masked {
			t.Fatalf("new card has unexpected flags: %+v", created)
		}
	})
}

// TestCardToPips exercises mapping card values to pips, including demoted aces
func TestCardToPips(t *testing.T) {
	if CardToPips(Card{}) != 0 {
		t.Fatalf("CardToPips zero card = %d want 0", CardToPips(Card{}))
	}
	ace := CreateCard(Spades, Ace)
	if CardToPips(ace) != 14 {
		t.Fatalf("ace pips = %d want 14", CardToPips(ace))
	}
	ace.Demoted = true
	if CardToPips(ace) != 1 {
		t.Fatalf("demoted ace pips = %d want 1", CardToPips(ace))
	}
}

// TestToCard ensures string conversion round trips for every card
func TestToCard(t *testing.T) {
	ForAllCards(func(card Card) {
		if card.Value == One {
			return // one and ace share representation; skip one
		}
		s := CardToString(card, false, false, false)
		got := ToCard(s)
		if got.Suite != card.Suite || got.Value != card.Value {
			t.Fatalf("ToCard(%s)=%v want %v", s, got, card)
		}
	})
}

// TestCardToValue covers soft and hard values for Aces and face cards
func TestCardToValue(t *testing.T) {
	ace := CreateCard(Hearts, Ace)
	if v := CardToValue(ace, true); v != 1 {
		t.Fatalf("CardToValue soft ace = %d want 1", v)
	}
	if v := CardToValue(ace, false); v != 11 {
		t.Fatalf("CardToValue hard ace = %d want 11", v)
	}
	ten := CreateCard(Clubs, Ten)
	if v := CardToValue(ten, false); v != 10 {
		t.Fatalf("CardToValue ten = %d want 10", v)
	}
}

// TestIsAce verifies detection of aces
func TestIsAce(t *testing.T) {
	if !IsAce(CreateCard(Diamonds, Ace)) {
		t.Fatalf("IsAce failed on ace")
	}
	if IsAce(CreateCard(Diamonds, Ten)) {
		t.Fatalf("IsAce reported non-ace")
	}
}
