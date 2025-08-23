# blackjack
Blackjack in Go form

## WebAssembly Build and Run

`make wasm` compiles the Go source to WebAssembly and copies the Go runtime support into `docs/`, producing `main.wasm` and `wasm_exec.js` for the browser build.

There is no `make run` target, so to run the browser version you can serve the `docs/` directory with a local web server (for example `python3 -m http.server -d docs`) and open it in your browser.

## GitHub Pages

GitHub Pages can be configured to serve content directly from the `docs/` folder—where `index.html` references `wasm_exec.js`, `main.wasm`, and `main.js`—so pushing these generated files lets GitHub Pages host the playable version of the game.

## Screenshots

To capture screenshots or GIFs of gameplay, start a local server (e.g., `python3 -m http.server -d docs`), open it in a browser, and use your OS or browser tools to record the session.

## Testing

- `make wasm`
- `python3 -m http.server 8000 -d docs` and `curl -s localhost:8000 | head`

