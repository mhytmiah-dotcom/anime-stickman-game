/* ============================================================
   core.js — canvas, input, math helpers, and the whole VFX kit
   ============================================================ */
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;   // 1280
const H = canvas.height;  // 720

/* ---------------- math ---------------- */
const TAU = Math.PI * 2;

/* Classic = plain stick figures (no hair/cape/gear). Press T on select to toggle. */
const STYLE = { classic: true };
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeIn = t => Math.pow(clamp(t, 0, 1), 3);
const easeInOut = t => { t = clamp(t, 0, 1); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const approach = (v, target, step) => v < target ? Math.min(v + step, target) : Math.max(v - step, target);
const dirTo = (a, b) => (b >= a ? 1 : -1);

function hexA(hex, a) {
  if (typeof hex !== 'string' || hex[0] !== '#') return hex;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ---------------- input ---------------- */
const keys = Object.create(null);
const pressed = Object.create(null);   // edge-triggered, cleared each update
const BLOCK = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '];

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (BLOCK.includes(k)) e.preventDefault();
  if (!keys[k]) pressed[k] = true;
  keys[k] = true;
});
addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (BLOCK.includes(k)) e.preventDefault();
  keys[k] = false;
});
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const clearPressed = () => { for (const k in pressed) delete pressed[k]; };

/* ---------------- global screen state ---------------- */
const cam = { shake: 0, shakeX: 0, shakeY: 0, flash: 0, flashColor: '#ffffff', dark: 0, slow: 0, hitstop: 0 };
function shake(amount) { cam.shake = Math.min(38, cam.shake + amount); }
function flash(color = '#ffffff', amount = .5) { cam.flashColor = color; cam.flash = Math.max(cam.flash, amount); }
function hitstop(frames = 3) { cam.hitstop = Math.max(cam.hitstop, frames); }

/* ---------------- delayed callbacks (fight time) ---------------- */
const timers = [];
function later(frames, fn) { timers.push({ t: frames, fn }); }
function updateTimers() {
  for (let i = timers.length - 1; i >= 0; i--) {
    if (--timers[i].t <= 0) { const fn = timers[i].fn; timers.splice(i, 1); fn(); }
  }
}
function clearTimers() { timers.length = 0; }

/* ---------------- particles ---------------- */
const particles = [];
const MAX_PARTICLES = 640;

function part(o) {
  if (particles.length > MAX_PARTICLES) particles.shift();
  particles.push(Object.assign({
    x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 30, max: 30, size: 3,
    color: '#fff', color2: null, kind: 'dot', rot: 0, spin: 0, drag: .98, glow: true
  }, o));
}

function burst(x, y, color, n = 12, power = 5, opts = {}) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(power * .25, power);
    part(Object.assign({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - rand(0, power * .4),
      life: randi(16, 34), max: 34, size: rand(2, 5), color, glow: true, g: .12
    }, opts));
  }
}

function ring(x, y, color, radius = 20, grow = 5, life = 22, width = 4) {
  part({ x, y, kind: 'ring', color, size: radius, grow, life, max: life, width, glow: true });
}

function sparks(x, y, color, n = 8, power = 6) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(power * .4, power);
    part({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, kind: 'spark',
      life: randi(8, 18), max: 18, size: rand(6, 14), color,
      rot: a, g: .18, glow: true, drag: .94
    });
  }
}

function dust(x, y, n = 5, color = '#6b7694') {
  for (let i = 0; i < n; i++) {
    part({
      x: x + rand(-10, 10), y: y + rand(-3, 1), vx: rand(-2.2, 2.2), vy: rand(-2.2, -.4),
      life: randi(16, 28), max: 28, size: rand(2, 5), color, kind: 'smoke', g: -.02, drag: .95, glow: false
    });
  }
}

