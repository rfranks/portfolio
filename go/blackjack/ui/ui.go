package ui

type GameState struct {
	AskingForInsurance bool
	AskingToDeal       bool
}

type IO interface {
	ReadAction() (rune, error)
	Render(GameState)
}
