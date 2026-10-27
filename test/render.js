// Renders real frames with node-canvas so the art can be inspected.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { createCanvas, registerFont } = require('/workspace/node_modules/canvas');
try { registerFont('/tmp/inter.ttf', { family: 'Trebuchet MS' }); } catch (e) {}

const realCanvas = createCanvas(1280, 720);
realCanvas.style = {};

const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, Map, Set, Error,
  document: {
    getElementById: () => realCanvas,
    createElement: (tag) => (tag === 'canvas' ? createCanvas(1, 1) : {}),
    addEventListener() {}
  },
  window: { innerWidth: 1400, innerHeight: 900, addEventListener() {} },
  addEventListener() {},
  requestAnimationFrame() { return 0; }
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
for (const f of ['core.js', 'characters.js', 'poses.js', 'game.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}
const run = (code) => vm.runInContext(code, ctx, { filename: 'inline' });
run(`globalThis.shotSteps = (n) => { for (let i = 0; i < n; i++) { step(); clearPressed(); render(); } };`);

const outDir = path.join(__dirname, '..', 'shots');
fs.mkdirSync(outDir, { recursive: true });
function shot(name, code, frames) {
  run(code);
  run(`shotSteps(${frames || 1})`);
  renderFrame(name);
}
function renderFrame(name) {
  run('render()');
  fs.writeFileSync(path.join(outDir, name + '.png'), realCanvas.toBuffer('image/png'));
  console.log('wrote', name);
}
module.exports = { run, realCanvas, shot, renderFrame, outDir };