function trail(x, y, color, size = 3, life = 16, vy = 0) {
  part({ x: x + rand(-3, 3), y: y + rand(-3, 3), vx: rand(-.5, .5), vy, life, max: life, size, color, glow: true, drag: .96 });
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
    p.rot += p.spin;
    if (p.kind === 'ring') p.size += p.grow * clamp(1 - p.size / 240, 0, 1);
    if (--p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  ctx.save();
  ctx.lineCap = 'round';
  for (const p of particles) {
    const a = clamp(p.life / p.max, 0, 1);
    if (p.kind === 'ring') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * .55;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(.5, p.width * a * .7);
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size * .2, 0, 0, TAU); ctx.stroke();
      continue;
    }
    ctx.globalCompositeOperation = p.glow ? 'lighter' : 'source-over';
    ctx.globalAlpha = p.kind === 'smoke' ? a * .35 : a;
    ctx.fillStyle = p.color;
    if (p.kind === 'spark') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * .22;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - Math.cos(p.rot) * p.size, p.y - Math.sin(p.rot) * p.size);
      ctx.stroke();
    } else if (p.kind === 'shard') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.moveTo(0, -p.size); ctx.lineTo(p.size * .55, 0); ctx.lineTo(0, p.size); ctx.lineTo(-p.size * .55, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.4 + a * .8), 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

/* ---------------- shapes ---------------- */
function drawCrescent(x, y, rot, size, color, edge, alpha = 1, thick = 1, band = 0.62, span = 1) {
  const oy = 0.42 * size;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  const cut = (1 - span) * Math.PI / 2;
  const path = () => {
    ctx.beginPath();
    ctx.arc(0, oy, size, Math.PI + cut, TAU - cut, false);
    ctx.arc(0, oy, size * band, TAU - cut, Math.PI + cut, true);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, oy - size, 0, oy);
  g.addColorStop(0, hexA(color, .05));
  g.addColorStop(.5, hexA(color, .4));
  g.addColorStop(1, hexA(edge || color, .62));
  path(); ctx.fillStyle = g; ctx.fill();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = hexA(edge || color, .55);
  ctx.lineWidth = 2.0 * thick;
  path(); ctx.stroke();
  ctx.strokeStyle = hexA('#ffffff', .22);
  ctx.lineWidth = 1 * thick;
  path(); ctx.stroke();
  ctx.restore();
}

function boltPoints(x1, y1, x2, y2, jag = 14) {
  const pts = [[x1, y1]];
  const segs = 7;
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    pts.push([lerp(x1, x2, t) + rand(-jag, jag), lerp(y1, y2, t) + rand(-jag, jag)]);
  }
  pts.push([x2, y2]);
  return pts;
}

function drawBolt(pts, color, width = 3, alpha = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  };
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha * .12; ctx.lineWidth = width * 8; path();
  ctx.globalAlpha = alpha * .28; ctx.lineWidth = width * 3.4; path();
  ctx.globalAlpha = alpha * .75; ctx.lineWidth = width * 1.3; path();
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, width * .45); path();
  ctx.restore();
}

function fxPillar(o) { fx.push(Object.assign({ kind: 'pillar', x: 0, y: 0, t: 0, life: 16, w: 110, color: '#ffe83d' }, o)); }

/* ---------------- effect objects ---------------- */
const fx = [];

function fxSlash(o) { fx.push(Object.assign({ kind: 'slash', x: 0, y: 0, t: 0, life: 14, rot: 0, size: 40, color: '#fff', edge: '#fff', thick: 1, follow: null }, o)); }
function fxWave(o) { fx.push(Object.assign({ kind: 'wave', x: 0, y: 0, t: 0, life: 30, dir: 1, dist: 200, color: '#fff', speed: .6, hitDone: false, onHit: null }, o)); }
function fxBolt(o) { fx.push(Object.assign({ kind: 'bolt', x: 0, y: 0, t: 0, life: 18, color: '#fff', width: 4, up: 700, fromX: null, done: false }, o)); }
function fxMark(o) { fx.push(Object.assign({ kind: 'mark', x: 0, y: 0, t: 0, life: 40, radius: 55, color: '#fff' }, o)); }
function fxCrack(o) { fx.push(Object.assign({ kind: 'crack', x: 0, y: 0, t: 0, life: 40, dir: 1, color: '#ffb545' }, o)); }
function fxLine(o) { fx.push(Object.assign({ kind: 'line', x1: 0, y1: 0, x2: 0, y2: 0, t: 0, life: 10, color: '#fff', width: 6 }, o)); }
function fxText(o) { fx.push(Object.assign({ kind: 'text', x: 0, y: 0, t: 0, life: 60, text: '', color: '#fff', size: 26, vy: -1.1 }, o)); }

