.PHONY: build test wasm

# Default output root for web assets.
# Override for one-off builds if needed, for example:
# make wasm BLACKJACK_ASSET_ROOT=../../out/apps/blackjack
BLACKJACK_ASSET_ROOT ?= ../../public/apps/blackjack
BLACKJACK_JS_DIR := $(BLACKJACK_ASSET_ROOT)/js
BLACKJACK_WASM_DIR := $(BLACKJACK_ASSET_ROOT)/wasm

# Build CLI binary
build:
	go build -o blackjack

# Run tests
test:
	go test ./...

# Build WebAssembly module and runtime support into app asset folders.
wasm:
	mkdir -p $(BLACKJACK_WASM_DIR) $(BLACKJACK_JS_DIR)
	GOOS=js GOARCH=wasm go build -o $(BLACKJACK_WASM_DIR)/main.wasm
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" $(BLACKJACK_JS_DIR)/wasm_exec.js
