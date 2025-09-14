package random

import (
	"math/rand"
	"testing"
	"time"

	"blackjack/cards"
)

// TestRandomCardUniform ensures each rank is equally likely.
func TestRandomCardUniform(t *testing.T) {
	defer rand.Seed(time.Now().UnixNano())
	rand.Seed(1)
	const draws = 130000
	counts := map[cards.CardValue]int{}
	for i := 0; i < draws; i++ {
		c := RandomCard()
		if c.Value == cards.One {
			t.Fatalf("RandomCard returned cards.One")
		}
		counts[c.Value]++
	}

	expectedRanks := len(cards.CardValues) - 1 // exclude cards.One
	if len(counts) != expectedRanks {
		t.Fatalf("got %d ranks, want %d", len(counts), expectedRanks)
	}

	mean := draws / expectedRanks
	tolerance := int(float64(mean) * 0.05) // 5% tolerance
	for v, c := range counts {
		diff := c - mean
		if diff < 0 {
			diff = -diff
		}
		if diff > tolerance {
			t.Fatalf("card %v count %d differs from mean %d by more than %d", v, c, mean, tolerance)
		}
	}
}
