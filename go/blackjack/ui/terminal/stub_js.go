//go:build js

package terminal

import "blackjack/cards"

func PrintCurrency(value int) string { return "" }
func PrintStats(bool)                {}
func PrintAutoPlayTable()            {}
func PrintShoeDetails()              {}
func PrintCards([]cards.Card)        {}
