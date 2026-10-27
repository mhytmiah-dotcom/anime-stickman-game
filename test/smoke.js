const { run } = require('./harness');

// helper inside sandbox
run(`
  globalThis.T = {
    steps(n) { for (let i = 0; i < n; i++) { step(); clearPressed(); render(); } },
    press(k) { keys[k] = true; pressed[k] = true; },
    release(k) { keys[k] = false; },
    tap(k) { pressed[k] = true; keys[k] = true; },
    info() { return { state: G.state, loading: G.loading, p1hp: G.p1 && G.p1.hp, p2hp: G.p2 && G.p2.hp, p1ult: G.p1 && G.p1.ult, p2ult: G.p2 && G.p2.ult }; }
  };
`);

function check(label, fn) {
  try { const r = fn(); console.log('PASS', label, r === undefined ? '' : JSON.stringify(r)); }
  catch (e) { console.log('FAIL', label, e && e.message); console.log(e.stack.split('\n').slice(0, 4).join('\n')); process.exitCode = 1; }
}

check('loading -> select', () => {
  run('T.steps(120)');
  return run('T.info()');
});

check('lock both -> fight (2P mode)', () => {
  run("AI_GAME.vsCPU = false; T.tap('enter'); T.steps(4); T.tap('enter'); T.steps(60);");
  return run('T.info()');
});

check('idle fight 200 frames', () => {
  run('T.steps(200)');
  return run('T.info()');
});
