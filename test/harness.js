// Headless harness: fake canvas + real game logic
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function makeCtx() {
  const grad = { addColorStop() {} };
  const target = {
    canvas: { width: 1280, height: 720 },
    measureText: () => ({ width: 42 }),
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createPattern: () => null,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData() {}, save() {}, restore() {},
  };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === 'symbol') return undefined;
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}

const canvasEl = {
  width: 1280, height: 720, style: {},
  getContext: () => makeCtx()
};

const sandbox = {
  console,
  Math, Date, JSON, Object, Array, String, Number, Boolean, Map, Set, Error,
  Float32Array, Uint8ClampedArray,
  document: {
    getElementById: () => canvasEl,
    createElement: (tag) => ({ width: 0, height: 0, getContext: () => makeCtx() }),
    addEventListener() {}
  },
  window: { innerWidth: 1400, innerHeight: 900, addEventListener() {} },
  addEventListener() {},
  requestAnimationFrame() { return 0; },
  performance: { now: () => Date.now() }
};
sandbox.window.__game = null;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

for (const f of ['core.js', 'characters.js', 'poses.js', 'game.js', 'ai.js']) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  vm.runInContext(code, ctx, { filename: f });
}

module.exports = { ctx, run: (code, name) => vm.runInContext(code, ctx, { filename: name || 'inline' }) };
