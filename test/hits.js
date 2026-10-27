const { run } = require('./harness');
run(`
  globalThis.Q = {
    melee(id1, d, kind) {
      startMatch(id1, 'titan'); G.intro = 0;
      const a = G.p1, b = G.p2;
      a.x = 520; b.x = 520 + d; b.hp = b.maxHp;
      a.face = 1; b.face = -1;
      a.startAttack(kind);
      for (let i = 0; i < 50; i++) { step(); clearPressed(); }
      return { hit: b.hp < b.maxHp, dmg: Math.round(b.maxHp - b.hp), dx: Math.round(b.x - a.x) };
    },
    ult(id1, d, which) {
      startMatch(id1, 'titan'); G.intro = 0;
      const a = G.p1, b = G.p2;
      a.x = 400; b.x = 400 + d; b.hp = b.maxHp;
      a.face = 1; b.face = -1;
      a.meter = 100; a.locked = false; a.tryUlt(which);
      for (let i = 0; i < 190; i++) { step(); clearPressed(); }
      return { hit: b.hp < b.maxHp, dmg: Math.round(b.maxHp - b.hp) };
    }
  };
`);
const ids = run('ROSTER.map(c => c.id)');
console.log('MELEE (punch) hit at distance:');
for (const d of [40, 60, 80, 100, 120, 140, 160]) {
  const rows = ids.map(id => {
    const r = run(`Q.melee('${id}', ${d}, 'punch')`);
    return `${id}:${r.hit ? r.dmg : '—'}`;
  });
  console.log(' ', String(d).padStart(3), rows.join('  '));
}
console.log('\nKICK at distance:');
for (const d of [60, 90, 120, 150, 180]) {
  const rows = ids.slice(0, 4).map(id => {
    const r = run(`Q.melee('${id}', ${d}, 'kick')`);
    return `${id}:${r.hit ? r.dmg : '—'}`;
  });
  console.log(' ', String(d).padStart(3), rows.join('  '));
}
console.log('\nULT E damage by distance:');
for (const id of ids) {
  const row = [200, 350, 500, 650].map(d => {
    const r = run(`Q.ult('${id}', ${d}, 'e')`);
    return `${d}:${r.hit ? r.dmg : '—'}`;
  });
  console.log(' ', id.padEnd(8), row.join('  '));
}

console.log('\nULT R damage by distance:');
for (const id of ids) {
  const row = [150, 300, 450, 600].map(d => {
    const r = run(`Q.ult('${id}', ${d}, 'r')`);
    return `${d}:${r.hit ? r.dmg : '—'}`;
  });
  console.log(' ', id.padEnd(8), row.join('  '));
}
