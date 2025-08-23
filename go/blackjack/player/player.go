package player

import (
	"blackjack/cards"
	"blackjack/utils"
	"sort"
)

type Hand struct {
	Active           bool         `yaml:"active"`
	Busted           bool         `yaml:"busted"`
	Cards            []cards.Card `yaml:"cards"`
	DoubleDown       bool         `yaml:"double-down"`
	EvenMoney        bool         `yaml:"even-money"`
	Insured          bool         `yaml:"insured"`
	Player           *Player      `yaml:"-"`
	Split            bool         `yaml:"split"`
	InsuranceWager   int          `yaml:"insurance-wager"`
	Stand            bool         `yaml:"stand"`
	TrifectaWager    int          `yaml:"trifecta-wager"`
	TrifectaWinnings int          `yaml:"trifecta-winnings"`
	Wager            int          `yaml:"wager"`
	Winner           bool         `yaml:"winner"`
}

type Player struct {
	Hands            []Hand               `yaml:"hands"`
	Dealer           bool                 `yaml:"dealer"`
	Stack            int                  `yaml:"stack"`
	DoAction         func() (rune, error) `yaml:"-"`
	PlaceWager       func() int           `yaml:"-"`
	WillPlayTrifecta func(stack int) bool `yaml:"-"`
	LastHandWon      bool                 `yaml:"last-hand-won"`
	LastHandPushed   bool                 `yaml:"last-hand-pushed"`
	LastWager        int                  `yaml:"last-wager"`
	WinStreak        int                  `yaml:"win-streak"`
	Winnings         int                  `yaml:"winnings"`
}

func ActiveHand(player *Player) *Hand {
	for i := 0; i < len(player.Hands); i++ {
		hand := &player.Hands[i]
		if hand.Active {
			return hand
		}
	}

	return nil
}

func CreateHand() Hand {
	return Hand{Cards: make([]cards.Card, 0)}
}

func CreatePlayer(playerStartStack int, minWager int) Player {
	player := Player{}
	player.Dealer = false
	player.Hands = make([]Hand, 0)
	if playerStartStack > 0 {
		player.Stack = playerStartStack
	} else {
		player.Stack = utils.RollDice() * 5 * minWager
	}
	player.WillPlayTrifecta = func(stack int) bool {
		return true
	}
	return player
}

func ForAllHands(player *Player, handFunc func(hand *Hand)) {
	for i := 0; i < len(player.Hands); i++ {
		hand := player.Hands[i]
		handFunc(&hand)
	}
}

func ForAllPlayers(players []Player, playerFunc func(player *Player)) {
	for i := 0; i < len(players); i++ {
		player := players[i]
		playerFunc(&player)
	}
}

func HandValue(hand *Hand, soft bool) int {
	total := 0

	isSoft := false

	if len(hand.Cards) == 2 && hand.Cards[0] == hand.Cards[1] && hand.Cards[0].Value == cards.Ace {
		return 12
	}

	for i := 0; i < len(hand.Cards); i++ {
		card := &hand.Cards[i]
		total += cards.CardToValue(*card, soft)
		isSoft = isSoft || (card.Value == cards.Ace && !card.Demoted && soft)
	}

	if total == 21 && hand.Split {
		return 21
	}

	if total > 21 {
		if isSoft || !soft {
			for i := 0; i < len(hand.Cards); i++ {
				card := &hand.Cards[i]
				if card.Value == cards.Ace && !card.Demoted {
					card.Demoted = true
					return HandValue(hand, soft)
				}
			}
		}
		hand.Active = false
		hand.Busted = true
		hand.Winner = false
	}

	return total
}

func HandToString(hand Hand, useGlyphs bool, colorTerminal bool) string {
	handStr := ""

	for i := 0; i < len(hand.Cards); i++ {
		card := hand.Cards[i]
		handStr += cards.CardToString(card, false, useGlyphs, colorTerminal)
	}

	return handStr
}

func SortHand(hand Hand, acesHigh bool) Hand {
	sortedHand := CreateHand()
	sortedHand.Cards = append(sortedHand.Cards, hand.Cards...)

	sort.Slice(sortedHand.Cards, func(i, j int) bool {
		pips1 := cards.CardToPips(sortedHand.Cards[i])
		if cards.IsAce(sortedHand.Cards[i]) {
			if acesHigh {
				pips1 = 14
			} else {
				pips1 = 1
			}
		}

		pips2 := cards.CardToPips(sortedHand.Cards[j])
		if cards.IsAce(sortedHand.Cards[j]) {
			if acesHigh {
				pips2 = 14
			} else {
				pips2 = 1
			}
		}

		return pips1 < pips2
	})

	return sortedHand
}

func ToHand(cardStrings []string) Hand {
	hand := Hand{Active: true, Cards: make([]cards.Card, 0)}

	for i := 0; i < len(cardStrings); i++ {
		hand.Cards = append(hand.Cards, cards.ToCard(cardStrings[i]))
	}

	return hand
}
