const { run } = require('./harness');

run(`
  globalThis.T = {
    steps(n) { for (let i = 0; i < n; i++) { step(); clearPressed(); render(); } },
    tap(k) { pressed[k] = true; keys[k] = true; },
    reset2(a, b) {
      startMatch(a, b);
      G.intro = 0;
      G.p1.x = 500; G.p2.x = 620;
      return { p1: G.p1, p2: G.p2 };
    }
  };
`);

let fails = 0;
function check(label, fn) {
  try { fn(); console.log('PASS', label); }
  catch (e) { fails++; console.log('FAIL', label, '::', e.message); console.log(e.stack.split('\n').slice(1, 4).join('\n')); }
}

const ids = run('ROSTER.map(c => c.id)');
console.log('roster:', ids.join(', '));

for (const id of ids) {
  check(`${id} basic attacks`, () => {
    run(`T.reset2('${id}', '${id}'); T.steps(6);
      G.p1.startAttack('punch'); T.steps(30);
      G.p1.startAttack('kick'); T.steps(40);`);
  });
  for (const which of ['e', 'r']) {
    check(`${id} ult ${which.toUpperCase()}`, () => {
      const res = run(`(() => { T.reset2('${id}', 'shadow');
        G.p1.meter = 100; G.p1.locked = false;
        G.p1.tryUlt('${which}');
        const started = !!G.p1.ult;
        T.steps(170);
        return { started, mid: G.p1.ult, hp2: Math.round(G.p2.hp), meter: Math.round(G.p1.meter), locked: G.p1.locked }; })()`);
      if (!res.started) throw new Error('ult never started');
      if (res.mid) throw new Error('ult did not end');
      console.log('   ->', JSON.stringify(res));
    });
  }
}

check('hp damage + KO flow', () => {
  run(`T.reset2('titan', 'blaze'); G.p2.hp = 5; G.p1.x = 500; G.p2.x = 560;
    G.p1.startAttack('kick'); T.steps(60); T.steps(240);`);
  const s = run('({ st: G.p2.state, ko: G.koTimer, winner: G.winner && G.winner.data.id, gs: G.state })');
  console.log('   ->', JSON.stringify(s));
  if (s.st !== 'ko') throw new Error('loser not KO');
});

check('meter lockout rules', () => {
  const r = run(`T.reset2('volt','volt');
    G.p1.meter = 100; G.p1.locked = false;
    G.p1.tryUlt('e');
    const afterUse = { meter: G.p1.meter, locked: G.p1.locked };
    T.steps(60);
    G.p1.locked = false; G.p1.meter = 50;
    G.p1.tryUlt('r');
    const denyLowMeter = !G.p1.ult;
    G.p1.meter = 0; G.p1.locked = true; G.p1.gainMeter(100);
    ({ afterUse, denyLowMeter, unlockedAt: { m: G.p1.meter, l: G.p1.locked } })`);
  console.log('   ->', JSON.stringify(r));
  if (!r.afterUse.locked) throw new Error('not locked after ult');
  if (!r.denyLowMeter) throw new Error('allowed R with 50 meter');
  if (r.unlockedAt.l) throw new Error('did not unlock at 100');
});

console.log(fails ? `\n${fails} FAILURES` : '\nALL ULT TESTS PASSED');
process.exitCode = fails ? 1 : 0;
