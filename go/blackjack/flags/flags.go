package flags

import "flag"

// the following are flags
var NumOfDecks = flag.Int("decks", 5, "the number of decks in the shoe")
var NumOfPlayers = flag.Int("players", 1, "the number of players in the game")
var MinWager = flag.Int("minimum", 25, "the minimum bet")
var UseGlyphs = flag.Bool("glyph", false, "use UTF-8 glyphs, overrules \"draw\" flag")
var DrawCards = flag.Bool("draw", true, "use rudimentary drawing")
var HouseStart = flag.Int("house", 0, "override the house's initial starting winnings")
var PlayerStartStack = flag.Int("stack", 0, "set the starting stack for ALL players")
var TrifectaStax = flag.Bool("trifectaStax", true, "turn on/off Trifecta Stax payouts")
var Autoplay = flag.Bool("autoplay", false, "turn on/off (will play 500 rounds, will not play trifecta)")
var Clean = flag.Bool("clean", true, "whether or not to read initial state from State.out file")
var ColorTerminal = flag.Bool("colorTerminal", true, "whether or not to try to use color codes for coloring the terminal")

// Config holds runtime configuration for the application. Fields mirror the
// command line flags so configuration can be passed around without relying on
// the flag package.
type Config struct {
	NumOfDecks       int
	NumOfPlayers     int
	MinWager         int
	UseGlyphs        bool
	DrawCards        bool
	HouseStart       int
	PlayerStartStack int
	TrifectaStax     bool
	Autoplay         bool
	Clean            bool
	ColorTerminal    bool
}

// Cfg contains the active configuration. It should be populated by calling
// FromFlags or FromJS depending on the environment.
var Cfg Config

// FromFlags builds a Config from the parsed flag values.
func FromFlags() Config {
	return Config{
		NumOfDecks:       *NumOfDecks,
		NumOfPlayers:     *NumOfPlayers,
		MinWager:         *MinWager,
		UseGlyphs:        *UseGlyphs,
		DrawCards:        *DrawCards,
		HouseStart:       *HouseStart,
		PlayerStartStack: *PlayerStartStack,
		TrifectaStax:     *TrifectaStax,
		Autoplay:         *Autoplay,
		Clean:            *Clean,
		ColorTerminal:    *ColorTerminal,
	}
}
