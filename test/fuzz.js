const { run } = require('./harness');
run(`
  globalThis.F = {
    key: ['a','d','w','f','g','e','r','arrowleft','arrowright','arrowup','k','l','o','p'],
    one() {
      // random presses
      for (const k of this.key) { keys[k] = false; }
      for (let i = 0; i < 4; i++) {
        const k = this.key[Math.floor(Math.random() * this.key.length)];
        keys[k] = true; pressed[k] = true;
      }
      step(); clearPressed(); render();
      for (const k of this.key) keys[k] = false;
      const bad = [];
      for (const f of [G.p1, G.p2]) {
        if (!f) continue;
        if (!isFinite(f.x) || !isFinite(f.y) || !isFinite(f.airY) || !isFinite(f.meter) || !isFinite(f.hp)) bad.push(f.data.id);
      }
      for (const p of projectiles) if (!isFinite(p.x) || !isFinite(p.y)) bad.push('proj');
      return bad;
    }
  };
`);
const ids = run('ROSTER.map(c => c.id)');
let frames = 0;
for (let m = 0; m < 12; m++) {
  const a = ids[m % ids.length], b = ids[(m * 3 + 1) % ids.length];
  run(`startMatch('${a}','${b}'); G.intro = 0; G.p1.x = 420; G.p2.x = 780;`);
  for (let i = 0; i < 500; i++) {
    const bad = run('F.one()');
    frames++;
    if (bad.length) { console.log('BAD STATE', a, 'vs', b, 'frame', i, bad); process.exit(1); }
    const st = run('({ko: G.koTimer, state: G.state})');
    if (st.state !== 'fight') break;
    if (st.ko > 140) { run(`startMatch('${a}','${b}'); G.intro = 0;`); }
    if (i % 60 === 0) run(`G.p1.meter = 100; G.p1.locked = false; if (G.p1.state === 'idle' && !G.p1.ult) G.p1.tryUlt(Math.random() < .5 ? 'e' : 'r');
                          G.p2.meter = 100; G.p2.locked = false; if (G.p2.state === 'idle' && !G.p2.ult && Math.random() < .5) G.p2.tryUlt(Math.random() < .5 ? 'e' : 'r');`);
  }
}
console.log('FUZZ OK —', frames, 'frames, no NaNs or exceptions');
