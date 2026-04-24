.PHONY: build test wasm

# Default output root for web assets.
# Override for one-off builds if needed, for example:
# make wasm BLACKJACK_ASSET_ROOT=../../out/apps/blackjack
BLACKJACK_ASSET_ROOT ?= ../../public/apps/blackjack
BLACKJACK_JS_DIR := $(BLACKJACK_ASSET_ROOT)/js
BLACKJACK_WASM_DIR := $(BLACKJACK_ASSET_ROOT)/wasm
BLACKJACK_GOROOT := $(shell go env GOROOT)
BLACKJACK_WASM_EXEC_JS := $(shell \
	if [ -f "$(BLACKJACK_GOROOT)/lib/wasm/wasm_exec.js" ]; then \
		echo "$(BLACKJACK_GOROOT)/lib/wasm/wasm_exec.js"; \
	elif [ -f "$(BLACKJACK_GOROOT)/misc/wasm/wasm_exec.js" ]; then \
		echo "$(BLACKJACK_GOROOT)/misc/wasm/wasm_exec.js"; \
	fi)

# Build CLI binary
build:
	go build -o blackjack

# Run tests
test:
	go test ./...

# Build WebAssembly module and runtime support into app asset folders.
wasm:
	@if [ -z "$(BLACKJACK_WASM_EXEC_JS)" ]; then \
		echo "Unable to locate wasm_exec.js under $(BLACKJACK_GOROOT)"; \
		exit 1; \
	fi
	mkdir -p $(BLACKJACK_WASM_DIR) $(BLACKJACK_JS_DIR)
	GOOS=js GOARCH=wasm go build -o $(BLACKJACK_WASM_DIR)/main.wasm
	cp "$(BLACKJACK_WASM_EXEC_JS)" $(BLACKJACK_JS_DIR)/wasm_exec.js