function updateFx() {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    f.t++;
    if (f.rot !== undefined) f.rot += f.spin;
    if (f.kind === 'slash' && f.follow) { f.x = f.follow.x; f.y = f.follow.y; }
    if (f.kind === 'wave') {
      f.x += f.dir * f.speed * 6;
      if (f.owner && f.owner.target) waveHit(f, f.owner.target);
    }
    if (f.kind === 'bolt' && !f.done && f.t > 2) f.done = true;
    if (f.t >= f.life) fx.splice(i, 1);
  }
}

function drawFx() {
  for (const f of fx) {
    const a = 1 - f.t / f.life;
    if (f.kind === 'slash') {
      const p = f.t / f.life;
      const size = f.size * (0.7 + easeOut(p) * 0.6);
      drawCrescent(f.x, f.y, f.rot + (1 - p) * 0.35, size, f.color, f.edge, a * a, f.thick, 0.82, 0.66);
    } else if (f.kind === 'bolt') {
      if (!f.pts) f.pts = boltPoints(f.fromX == null ? f.x : f.fromX, f.y - f.up, f.x, f.y, 16);
      drawBolt(f.pts, f.color, f.width * a, a);
      if (f.t < 6) {
        ring(f.x, f.y, f.color, 12, 8, 16, 4);
      }
    } else if (f.kind === 'mark') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * .9;
      ctx.strokeStyle = f.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.radius, f.radius * .3, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = a * .25;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.radius * .6, f.radius * .18, 0, 0, TAU); ctx.fill();
      ctx.restore();
    } else if (f.kind === 'wave') {
      const front = f.x;
      const ox = f.ox || f.ow || front;
      const prog = clamp(f.t / 9, 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      // glowing seam along the ground
      const grad = ctx.createLinearGradient(ox, 0, front, 0);
      grad.addColorStop(0, hexA(f.color, 0));
      grad.addColorStop(1, hexA(f.color, .55 * a));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(ox, f.y - 2); ctx.lineTo(front, f.y - 2); ctx.stroke();
      // rising shock lip
      ctx.strokeStyle = hexA('#fff3c4', .45 * a);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(front - f.dir * 34, f.y);
      ctx.quadraticCurveTo(front - f.dir * 12, f.y - 46 * prog, front + f.dir * 8, f.y - 12 * prog);
      ctx.stroke();
      ctx.restore();
      if (f.t % 3 === 0) {
        part({ x: front + f.dir * rand(-10, 10), y: f.y - rand(0, 14), vx: -f.dir * rand(1, 4), vy: rand(-7, -2), g: .35, life: randi(14, 26), max: 26, size: rand(2, 5), color: pick(['#ffcf5c', '#a8946a', '#fff3c4']), kind: 'shard', rot: rand(0, TAU), spin: rand(-.2, .2) });
      }
    } else if (f.kind === 'crack') {
      drawCrack(f, a);
    } else if (f.kind === 'line') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a; ctx.strokeStyle = f.color; ctx.lineWidth = f.width * a;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
      ctx.restore();
    } else if (f.kind === 'text') {
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 2);
      ctx.font = `900 ${f.size}px Trebuchet MS, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color; ctx.shadowBlur = 14;
      ctx.fillText(f.text, f.x, f.y - f.t * 1.4);
      ctx.restore();
    }
  }
}

const crackCache = new WeakMap();
function drawCrack(f, a) {
  let pts = crackCache.get(f);
  if (!pts) {
    pts = [];
    let x = 0, y = 0;
    for (let i = 0; i < 9; i++) {
      x += 18 + Math.random() * 26;
      y = rand(-7, 7);
      pts.push([x * f.dir, y]);
    }
    crackCache.set(f, pts);
  }
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    const grow = clamp(f.t / f.life * 3, 0, 1);
    if (i / pts.length > grow) break;
    ctx.globalAlpha = a;
    ctx.strokeStyle = f.color; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    ctx.globalAlpha = a * .3; ctx.strokeStyle = '#fff6d0'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
  }
  ctx.restore();
}

/* ---------------- projectiles ---------------- */
const projectiles = [];

function proj(o) {
  projectiles.push(Object.assign({
    x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, r: 22, life: 90, max: 90, owner: null, kind: 'orb', hitCd: 0,
    color: '#fff', spin: 0, rot: 0, dmg: 8, kb: 5, ks: 14, dead: false, onHit: null
  }, o));
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.px = p.x; p.py = p.y;
    p.x += p.vx; p.y += p.vy;
    p.rot += p.spin;
    if (p.kind === 'fireball') {
      if (Math.random() < .85) trail(p.x + rand(-4, 4), p.y + rand(-4, 4), pick(['#ff7a18', '#ffb347', '#ff3b00']), rand(2, 5), 20, -.5);
      if (Math.random() < .3) part({ x: p.x, y: p.y, vx: rand(-.5, .5), vy: rand(-1.4, -.4), life: 26, max: 26, size: rand(3, 7), color: '#5a2a10', kind: 'smoke', g: -.01, glow: false });
    }
    if (p.kind === 'wind') {
      if (Math.random() < .9) trail(p.x, p.y + rand(-10, 10), pick(['#7cffb2', '#c8ffe0']), rand(2, 4), 14);
    }
    if (p.kind === 'IceShard') {
      if (Math.random() < .8) trail(p.x, p.y, pick(['#9fe8ff', '#e5fbff']), rand(2, 4), 14);
    }
    if (p.kind === 'moonbeam') {
      if (Math.random() < .9) trail(p.x + rand(-6, 6), p.y + rand(-14, 14), '#dff3ff', rand(2, 5), 18);
    }
    if (p.hitCd > 0) p.hitCd--;
    if (p.owner) {
      const tg = p.owner.target;
      if (p.hitCd <= 0 && tg && tg.alive && !tg.invuln &&
          segmentHitsBody(p.px, p.py, p.x, p.y, p.r, tg)) {
        const hp = hitPointOnBody(p.x, p.y, tg);
        const ok = tg.hurt({ dmg: p.dmg, kb: p.kb, ks: p.ks, dir: Math.sign(p.vx) || p.face || p.owner.face, src: p.owner });
        if (ok) {
          burst(hp.x, hp.y, p.color || p.owner.data.accent, 10, 5);
          sparks(hp.x, hp.y, '#ffffff', 4, 5);
          if (p.kind !== 'axe') p.hit = true;
          else p.hitCd = 26;
        }
      }
    }
    const off = p.x < -120 || p.x > W + 120 || p.y < -220 || p.y > H + 80;
    if (--p.life <= 0 || off || p.hit || p.dead) projectiles.splice(i, 1);
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (p.kind === 'fireball') {
      const r = p.r;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.9);
      g.addColorStop(0, '#fff6c9'); g.addColorStop(.35, '#ffc43d'); g.addColorStop(.7, '#ff5a00'); g.addColorStop(1, 'rgba(255,40,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.9, 0, TAU); ctx.fill();
      ctx.globalAlpha = .9; ctx.fillStyle = '#fffbe6';
      ctx.beginPath(); ctx.arc(p.x, p.y, r * .42, 0, TAU); ctx.fill();
    } else if (p.kind === 'wind') {
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      drawCrescent(0, 0, 0, p.r * 1.15, '#7cffb2', '#eafff2', 1, 1.1);
    } else if (p.kind === 'IceShard') {
      ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.fillStyle = '#ccf6ff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.r, 0); ctx.lineTo(-p.r * .6, p.r * .5); ctx.lineTo(-p.r * .25, 0); ctx.lineTo(-p.r * .6, -p.r * .5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (p.kind === 'darkcrescent') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      // black anti-magic blade body
      ctx.beginPath();
      ctx.arc(0, p.r * .42, p.r, Math.PI, TAU, false);
      ctx.arc(0, p.r * .42, p.r * .62, TAU, Math.PI, true);
      ctx.closePath();
      ctx.fillStyle = '#0b0b12'; ctx.fill();
      ctx.strokeStyle = '#e8323c'; ctx.lineWidth = 5; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,90,99,.9)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = .5;
      ctx.fillStyle = 'rgba(255,60,80,.35)';
      ctx.fill();
    } else if (p.kind === 'axe') {
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.scale(1.45, 1.45);
      drawAxeShape(0, 0, 0, '#aab6cc', '#ffcf5c');
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gg = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 46);
      gg.addColorStop(0, 'rgba(255,210,110,.35)');
      gg.addColorStop(1, 'rgba(255,180,60,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(p.x, p.y, 46, 0, TAU); ctx.fill();
    } else if (p.kind === 'moonbeam') {
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      const g = ctx.createLinearGradient(-p.r, 0, p.r * 1.6, 0);
      g.addColorStop(0, 'rgba(190,235,255,0)'); g.addColorStop(.55, 'rgba(230,250,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,.95)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.6, p.r * .5, 0, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}

/* ---------------- shared ult helpers ---------------- */
function waveHit(f, target) {
  if (f.hitDone || !target || !target.alive) return;
  if (target.x * f.dir < f.x * f.dir - 30) return;
  if (target.x * f.dir > f.x * f.dir + f.dist) return;
  if (target.airY > 150) return;
  f.hitDone = true;
  target.hurt({ dmg: f.dmg, kb: f.kb || 10, ks: f.ks || 26, up: f.up || -7, dir: f.dir, src: f.owner });
  if (f.label) fxText({ x: target.x, y: target.y - 120, text: f.label, color: f.color, size: 24 });
  shake(10); hitspark(target.x, target.y - target.h * .55, f.color, 18);
}

function hitspark(x, y, color, n = 14) {
  burst(x, y, '#ffffff', Math.ceil(n * .5), 7, { size: 4 });
  burst(x, y, color, n, 6, { size: 3 });
  ring(x, y, color, 8, 6, 16, 3);
  part({ x, y, kind: 'ring', color: '#ffffff', size: 4, grow: 9, life: 12, max: 20, width: 2 });
}

/* rotating magic circle (Yuno / Frost) */
function fxSpell(o) { fx.push(Object.assign({ kind: 'spell', x: 0, y: 0, t: 0, life: 50, color: '#7cffb2', r: 70, rot: 0, spin: .02, follow: null }, o)); }
function drawSpells() {
  for (const f of fx) {
    if (f.kind !== 'spell') continue;
    const a = Math.min(1, (1 - f.t / f.life) * 2);
    const r = f.r * (0.6 + 0.4 * easeOut(Math.min(1, f.t / 14)));
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * .5;
    ctx.strokeStyle = f.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * .32, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = a * .3;
    ctx.beginPath(); ctx.ellipse(0, 0, r * .66, r * .21, 0, 0, TAU); ctx.stroke();
    ctx.rotate(f.rot);
    ctx.globalAlpha = a * .45; ctx.lineWidth = 1.3;
    for (let i = 0; i < 6; i++) {
      const ang = i / 6 * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r * .66, Math.sin(ang) * r * .21);
      ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r * .32);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* shared battle-axe drawing (throw + held) */
function drawAxeShape(cx, cy, ang, metal = '#9aa3b5', glow = '#ffcf5c') {
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(ang);
  // handle
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(0, -34); ctx.stroke();
  ctx.strokeStyle = '#3a281a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(0, -34); ctx.stroke();
  // head
  const head = () => {
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.bezierCurveTo(20, -36, 28, -18, 22, 2);
    ctx.lineTo(0, -4);
    ctx.lineTo(-22, 2);
    ctx.bezierCurveTo(-28, -18, -20, -36, 0, -38);
    ctx.closePath();
  };
  ctx.fillStyle = metal;
  ctx.strokeStyle = '#e9eefc'; ctx.lineWidth = 2;
  head(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = glow; ctx.lineWidth = 1.4;
  ctx.globalAlpha = .9;
  ctx.beginPath(); ctx.moveTo(-20, -4); ctx.lineTo(0, -30); ctx.lineTo(20, -4); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#5a4632';
  ctx.beginPath(); ctx.arc(0, -4, 5, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ice spike + moon backdrop effects */
function fxSpike(o) { fx.push(Object.assign({ kind: 'spike', x: 0, y: 0, t: 0, life: 34, color: '#bfefff', dir: 1, h: 96 }, o)); }
function fxMoon(o) { fx.push(Object.assign({ kind: 'moon', x: 0, y: 0, t: 0, life: 90, r: 96, color: '#eef6ff' }, o)); }

const _drawFx2 = drawFx;
drawFx = function () {
  _drawFx2();
  for (const f of fx) {
    if (f.kind === 'darkwave') {
      const p2 = f.t / f.life;
      drawDarkWave(f.x, f.y, f.rot + (1 - p2) * .25, f.size * (0.85 + .35 * easeOut(p2)), f.fill, f.edge, 1 - p2 * p2, f.thick, f.span || 0.8);
    } else if (f.kind === 'spike') {
      const p = clamp(f.t / 8, 0, 1);
      const out = f.t > f.life - 10 ? (f.life - f.t) / 10 : 1;
      const h = f.h * easeOut(p) * out;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.globalAlpha = .95;
      const g = ctx.createLinearGradient(0, 0, 0, -h);
      g.addColorStop(0, 'rgba(140,220,255,.55)');
      g.addColorStop(.6, 'rgba(200,244,255,.9)');
      g.addColorStop(1, 'rgba(255,255,255,1)');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-6, -h * .55);
      ctx.lineTo(0, -h);
      ctx.lineTo(8, -h * .5);
      ctx.lineTo(18, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = .5;
      ctx.fillStyle = '#7fd4ff';
      ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-12, -h * .38); ctx.lineTo(-2, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(24, -h * .3); ctx.lineTo(30, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (f.kind === 'pillar') {
      const a = 1 - f.t / f.life;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(f.x - f.w, 0, f.x + f.w, 0);
      g.addColorStop(0, 'rgba(255,232,61,0)');
      g.addColorStop(.42, hexA(f.color, .30 * a));
      g.addColorStop(.5, hexA('#ffffff', .85 * a));
      g.addColorStop(.58, hexA(f.color, .30 * a));
      g.addColorStop(1, 'rgba(255,232,61,0)');
      ctx.fillStyle = g;
      ctx.fillRect(f.x - f.w, 0, f.w * 2, f.y);
      ctx.restore();
    } else if (f.kind === 'moon' && !f.behind) {
      drawMoonShape(f);
    }
  }
};

/* final axe design: shaft along +x, double-bladed head at the tip */
function drawAxeShape(cx, cy, ang, metal = '#9aa3b5', glow = '#ffcf5c') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  // shaft
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = 5.5;
  ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(26, 0); ctx.stroke();
  ctx.strokeStyle = '#3a281a'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(26, 0); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = '#2c1e13'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-26 + i * 7, -2.6); ctx.lineTo(-24 + i * 7, 2.6); ctx.stroke();
  }
  // head
  const blade = (dirIn) => {
    ctx.beginPath();
    ctx.moveTo(dirIn * 24, 0);
    ctx.quadraticCurveTo(dirIn * 40, -6, dirIn * 46, -26);
    ctx.lineTo(dirIn * 58, -20);
    ctx.quadraticCurveTo(dirIn * 52, -8, dirIn * 46, 0);
    ctx.quadraticCurveTo(dirIn * 52, 8, dirIn * 58, 20);
    ctx.lineTo(dirIn * 46, 26);
    ctx.quadraticCurveTo(dirIn * 40, 6, dirIn * 24, 0);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(24, 0, 58, 0);
  g.addColorStop(0, '#3d4557');
  g.addColorStop(.45, metal);
  g.addColorStop(1, '#aab6cc');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#252d3d'; ctx.lineWidth = 2;
  blade(1); ctx.fill(); ctx.stroke();
  blade(-1); ctx.fill(); ctx.stroke();
  // rune line
  ctx.strokeStyle = glow; ctx.lineWidth = 1.4; ctx.globalAlpha = .85;
  ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(56, 0); ctx.stroke();
  ctx.globalAlpha = 1;
  // collar
  ctx.fillStyle = '#8d7654';
  ctx.beginPath(); ctx.arc(24, 0, 5, 0, TAU); ctx.fill();
  ctx.restore();
}


function drawMoonShape(f) {
  const a = Math.min(1, f.t / 12) * Math.min(1, (f.life - f.t) / 20);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(f.x, f.y, f.r * .2, f.x, f.y, f.r * 1.4);
  g.addColorStop(0, `rgba(255,255,255,${a * .8})`);
  g.addColorStop(.6, `rgba(210,236,255,${a * .3})`);
  g.addColorStop(1, 'rgba(150,200,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 1.4, 0, TAU); ctx.fill();
  ctx.fillStyle = `rgba(246,250,255,${a * .92})`;
  ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(170,190,225,${a * .22})`;
  ctx.beginPath(); ctx.arc(f.x - f.r * .3, f.y - f.r * .2, f.r * .16, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(f.x + f.r * .28, f.y + f.r * .3, f.r * .22, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawMoonBg() {
  for (const f of fx) if (f.kind === 'moon' && f.behind) drawMoonShape(f);
}

/* ---------------- body hitboxes ---------------- */
function bodyBox(f) {
  const h = f.h || 140;
  return {
    x1: f.x - 24, x2: f.x + 24,
    y1: f.y - (f.airY || 0) - h * 0.98,
    y2: f.y - (f.airY || 0) - 8
  };
}

function rectsOverlap(a, b) {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

/* circle vs body box */
function pointHitsBody(x, y, r, f) {
  const b = bodyBox(f);
  const cx = clamp(x, b.x1, b.x2);
  const cy = clamp(y, b.y1, b.y2);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

/* swept circle vs body box (prevents fast projectiles tunnelling) */
function segmentHitsBody(x1, y1, x2, y2, r, f) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.min(24, Math.ceil(dist / 7) + 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (pointHitsBody(lerp(x1, x2, t), lerp(y1, y2, t), r, f)) return true;
  }
  return false;
}

/* where on the body a projectile landed (for sparks) */
function hitPointOnBody(x, y, f) {
  const b = bodyBox(f);
  return { x: clamp(x, b.x1, b.x2), y: clamp(y, b.y1, b.y2) };
}

/* solid anti-magic blade wave (black core + hot rim) */
function drawDarkWave(x, y, rot, size, fill, edge, alpha = 1, thick = 1, span = 0.8) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  const oy = 0.42 * size;
  const path = () => {
    ctx.beginPath();
    const cut = (1 - span) * Math.PI / 2;
    ctx.arc(0, oy, size, Math.PI + cut, TAU - cut, false);
    ctx.arc(0, oy, size * 0.7, TAU - cut, Math.PI + cut, true);
    ctx.closePath();
  };
  ctx.globalCompositeOperation = 'source-over';
  path();
  const g = ctx.createLinearGradient(0, oy - size, 0, oy);
  g.addColorStop(0, fill); g.addColorStop(1, '#241018');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = 3.2 * thick; ctx.lineJoin = 'round'; path(); ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = hexA('#ffffff', .55); ctx.lineWidth = 1.2 * thick; path(); ctx.stroke();
  ctx.restore();
}

function fxDarkWave(o) {
  fx.push(Object.assign({ kind: 'darkwave', x: 0, y: 0, t: 0, life: 16, rot: 0, size: 62, fill: '#0a0a12', edge: '#ff4a55', thick: 1.6, span: 0.8 }, o));
}
