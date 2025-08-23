package game

import (
	"blackjack/cards"
	"blackjack/player"
	"blackjack/utils"

	"errors"
	"fmt"
	"os"
	"runtime"

	"gopkg.in/yaml.v2"
)

type BlackjackState struct {
	Count            int                     `yaml:"count"`
	House            int                     `yaml:"house"`
	Wins             int                     `yaml:"wins"`
	Losses           int                     `yaml:"losses"`
	Pushes           int                     `yaml:"pushes"`
	DealerBlackjacks int                     `yaml:"dealer-blackjacks"`
	DealerBusts      int                     `yaml:"dealer-busts"`
	PlayerBlackjacks int                     `yaml:"player-blackjacks"`
	PlayerBusts      int                     `yaml:"player-busts"`
	BustCards        []cards.Card            `yaml:"bust-cards"`
	BustCounts       map[cards.CardValue]int `yaml:"bust-counts"`
	SidebetWinnings  int                     `yaml:"sidebet-winnings"`
	SidebetLosings   int                     `yaml:"sidebet-losings"`
	Dealer           player.Player           `yaml:"dealer"`
	Players          []player.Player         `yaml:"players"`
	Shoe             Shoe                    `yaml:"shoe"`
	Rounds           int                     `yaml:"rounds"`
}

type Deck struct {
	Cards []cards.Card `yaml:"cards"`
}

type Shoe struct {
	Decks []Deck       `yaml:"deck"`
	Cards []cards.Card `yaml:"cards"`
	Cut   int          `yaml:"cut"`
	Index int          `yaml:"index"`
}

var State BlackjackState

// inMemoryState holds the serialized game state when running under WebAssembly
// where a traditional filesystem is unavailable.
var inMemoryState []byte

type Game int8

const (
	Blackjack Game = iota + 1
	JackAttack
	Trifecta
	Trifecta3
	TrifectaStaxx
	Spanish21
)

var GameMode Game = Spanish21

func LoadBlackjackStateYaml(clean bool) error {
	if clean {
		return errors.New("clean state is required")
	}

	if runtime.GOOS == "js" {
		if len(inMemoryState) == 0 {
			return errors.New("state not available")
		}
		return yaml.UnmarshalStrict(inMemoryState, &State)
	}

	bytes, err := os.ReadFile("state.out")
	if err != nil {
		return err
	}

	return yaml.UnmarshalStrict(bytes, &State)
}

func SaveBlackjackStateYaml() {
	yamlData, err := yaml.Marshal(&State)

	if err != nil {
		fmt.Printf("Error while Marshaling. %v", err)
	}

	if runtime.GOOS == "js" {
		// Store state in memory when running in WebAssembly.
		inMemoryState = yamlData
		return
	}

	if err = os.WriteFile("state.out", yamlData, 0644); err != nil {
		panic("Unable to write data into the file")
	}
}

func CreateShoe(numOfDecks int) {
	State.Shoe = Shoe{
		Cards: make([]cards.Card, 0),
		Decks: make([]Deck, 0),
		Index: 0,
	}

	if numOfDecks <= 0 {
		numOfDecks = 1
	}

	for i := 0; i < numOfDecks; i++ {
		deck := CreateDeck()

		State.Shoe.Decks = append(State.Shoe.Decks, deck)
		State.Shoe.Cards = append(State.Shoe.Cards, deck.Cards...)
	}

	cards.ShuffleCards(State.Shoe.Cards)
}

func CutShoe() {
	die1 := utils.RollDice()
	die2 := utils.RollDice()

	if die1+die2 > int(float32(.8)*float32(len(utils.Die)*2)) {
		// this still not right
		CutShoe()
	} else {
		State.Shoe.Cut = int(len(State.Shoe.Cards) * (die1 + die2) / (2 * utils.Die[len(utils.Die)-1]))
	}
}

func CreateDeck() Deck {
	deck := Deck{}
	deck.Cards = make([]cards.Card, 0)

	for _, suite := range cards.Suites {
		for _, value := range cards.CardValues {
			if value != cards.One {
				// it's not a One until it is Demoted, adding these to the deck would duplicate Aces
				switch GameMode {
				case Spanish21:
					if value != cards.Ten {
						// there are no 10s in Spanish21
						deck.Cards = append(deck.Cards, cards.CreateCard(suite, value))
					}
				default:
					deck.Cards = append(deck.Cards, cards.CreateCard(suite, value))
				}
			}
		}
	}

	cards.ShuffleCards(deck.Cards)

	return deck
}

func burnCard() {
	State.Shoe.Index = utils.Min(State.Shoe.Index+1, len(State.Shoe.Cards)-1)
}

func ShuffleShoeIfNeeded() {
	if State.Shoe.Cut <= State.Shoe.Index {
		cards.ShuffleCards(State.Shoe.Cards)
		CutShoe()
		State.Shoe.Index = 0
		burnCard()
		State.Count = 0
	}
}
