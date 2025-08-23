package cards

import (
	"blackjack/constants"
	"fmt"
	"math/rand"
)

type CardSuite int8
type CardValue int8

const (
	Hearts CardSuite = iota
	Spades
	Clubs
	Diamonds
)

var Suites = []CardSuite{
	Hearts,
	Spades,
	Clubs,
	Diamonds,
}

var SuiteToColorString = map[CardSuite]string{
	Spades:   constants.Gray + "♠" + constants.Reset,
	Hearts:   constants.Red + "♥" + constants.Reset,
	Diamonds: constants.Red + "♦" + constants.Reset,
	Clubs:    constants.Gray + "♣" + constants.Reset,
}

var SuiteToString = map[CardSuite]string{
	Spades:   "♠",
	Hearts:   "♥",
	Diamonds: "♦",
	Clubs:    "♣",
}

const (
	One CardValue = iota + 1
	Two
	Three
	Four
	Five
	Six
	Seven
	Eight
	Nine
	Ten
	Jack
	Queen
	King
	Ace
)

var CardValues = []CardValue{
	One,
	Two,
	Three,
	Four,
	Five,
	Six,
	Seven,
	Eight,
	Nine,
	Ten,
	Jack,
	Queen,
	King,
	Ace,
}

var CardValueToString = map[CardValue]string{
	One:   "A",
	Two:   "2",
	Three: "3",
	Four:  "4",
	Five:  "5",
	Six:   "6",
	Seven: "7",
	Eight: "8",
	Nine:  "9",
	Ten:   "10",
	Jack:  "J",
	Queen: "Q",
	King:  "K",
	Ace:   "A",
}

type Card struct {
	Suite      CardSuite `yaml:"suite"`
	Value      CardValue `yaml:"value"`
	Masked     bool      `yaml:"masked"`  // only hidden cards are masked
	Demoted    bool      `yaml:"demoted"` // means our value is One
	DoubleDown bool      `yaml:"double-down"`
}

func CardToGlyph(card Card) string {
	switch card.Value {
	case One, Ace:
		switch card.Suite {
		case Spades:
			return "🂡"
		case Hearts:
			return "🂱"
		case Diamonds:
			return "🃁"
		case Clubs:
			return "🃑"
		}
	case Two:
		switch card.Suite {
		case Spades:
			return "🂢"
		case Hearts:
			return "🂲"
		case Diamonds:
			return "🃂"
		case Clubs:
			return "🃒"
		}
	case Three:
		switch card.Suite {
		case Spades:
			return "🂣"
		case Hearts:
			return "🂳"
		case Diamonds:
			return "🃃"
		case Clubs:
			return "🃓"
		}
	case Four:
		switch card.Suite {
		case Spades:
			return "🂤"
		case Hearts:
			return "🂴"
		case Diamonds:
			return "🃄"
		case Clubs:
			return "🃔"
		}
	case Five:
		switch card.Suite {
		case Spades:
			return "🂥"
		case Hearts:
			return "🂵"
		case Diamonds:
			return "🃅"
		case Clubs:
			return "🃕"
		}
	case Six:
		switch card.Suite {
		case Spades:
			return "🂦"
		case Hearts:
			return "🂶"
		case Diamonds:
			return "🃆"
		case Clubs:
			return "🃖"
		}
	case Seven:
		switch card.Suite {
		case Spades:
			return "🂧"
		case Hearts:
			return "🂷"
		case Diamonds:
			return "🃇"
		case Clubs:
			return "🃗"
		}
	case Eight:
		switch card.Suite {
		case Spades:
			return "🂨"
		case Hearts:
			return "🂸"
		case Diamonds:
			return "🃈"
		case Clubs:
			return "🃘"
		}
	case Nine:
		switch card.Suite {
		case Spades:
			return "🂩"
		case Hearts:
			return "🂹"
		case Diamonds:
			return "🃉"
		case Clubs:
			return "🃙"
		}
	case Ten:
		switch card.Suite {
		case Spades:
			return "🂪"
		case Hearts:
			return "🂺"
		case Diamonds:
			return "🃊"
		case Clubs:
			return "🃚"
		}
	case Jack:
		switch card.Suite {
		case Spades:
			return "🂫"
		case Hearts:
			return "🂻"
		case Diamonds:
			return "🃋"
		case Clubs:
			return "🃛"
		}
	case Queen:
		switch card.Suite {
		case Spades:
			return "🂭"
		case Hearts:
			return "🂽"
		case Diamonds:
			return "🃍"
		case Clubs:
			return "🃝"
		}
	case King:
		switch card.Suite {
		case Spades:
			return "🂮"
		case Hearts:
			return "🂾"
		case Diamonds:
			return "🃎"
		case Clubs:
			return "🃞"
		}
	default:
		return ""
	}
	return ""
}

