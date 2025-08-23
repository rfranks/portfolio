//go:build js

package flags

import "syscall/js"

// FromJS builds a Config from a JavaScript object when running in a WASM
// environment. The object is expected to contain fields matching the command
// line flag names.
func FromJS(v js.Value) Config {
	return Config{
		NumOfDecks:       v.Get("decks").Int(),
		NumOfPlayers:     v.Get("players").Int(),
		MinWager:         v.Get("minimum").Int(),
		UseGlyphs:        v.Get("glyph").Bool(),
		DrawCards:        v.Get("draw").Bool(),
		HouseStart:       v.Get("house").Int(),
		PlayerStartStack: v.Get("stack").Int(),
		TrifectaStax:     v.Get("trifectaStax").Bool(),
		Autoplay:         v.Get("autoplay").Bool(),
		Clean:            v.Get("clean").Bool(),
		ColorTerminal:    v.Get("colorTerminal").Bool(),
	}
}
