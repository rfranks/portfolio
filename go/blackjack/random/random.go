package random

import (
	"blackjack/cards"
	"blackjack/game"
	"blackjack/player"
	"math/rand"
)

func RandomCard() cards.Card {
	value := cards.CardValues[rand.Intn(len(cards.CardValues))]
	if value == cards.One {
		value = cards.Ace
	}
	return cards.CreateCard(cards.Suites[rand.Intn(len(cards.Suites))], value)
}

func RandomCardSlice(length int) []cards.Card {
	cards := make([]cards.Card, 0)

	for i := 0; i < length; i++ {
		cards = append(cards, RandomCard())
	}

	return cards
}

func RandomHand(numOfCards int, deck game.Deck) player.Hand {
	hand := player.Hand{Active: true, Cards: make([]cards.Card, 0)}
	for i := 0; i < numOfCards; i++ {
		hand.Cards = append(hand.Cards, deck.Cards[i])
	}
	return hand
}
