const { run } = require('./harness');

run(`
  globalThis.T = {
    steps(n) { for (let i = 0; i < n; i++) { step(); clearPressed(); } },
    paint() { render(); },
    tap(k) { keys[k] = true; pressed[k] = true; },
    up(k) { keys[k] = false; },
    fresh(a, b) {
      AI_GAME.vsCPU = true; AI_GAME.level = 1;
      startMatch(a || 'titan', b || 'blaze');
      G.intro = 0; G.p1.x = 430; G.p2.x = 800;
    },
    info() {
      const p1 = G.p1, p2 = G.p2;
      return {
        state: G.state, ai: !!p2.ai, ci2: p2.ci === AI_KEY,
        hp1: p1.hp, hp2: p2.hp, ko: G.koTimer, winner: G.winner && G.winner.slot,
        decisions: p2.ai && p2.ai.decisions, attacks: p2.ai && p2.ai.attacks,
        nan: [p1.x, p1.hp, p2.x, p2.hp, p2.airY, p2.meter].some(v => !isFinite(v))
      };
    }
  };
`);

function check(label, fn) {
  try {
    const r = fn();
    console.log('PASS', label, r === undefined ? '' : JSON.stringify(r));
    return r;
  } catch (e) {
    console.log('FAIL', label, e && e.message);
    console.log(e.stack.split('\n').slice(0, 5).join('\n'));
    process.exitCode = 1;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

/* ---- select screen ---- */
check('default select screen is 1P vs CPU', () => {
  run('T.steps(200)');
  const s = run('({ state: G.state, cpu: AI_GAME.vsCPU, level: AI_GAME.level })');
  assert(s.state === 'select', 'expected select, got ' + s.state);
  assert(s.cpu === true, 'CPU mode should be the default');
  return s;
});

check('P1 locks -> CPU picks and match starts', () => {
  run("T.tap('enter'); T.up('enter'); T.steps(90);");
  const s = run('T.info()');
  assert(s.state === 'fight', 'expected fight, got ' + s.state);
  assert(s.ai && s.ci2, 'P2 should be CPU-driven');
  return s;
});

/* ---- behaviour ---- */
check('CPU deals damage to an idle player', () => {
  run('T.fresh()');
  run('T.steps(900)');
  const s = run('T.info()');
  assert(s.hp1 < 130, 'CPU did not land a hit (hp1 ' + s.hp1 + ')');
  assert(!s.nan, 'non-finite fighter state');
  assert(s.attacks > 0 && s.decisions > 0, 'CPU never acted');
  return s;
});

check('CPU finishes an idle opponent on every difficulty', () => {
  const out = [];
  for (let lvl = 0; lvl < 3; lvl++) {
    const r = run(`(() => {
      AI_GAME.vsCPU = true; AI_GAME.level = ${lvl};
      startMatch('titan', 'blaze'); G.intro = 0; G.p1.x = 430; G.p2.x = 800;
      let f = 0;
      for (; f < 4200 && !G.koTimer; f++) { step(); clearPressed(); }
      return { lvl: AI_LEVELS[${lvl}].name, frames: f, ko: G.koTimer, hp1: G.p1.hp };
    })()`);
    assert(r.ko > 0, r.lvl + ' never KOed an idle opponent');
    out.push(r);
  }
  return out;
});

check('difficulty ladder changes reaction time', () => {
  return run('AI_LEVELS.map(l => l.name + ":" + l.react + "f")');
});

check('CPU spends meter on ultimates', () => {
  run('T.fresh()');
  let used = false;
  for (let i = 0; i < 2400 && !used; i++) {
    run("if (G.p2.state === 'idle' && !G.p2.ult) { G.p2.meter = 100; G.p2.locked = false; } T.steps(1);");
    used = run('!!G.p2.ult || (G.p2.locked && G.p2.meter < 100)');
  }
  assert(used, 'CPU never fired an ultimate with a full meter');
  return { used };
});

check('CPU jumps or dashes away from projectiles', () => {
  run(`AI_GAME.vsCPU = true; AI_GAME.level = 2; startMatch('blaze','titan'); G.intro = 0;
       G.p1.x = 300; G.p2.x = 800; G.p1.face = 1; G.p2.face = -1;`);
  let reacted = false;
  for (let i = 0; i < 300 && !reacted; i++) {
    run(`T.steps(1);
      if (G.p1.state === 'idle' && !G.p1.atk && !G.p1.ult && G.p1.airY === 0) G.p1.startAttack('punch');
      if (G.p1.atkT === 4) {
        projectiles.push({ kind: 'fireball', x: 640, y: G.p2.y - 70, px: 610, py: G.p2.y - 70,
          vx: -9, vy: 0, rot: 0, spin: .1, r: 14, dmg: 8, kb: 5, ks: 12, owner: G.p1,
          face: -1, color: '#ff8a2b', life: 90, hitCd: 0 });
      }`);
    reacted = run('G.p2.airY > 12 || G.p2.dashT > 0 || G.p2.invuln > 0');
  }
  assert(reacted, 'CPU ignored an incoming fireball');
  return { reacted };
});

check('2P mode restores human control of P2', () => {
  run(`AI_GAME.vsCPU = false; startMatch('titan','ronin'); G.intro = 0;
       G.p1.x = 560; G.p2.x = 640; G.p1.face = 1; G.p2.face = -1;`);
  const before = run('({ ai: !!G.p2.ai, ci: G.p2.ci === CONTROLS[1], hp1: G.p1.hp })');
  assert(!before.ai && before.ci, 'P2 should be human-controlled');
  for (let i = 0; i < 3; i++) {
    run("keys['k'] = false; pressed['k'] = true; T.steps(2);");
  }
  run('T.steps(40)');
  const hp1 = run('G.p1.hp');
  assert(hp1 < before.hp1, 'P2 human punch did not connect (hp1 ' + hp1 + ')');
  return { before, hp1 };
});

check('mode + difficulty keys work on select', () => {
  run(`G.state = 'select'; AI_GAME.vsCPU = true; AI_GAME.level = 1;
       SEL.locked = [false,false]; SEL.startDelay = 0; SEL.cpuLockT = 0;`);
  run("T.tap('2'); T.steps(2); T.up('2');");
  const twoPlayer = run('AI_GAME.vsCPU');
  run("T.tap('1'); T.steps(2); T.up('1');");
  run("T.tap('3'); T.steps(2); T.up('3');");
  const st = run('({ cpu: AI_GAME.vsCPU, level: AI_GAME.level })');
  assert(twoPlayer === false, "'2' did not switch to 2P");
  assert(st.cpu === true, "'1' did not switch back to CPU");
  assert(st.level !== 1, "'3' did not cycle difficulty");
  return st;
});

check('long CPU match stays finite and renders', () => {
  run('T.fresh()');
  for (let i = 0; i < 1800; i++) {
    run('T.steps(1)');
    if (i % 60 === 0) {
      const s = run('T.info()');
      assert(!s.nan, 'non-finite state at frame ' + i);
      if (s.ko > 120) run('T.fresh()');
    }
  }
  run('T.paint()');
  return run('T.info()');
});

if (!process.exitCode) console.log('\nALL AI TESTS PASSED');
