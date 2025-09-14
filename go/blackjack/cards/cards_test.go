package cards

import (
	"math/rand"
	"testing"
)

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

// TestShuffleCards ensures shuffling retains the same cards in a different order
func TestShuffleCards(t *testing.T) {
	// create an ordered deck of cards
	ordered := []Card{}
	ForAllCards(func(card Card) {
		ordered = append(ordered, card)
	})

	// copy and shuffle the deck
	shuffled := make([]Card, len(ordered))
	copy(shuffled, ordered)
	rand.Seed(42)
	ShuffleCards(shuffled)

	// verify card count is unchanged
	if len(shuffled) != len(ordered) {
		t.Fatalf("shuffled deck length = %d want %d", len(shuffled), len(ordered))
	}

	// ensure all original cards are present
	orig := make(map[Card]struct{}, len(ordered))
	for _, c := range ordered {
		orig[c] = struct{}{}
	}
	for _, c := range shuffled {
		if _, ok := orig[c]; !ok {
			t.Fatalf("shuffled deck contains unexpected card %v", c)
		}
		delete(orig, c)
	}
	if len(orig) != 0 {
		t.Fatalf("shuffled deck missing cards: %v", orig)
	}

	// verify order differs; retry once if necessary
	same := true
	for i := range ordered {
		if ordered[i] != shuffled[i] {
			same = false
			break
		}
	}
	if same {
		rand.Seed(99)
		ShuffleCards(shuffled)
		same = true
		for i := range ordered {
			if ordered[i] != shuffled[i] {
				same = false
				break
			}
		}
		if same {
			t.Fatalf("shuffle did not change order")
		}
	}
}