func CardToPips(card Card) int {
	if card.Demoted {
		return 1
	}
	switch card.Value {
	case One:
		return 1
	case Two:
		return 2
	case Three:
		return 3
	case Four:
		return 4
	case Five:
		return 5
	case Six:
		return 6
	case Seven:
		return 7
	case Eight:
		return 8
	case Nine:
		return 9
	case Ten:
		return 10
	case Jack:
		return 11
	case Queen:
		return 12
	case King:
		return 13
	case Ace:
		return 14
	default:
		return 0
	}
}

func CardToString(card Card, printValue bool, useGlyphs bool, colorTerminal bool) string {
	if card.Masked {
		if printValue {
			return "*** (**)"
		} else {
			return "***"
		}
	}
	if useGlyphs {
		return fmt.Sprintf("%s ", CardToGlyph(card))
	} else {
		suiteStr := SuiteToString[card.Suite]
		if colorTerminal {
			suiteStr = SuiteToColorString[card.Suite]
		}

		if printValue {
			return fmt.Sprintf("%s%s (%d)", suiteStr, CardValueToString[card.Value], CardToValue(card, false))
		} else {
			return fmt.Sprintf("%s%s", suiteStr, CardValueToString[card.Value])
		}
	}
}

func CardToValue(card Card, soft bool) int {
	if card.Masked {
		return 0
	}
	if card.Demoted {
		return 1
	}
	switch card.Value {
	case One:
		return 1
	case Two:
		return 2
	case Three:
		return 3
	case Four:
		return 4
	case Five:
		return 5
	case Six:
		return 6
	case Seven:
		return 7
	case Eight:
		return 8
	case Nine:
		return 9
	case Ten, Jack, Queen, King:
		return 10
	case Ace:
		if soft {
			return 1
		} else {
			return 11
		}
	default:
		return 0
	}
}

func ToCard(cardString string) Card {
	var suite CardSuite
	var value CardValue

	switch string([]rune(cardString)[0]) {
	case "♠":
		suite = Spades
	case "♥":
		suite = Hearts
	case "♦":
		suite = Diamonds
	case "♣":
		suite = Clubs
	}

	switch string([]rune(cardString)[1]) {
	case "2":
		value = Two
	case "3":
		value = Three
	case "4":
		value = Four
	case "5":
		value = Five
	case "6":
		value = Six
	case "7":
		value = Seven
	case "8":
		value = Eight
	case "9":
		value = Nine
	case "1": // i know
		value = Ten
	case "J":
		value = Jack
	case "Q":
		value = Queen
	case "K":
		value = King
	case "A":
		value = Ace
	}

	return CreateCard(suite, value)
}

func CreateCard(suite CardSuite, value CardValue) Card {
	card := Card{Demoted: false, DoubleDown: false, Masked: false}
	card.Suite = suite
	card.Value = value
	return card
}

func ForAllCards(cardFunc func(card Card)) {
	for i := 0; i < len(CardValues); i++ {
		aValue := CardValues[i]
		for aSuite := range Suites {
			card := CreateCard(CardSuite(aSuite), aValue)
			cardFunc(card)
		}
	}
}

func ForAllCardValues(cardFunc func(card Card)) {
	for i := 0; i < len(CardValues); i++ {
		aValue := CardValues[i]
		card := CreateCard(CardSuite(Suites[0]), aValue)
		cardFunc(card)
	}
}

func IsAce(card Card) bool {
	if card.Value == One {
		return true
	} else {
		if card.Value == Ace {
			return true
		} else {
			return false
		}
	}
}

func IsOneEyedJack(card Card) bool {
	return card.Value == Jack && (card.Suite == Hearts || card.Suite == Spades)
}

func ShuffleCards(cards []Card) {
	numOfCards := len(cards)
	rand.Shuffle(numOfCards, func(i, j int) { cards[i], cards[j] = cards[j], cards[i] })
}
