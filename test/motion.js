const { run } = require('./harness');
run(`
  globalThis.M = {
    smearCount: 0,
    track(id) {
      startMatch(id, 'blaze'); G.intro = 0; G.p1.x = 470; G.p2.x = 640; G.p1.face = 1; G.p2.face = -1;
      this.smearCount = 0;
      const _ds = drawSmear;
      drawSmear = function () { M.smearCount++; return _ds.apply(this, arguments); };
      const out = { angles: [], smears: 0 };
      G.p1.startAttack('punch');
      for (let i = 0; i < 24; i++) {
        step(); clearPressed(); render();
        out.angles.push(+G.p1.cur.fA[0].toFixed(2));
      }
      out.smears = this.smearCount;
      drawSmear = _ds;
      return out;
    }
  };
`);
const r = run("M.track('titan')");
console.log('arm angle per frame:', r.angles.join(' '));
console.log('smear ribbons drawn during the punch:', r.smears);
const jumps = r.angles.slice(1).map((v, i) => Math.abs(v - r.angles[i]));
console.log('max per-frame angle step:', Math.max(...jumps).toFixed(2), 'rad (lower = smoother)');
