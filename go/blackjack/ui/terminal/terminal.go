//go:build !js && !wasm
// +build !js,!wasm

package terminal

import (
	"blackjack/flags"
	"blackjack/ui"
	"github.com/mattn/go-tty"
)

type TerminalUI struct {
	t   *tty.TTY
	cfg flags.Config
}

func New(cfg flags.Config) (*TerminalUI, error) {
	t, err := tty.Open()
	if err != nil {
		return nil, err
	}
	return &TerminalUI{t: t, cfg: cfg}, nil
}

func (c *TerminalUI) ReadAction() (rune, error) {
	return c.t.ReadRune()
}

func (c *TerminalUI) Render(state ui.GameState) {
	PrintGame(c.cfg, state.AskingForInsurance, state.AskingToDeal)
}

func (c *TerminalUI) Close() error {
	return c.t.Close()
}
