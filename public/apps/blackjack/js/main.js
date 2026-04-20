const go = new Go();

async function init() {
  const wasmScript = document.getElementById('wasm');
  const wasmPath = wasmScript
    ? wasmScript.getAttribute('src')
    : '/apps/blackjack/wasm/main.wasm';
  const { instance } = await WebAssembly.instantiateStreaming(fetch(wasmPath), go.importObject);
  go.run(instance);
  if (typeof Start === "function") {
    Start();
  }
}

window.addEventListener('load', init);
