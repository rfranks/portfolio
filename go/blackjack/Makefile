.PHONY: build test wasm

# Build CLI binary
build:
	go build -o blackjack

# Run tests
test:
	go test ./...

# Build WebAssembly module and copy runtime support
wasm: docs/main.wasm docs/wasm_exec.js

# Compile wasm output
.docs_dir := docs

docs/main.wasm: $(wildcard *.go)
	mkdir -p $(.docs_dir)
	GOOS=js GOARCH=wasm go build -o $(.docs_dir)/main.wasm

docs/wasm_exec.js:
	mkdir -p $(.docs_dir)
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" $(.docs_dir)/
