/* ============================================================
   game.js — fighter logic, stage, HUD, screens, main loop
   ============================================================ */
'use strict';

const GROUND = 618;
const LEFT_WALL = 70;
const RIGHT_WALL = W - 70;
const GRAV = 0.92;

/* ---------------- fighter ---------------- */
class Fighter {
  constructor(charId, x, face, slot) {
    this.data = CHAR[charId];
    this.slot = slot;
    this.scale = 1;
    this.x = x; this.y = GROUND; this.face = face;
    this.airY = 0; this.vy = 0; this.vx = 0;
    this.maxHp = this.data.hp; this.hp = this.maxHp;
    this.meter = 0; this.locked = false;
    this.state = 'idle'; this.stun = 0;
    this.atk = null; this.atkT = 0; this.atkDur = 26; this.hitDone = false; this.atkSide = 1;
    this.ult = null; this.ultT = 0; this.ultSnap = {}; this.pose = 'cast'; this.poseT = 0;
    this.combo = 0; this.comboT = 0;
    this.animT = rand(0, 100); this.walkPhase = 0; this.walking = false;
    this.invuln = 0; this.hurtFlash = 0;
    this.aura = 0; this.demon = 0; this.frozen = 0; this.held = false;
    this.capeLag = 0; this.alpha = 1; this.hide = false; this.noWeapon = false;
    this.phoenixActive = false; this.phoenixRot = 0; this.koRot = 0;
    this.ghost = false; this.other = null; this.opponentName = '';
    this.comboStep = 1; this.lunge = 0; this.dashT = 0; this.dashDir = 1;
    this.tapDir = 0; this.tapT = -99; this.landT = 0; this.trail = [];
    this.jumpT = 0; this.wasAir = false;
    this.cur = null; this._joints = null; this._prevJoints = null;
  }

  get target() { return this.other; }
  get alive() { return this.state !== 'ko'; }
  get h() { return 108 * (this.scale || 1); }

  reset(x, face) {
    this.x = x; this.y = GROUND; this.face = face;
    this.airY = 0; this.vy = 0; this.vx = 0;
    this.hp = this.maxHp; this.meter = 0; this.locked = false;
    this.state = 'idle'; this.stun = 0; this.koRot = 0;
    this.atk = null; this.atkT = 0; this.ult = null; this.ultT = 0;
    this.pose = 'cast'; this.poseT = 0; this.alpha = 1; this.hide = false;
    this.noWeapon = false; this.phoenixActive = false; this.held = false;
    this.frozen = 0; this.demon = 0; this.aura = 0; this.invuln = 0;
    this.combo = 0; this.comboT = 0; this.capeLag = 0; this.stun = 0;
    this.comboStep = 1; this.lunge = 0; this.dashT = 0; this.landT = 0; this.trail = []; this.jumpT = 0;
    this.cur = null; this._joints = null; this._prevJoints = null;
  }

  gainMeter(n) {
    if (this.locked && this.meter < 100) {
      this.meter = Math.min(100, this.meter + n);
      if (this.meter >= 100) {
        this.locked = false;
        fxText({ x: this.x, y: this.y - 150, text: 'ULT READY!', color: this.data.accent, size: 22 });
        ring(this.x, this.y - 60, this.data.accent, 16, 6, 22, 4);
      }
    } else if (!this.locked) {
      this.meter = Math.min(100, this.meter + n);
    }
  }

  hurt(o) {
    if (!this.alive || this.invuln > 0) return false;
    let dmg = o.dmg;
    if (o.src && o.src.demon > 0) dmg *= 1.28;
    if (this.frozen > 0) dmg *= 1.15;
    dmg = Math.round(dmg);
    this.hp = Math.max(0, this.hp - dmg);
    this.hurtFlash = 8;
    this.gainMeter(dmg * 0.85);
    if (o.src && o.src !== this) o.src.gainMeter(dmg * 1.35);
    const dir = o.dir === 0 ? 0 : (o.dir || (o.src ? o.src.face : 1));
    if (!this.held) {
      this.vx = dir * (o.kb || 4);
      if ((o.up || 0) !== 0) { this.vy = Math.abs(o.up || 0) * 1.05; }
      this.state = 'stun'; this.stun = o.ks || 12;
      this.atk = null; this.walking = false;
    }
    if (o.src && o.src !== this && !o.noCombo) {
      o.src.combo++; o.src.comboT = 70;
    }
    if (this.hp <= 0) this.ko(dir);
    return true;
  }

  ko(dir) {
    if (this.target) this.target.held = false;
    this.state = 'ko'; this.stun = 0; this.ult = null; this.held = false;
    this.phoenixActive = false; this.hide = false;
    this.vx = (dir || 1) * 8; this.vy = 9; this.koRot = 0;
    this.koSpin = (dir || 1) * 0.16;
    if (typeof onKO === 'function') onKO(this);
  }
}

/* ---------------- fighter update ---------------- */
Fighter.prototype.startAttack = function (kind, chain) {
  if (this.state !== 'idle' || this.held || this.stun > 0 || this.ult) return;
  const cancelling = !!this.atk && this.atkT > this.atkDur * 0.46;
  if (this.atk && !cancelling) return;
  if (this.airY > 0) kind = 'airkick';
  if (cancelling && chain) {
    this.comboStep = Math.min(3, (this.comboStep || 1) + 1);
    if (this.comboStep === 3) kind = 'kick';
  } else {
    this.comboStep = 1;
  }
  this.atk = kind;
  this.atkT = 0;
  this.atkDur = kind === 'punch' ? 22 : (kind === 'airkick' ? 34 : 30);
  this.hitDone = false;
  this.atkSide = this.face;
  this.lunge = kind === 'punch' ? (this.comboStep >= 2 ? 6.4 : 4.6) : 6.0;
  if (kind !== 'punch' && this.airY === 0) {
    fxSlash({ x: this.x + this.face * 46, y: this.y - this.h * .36, rot: 0.55 * this.face, size: 40, color: hexA(this.data.accent, .9), edge: '#ffffff', thick: .7, life: 9 });
  }
  if (this.airY === 0 && kind !== 'airkick') dust(this.x - this.face * 10, this.y, 3, '#7a86a6');
};

Fighter.prototype.startDash = function (dir) {
  if (this.dashT > 0 || this.state !== 'idle' || this.ult || this.held) return;
  this.dashT = 13;
  this.dashDir = dir;
  this.vx = dir * 11;
  this.invuln = Math.max(this.invuln, 8);
  dust(this.x, this.y, 6, '#8b98b8');
  ring(this.x, this.y, hexA(this.data.accent, .7), 8, 4, 12, 2);
  if (Math.random() < .8) burst(this.x - dir * 10, this.y - 40, this.data.accent, 5, 3);
};

Fighter.prototype.tryUlt = function (which) {
  if (this.state !== 'idle' || this.ult || this.atk || this.held) return;
  const def = this.data[which];
  if (!def) return;
  if (this.locked || this.meter < def.cost) {
    this.meterFlash = 16;
    if (this.locked) fxText({ x: this.x, y: this.y - 140, text: 'RECHARGING', color: '#8f9ab5', size: 18 });
    return;
  }
  this.meter = 0;
  this.locked = true;
  this.ult = which;
  this.ultT = 0;
  this.ultSnap = {};
  this.atk = null;
  this.vx = 0; this.vy = 0; this.airY = 0;
  this.pose = 'windup'; this.poseT = 0;
  this.alpha = 1; this.hide = false; this.noWeapon = false; this.phoenixActive = false;
  announceUlt(this, def.cost >= 100 ? this.data.ultNameR : this.data.ultNameE, this.data.accent, def.cost >= 100);
  flash(this.data.accent, def.cost >= 100 ? .16 : .1);
};

Fighter.prototype.endUlt = function () {
  // if a thrown axe is still out, make it come home instantly
  for (const p of projectiles) {
    if (p.kind === 'axe' && p.owner === this) { p.dead = true; }
  }
  this.ult = null; this.ultT = 0; this.ultSnap = {};
  this.airY = 0; this.vy = 0; this.pose = 'windup'; this.poseT = 0;
  this.hide = false; this.alpha = 1; this.noWeapon = false;
  this.phoenixActive = false; this.phoenixRot = 0;
  this.invuln = Math.max(this.invuln, 12);
  this.state = 'idle';
  this.held = false;
  if (this.target) this.target.held = false;
};

Fighter.prototype.update = function () {
  this.animT++;
  if (this.landT > 0) this.landT--;
  if (this.trail.length) {
    for (let i = this.trail.length - 1; i >= 0; i--) if (--this.trail[i].t <= 0) this.trail.splice(i, 1);
  }
  if (this.invuln > 0) this.invuln--;
  if (this.hurtFlash > 0) this.hurtFlash--;
  if (this.frozen > 0) this.frozen--;
  if (this.comboT > 0) { this.comboT--; if (this.comboT === 0) this.combo = 0; }
  if (this.meterFlash > 0) this.meterFlash--;
  if (this.demon > 0) {
    this.demon--;
    if (this.demon % 4 === 0) trail(this.x + rand(-26, 26), this.y - rand(10, 120), pick(['#e8323c', '#3a0c12']), rand(2, 5), 22, -.5);
    if (this.demon === 0) fxText({ x: this.x, y: this.y - 140, text: 'DEMON FORM END', color: '#8f9ab5', size: 16 });
  }
  this.aura = approach(this.aura, 0, 0.02);
  this.capeLag = approach(this.capeLag, clamp((this.vx * this.face) * 0.12, -1, 1), 0.09);
  if (this.hurtFlash > 0) this.alpha = 1;

  if (this.state === 'ko') {
    if (this.airY > 0 || this.vy > 0) {
      this.airY += this.vy; this.vy -= GRAV;
      if (this.airY <= 0) { this.airY = 0; this.vy = 0; this.vx *= 0.4; }
    } else this.vx *= 0.86;
    this.x = clamp(this.x + this.vx, 40, W - 40);
    this.koRot = approach(this.koRot || 0, 1.5, 0.11);
    return;
  }

  if (this.held) return;
  if (this.frozen > 0) { this.vx = 0; return; }

  if (this.ult) {
    this.ultT++;
    this.data[this.ult].tick(this, this.ultT, this.ultSnap);
    this.x = clamp(this.x, LEFT_WALL, RIGHT_WALL);
    if (this.ultT >= this.data[this.ult].dur) this.endUlt();
    return;
  }

  if (this.stun > 0) {
    this.stun--;
    this.applyPhysics();
    if (this.stun === 0 && this.state === 'stun') this.state = 'idle';
    return;
  }

  /* attack */
  if (this.atk) {
    this.atkT++;
    const k = this.atkT / this.atkDur;
    if (!this.hitDone && k > 0.28 && k < 0.78) this.checkHit();
    // weapon / fist motion trail
    if (k > 0.3 && k < 0.62 && this.animT % 2 === 0) {
      const reach = (this.atk === 'punch' ? 62 : 78) * (this.data.reach || 1) * this.scale;
      const tx = this.x + this.face * reach * (0.6 + k * 0.6);
      const ty = this.y - this.airY - this.h * (this.atk === 'kick' ? 0.32 : 0.6);
      trail(tx, ty, this.data.id === 'asta' ? '#e8323c' : this.data.accent, rand(2.5, 4.5), 12);
    }
    if (this.atkT >= this.atkDur) this.atk = null;
  }

  if (this.dashT > 0) {
    this.dashT--;
    this.vx = this.dashDir * (4 + this.dashT * 0.7);
    this.walking = false;
    if (this.dashT % 2 === 0) this.trail.push({ x: this.x, y: this.y, airY: this.airY, face: this.face, t: 11 });
    this.applyPhysics();
    return;
  }
  if (this.ci && ALLOW_INPUT) this.handleInput(this.ci);
  else if (this.ci && this.target && this.target.alive) this.face = dirTo(this.x, this.target.x);
  this.applyPhysics();
};

Fighter.prototype.handleInput = function (ci) {
  const t = this.target;
  if (!this.atk && !this.ult) {
    if (t && t.alive && Math.abs(t.x - this.x) > 12) this.face = dirTo(this.x, t.x);
  }
  const grounded = this.airY === 0;
  let mx = 0;
  if (keys[ci.left]) mx--;
  if (keys[ci.right]) mx++;

  /* double-tap dash */
  if (grounded && !this.atk && !this.ult) {
    if (pressed[ci.left]) {
      if (this.tapDir === -1 && G.time - this.tapT <= 16) this.startDash(-1);
      this.tapDir = -1; this.tapT = G.time;
    } else if (pressed[ci.right]) {
      if (this.tapDir === 1 && G.time - this.tapT <= 16) this.startDash(1);
      this.tapDir = 1; this.tapT = G.time;
    }
  }

  const boost = this.demon > 0 ? 1.15 : 1;
  const spd = this.data.speed * boost * (this.atk ? 0.25 : 1);
  if (this.atk) {
    this.walking = false;
  } else if (mx !== 0) {
    this.vx = mx * spd * (grounded ? 1 : 0.85);
    if (grounded) {
      this.walking = true;
      this.walkPhase += 0.2 * boost;
      if (Math.random() < 0.12) dust(this.x - mx * 8, this.y, 1, '#66708c');
    }
  } else if (grounded) {
    this.vx *= 0.5;
    this.walking = false;
  }

  if (pressed[ci.jump] && grounded && !this.atk) {
    this.vy = this.data.jump * (this.demon > 0 ? 1.06 : 1);
    this.airY = 0.01;
    this.jumpT = 0;
    this.landT = 0;
    dust(this.x, this.y, 7, '#7a86a6');
    ring(this.x, this.y, hexA(this.data.accent, .8), 7, 4, 12, 2);
  }
  if (pressed[ci.punch]) this.startAttack('punch', true);
  if (pressed[ci.kick]) this.startAttack('kick', true);
  if (pressed[ci.e]) this.tryUlt('e');
  if (pressed[ci.r]) this.tryUlt('r');
};

Fighter.prototype.applyPhysics = function () {
  if (this.airY > 0 || this.vy > 0) {
    this.airY += this.vy;
    this.vy -= GRAV;
    this.jumpT++;
    if (this.airY <= 0) {
      this.airY = 0;
      this.landT = 12;
      if (this.vy < -6) {
        dust(this.x, this.y, 8, '#7a86a6');
        ring(this.x, this.y, hexA(this.data.accent, .5), 6, 4, 11, 2);
      }
      this.vy = 0;
    }
  }
  if (this.lunge > 0.4) {
    this.vx = this.face * this.lunge;
    this.lunge *= 0.8;
  } else this.lunge = 0;
  this.x = clamp(this.x + this.vx, LEFT_WALL, RIGHT_WALL);
};

Fighter.prototype.attackBox = function () {
  let base = this.atk === 'punch' ? 84 : 102;
  if (this.atk === 'airkick') base = 90;
  const reach = base * (this.data.reach || 1) * (this.scale || 1);
  const y1 = this.y - this.airY - this.h * 0.98;
  const y2 = this.y - this.airY - 2;
  return {
    x1: this.face > 0 ? this.x - 8 : this.x - reach,
    x2: this.face > 0 ? this.x + reach : this.x + 8,
    y1, y2
  };
};

Fighter.prototype.checkHit = function () {
  const tg = this.target;
  if (!tg || !tg.alive) return;
  if (!rectsOverlap(this.attackBox(), bodyBox(tg))) return;
  this.hitDone = true;
  const heavy = this.atk === 'kick' || this.atk === 'airkick';
  const chain = this.atk === 'punch' ? (this.comboStep || 1) : 1;
  const dmgBase = heavy ? 9 : (chain >= 3 ? 8 : 6);
  const hy = tg.y - tg.airY - tg.h * (heavy ? 0.34 : 0.62);
  const hx = clamp(this.x + this.face * 40, tg.x - 20, tg.x + 20);
  const res = tg.hurt({
    dmg: dmgBase, kb: heavy ? 6.8 : 4.6,
    ks: heavy ? 18 : 13, up: heavy ? -4 : 0,
    dir: this.face, src: this
  });
  if (!res) return;
  this.hitFx(hx, hy);
};

Fighter.prototype.hitFx = function (x, y) {
  const id = this.data.id;
  const acc = this.data.accent;
  const heavy = this.atk === 'kick' || this.atk === 'airkick' || this.comboStep === 3;
  hitspark(x, y, acc, heavy ? 18 : 12);
  ring(x, y, '#ffffff', 5, 4, 9, 2);
  shake(heavy ? 8 : 4.5);
  hitstop(heavy ? 5 : 2);

  if (id === 'asta') {
    fxDarkWave({ x, y, rot: heavy ? 0.55 : -0.95, size: heavy ? 74 : 46, fill: '#0a0a12', edge: '#ff4a55', thick: heavy ? 2.1 : 1.4, life: waveLife(heavy), span: heavy ? .75 : .5 });
    fxDarkWave({ x, y, rot: heavy ? -0.5 : 0.8, size: heavy ? 48 : 30, fill: '#14060a', edge: '#ff8088', thick: 1, life: 11, span: .45 });
    sparks(x, y, '#ff4a55', heavy ? 14 : 9, 7);
    burst(x, y, '#1a0a10', heavy ? 12 : 7, 5, { glow: false, g: .05 });
    ring(x, y, '#e8323c', 8, 7, 16, 3);
    if (heavy) fxText({ x, y: y - 40, text: 'ANTI-MAGIC', color: '#ff6a74', size: 15, life: 26 });
  } else if (id === 'titan') {
    fxSlash({ x, y, rot: heavy ? 0.8 : -0.75, size: heavy ? 92 : 74, color: '#ffcf5c', edge: '#fff3c4', thick: 2, life: 15 });
    ring(x, y, '#ffcf5c', 10, 8, 15, 4);
    for (let i = 0; i < (heavy ? 7 : 4); i++) {
      part({ x, y, vx: rand(-5, 5), vy: rand(-6, 1), g: .35, life: rand(14, 24), max: 24, size: rand(3, 6), color: pick(['#a8946a', '#6f6355']), kind: 'shard', rot: rand(0, TAU), spin: rand(-.3, .3), glow: false });
    }
  } else if (id === 'ronin') {
    fxSlash({ x, y, rot: heavy ? 0.55 : -0.62, size: heavy ? 96 : 70, color: '#dfe9ff', edge: '#ffffff', thick: 1.3, life: 14 });
    fxLine({ x1: x - 46, y1: y + (heavy ? 34 : -30), x2: x + 46, y2: y - (heavy ? 34 : -30), color: '#c9d6ff', width: 2.5, life: 9 });
    sparks(x, y, '#ffffff', 8, 6);
  } else if (id === 'shadow') {
    fxSlash({ x, y, rot: heavy ? 0.7 : -0.7, size: heavy ? 74 : 58, color: '#b06bff', edge: '#e6d7ff', thick: 1.4, life: 13 });
    for (let i = 0; i < 5; i++) part({ x, y, vx: rand(-2, 2), vy: rand(-3, 0), life: 20, max: 20, size: rand(6, 12), color: '#2a1a3e', kind: 'smoke', g: -.02, glow: false });
  } else if (id === 'frost') {
    fxSlash({ x, y, rot: -0.7, size: 60, color: '#9fe8ff', edge: '#ffffff', thick: 1.2, life: 13 });
    for (let i = 0; i < 7; i++) part({ x, y, vx: rand(-4, 4), vy: rand(-5, 1), g: .2, life: 18, max: 18, size: rand(3, 7), color: '#dff8ff', kind: 'shard', rot: rand(0, TAU), spin: .2 });
  } else if (id === 'volt') {
    fxBolt({ x: x + 34, y: y + 44, fromX: x - 34, up: 100, color: '#ffe83d', width: 2.6, life: 11 });
    sparks(x, y, '#ffe83d', 10, 7);
    ring(x, y, '#ffe83d', 7, 6, 12, 3);
  } else if (id === 'blaze') {
    burst(x, y, '#ff8a2b', 14, 6, { g: -.02 });
    burst(x, y, '#ffd24a', 6, 4);
    ring(x, y, '#ff6a1a', 8, 7, 14, 3);
  } else {
    fxSlash({ x, y, rot: -0.7, size: 54, color: acc, edge: '#ffffff', thick: 1.1, life: 11 });
    ring(x, y, acc, 6, 5, 12, 2);
  }
};

/* ---------------- game state ---------------- */
const CONTROLS = [
  { left: 'a', right: 'd', jump: 'w', punch: 'f', kick: 'g', e: 'e', r: 'r' },
  { left: 'arrowleft', right: 'arrowright', jump: 'arrowup', punch: 'k', kick: 'l', e: 'o', r: 'p' }
];
const G = {
  state: 'loading', time: 0, loading: 0,
  p1: null, p2: null, intro: 0, koTimer: 0, winner: null,
  banner: null, sel: { c: [0, 1], locked: [false, false] }, endTimer: 0
};

function announceUlt(f, name, color, big) {
  G.banner = { name, sub: f.data.name, color, t: 0, life: big ? 96 : 74, big: !!big };
  if (big) { cam.dark = Math.max(cam.dark, .5); shake(8); }
}

const waveLife = h => (h ? 17 : 13);

function onKO(loser) {
  G.koTimer = 1;
  G.winner = loser.target;
  cam.slow = 90;
  flash('#ffffff', .55);
  shake(18);
  hitstop(8);
  burst(loser.x, loser.y - loser.airY - 70, '#ffffff', 26, 10);
  ring(loser.x, loser.y - loser.airY - 60, '#ffffff', 20, 14, 30, 6);
}

function startMatch(c1, c2) {
  clearTimers();
  particles.length = 0; fx.length = 0; projectiles.length = 0;
  cam.dark = 0; cam.flash = 0; cam.slow = 0; cam.shake = 0;
  G.p1 = new Fighter(c1, 360, 1, 0);
  G.p2 = new Fighter(c2, W - 360, -1, 1);
  G.p1.scale = 1.3; G.p2.scale = 1.3;
  G.p1.other = G.p2; G.p2.other = G.p1;
  G.p1.ci = CONTROLS[0]; G.p2.ci = CONTROLS[1];
  G.state = 'fight'; G.intro = 1; G.koTimer = 0; G.winner = null;
  G.banner = null; G.endTimer = 0;
  G.p1.meter = 0; G.p2.meter = 0;
}

/* ---------------- background ---------------- */
let bgCanvas = null;
function buildBackground() {
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = W; bgCanvas.height = H;
  const b = bgCanvas.getContext('2d');
  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const sky = b.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#070b16');
  sky.addColorStop(.35, '#111a30');
  sky.addColorStop(.62, '#1d2947');
  sky.addColorStop(.78, '#2b3355');
  sky.addColorStop(1, '#151a2b');
  b.fillStyle = sky; b.fillRect(0, 0, W, H);

  // moon
  const mg = b.createRadialGradient(980, 165, 20, 980, 165, 210);
  mg.addColorStop(0, 'rgba(220,236,255,.35)');
  mg.addColorStop(0.35, 'rgba(170,200,255,.1)');
  mg.addColorStop(1, 'rgba(120,160,255,0)');
  b.fillStyle = mg; b.beginPath(); b.arc(980, 165, 210, 0, TAU); b.fill();
  b.fillStyle = '#e8f0ff'; b.beginPath(); b.arc(980, 165, 82, 0, TAU); b.fill();
  b.fillStyle = 'rgba(180,200,235,.35)';
  b.beginPath(); b.arc(952, 148, 15, 0, TAU); b.fill();
  b.beginPath(); b.arc(1004, 186, 21, 0, TAU); b.fill();
  b.beginPath(); b.arc(960, 196, 10, 0, TAU); b.fill();

  // stars
  for (let i = 0; i < 180; i++) {
    const x = rnd() * W, y = rnd() * 400;
    const a = 0.15 + rnd() * .7;
    b.globalAlpha = a;
    b.fillStyle = '#dce8ff';
    b.fillRect(x, y, rnd() < .85 ? 1.6 : 2.6, rnd() < .85 ? 1.6 : 2.6);
  }
  b.globalAlpha = 1;

  // far mountains
  const ridge = (baseY, height, color, jag) => {
    b.fillStyle = color;
    b.beginPath(); b.moveTo(-40, H);
    let x = -40;
    b.lineTo(-40, baseY);
    while (x < W + 60) {
      const w = 90 + rnd() * 170;
      const h = height * (.45 + rnd() * .8);
      b.lineTo(x + w * .5, baseY - h);
      b.lineTo(x + w, baseY - h * jag * .2);
      x += w;
    }
    b.lineTo(W + 60, H); b.closePath(); b.fill();
  };
  ridge(520, 250, '#131c31', .2);
  ridge(560, 190, '#182238', .1);

  // torii / temple silhouettes
  b.fillStyle = '#0e1526';
  const pagoda = (cx, base, sc) => {
    for (let i = 0; i < 5; i++) {
      const w = (150 - i * 20) * sc, h = 26 * sc;
      const y = base - i * 54 * sc;
      b.beginPath();
      b.moveTo(cx - w / 2, y);
      b.lineTo(cx - w * .34, y - h);
      b.lineTo(cx + w * .34, y - h);
      b.lineTo(cx + w / 2, y);
      b.closePath(); b.fill();
      b.fillRect(cx - w * .3, y - 30 * sc, w * .6, 30 * sc);
    }
  };
  pagoda(210, 545, 1.15);
  pagoda(1090, 552, .95);
  b.fillRect(0, 540, W, 24);

  // lantern glows
  for (const lx of [150, 320, 900, 1120]) {
    const g = b.createRadialGradient(lx, 470, 2, lx, 470, 60);
    g.addColorStop(0, 'rgba(255,196,90,.5)');
    g.addColorStop(1, 'rgba(255,150,40,0)');
    b.fillStyle = g; b.beginPath(); b.arc(lx, 470, 60, 0, TAU); b.fill();
    b.fillStyle = '#ffcf7a'; b.beginPath(); b.arc(lx, 470, 5, 0, TAU); b.fill();
  }

  // ground
  const gg = b.createLinearGradient(0, GROUND - 30, 0, H);
  gg.addColorStop(0, '#232c44');
  gg.addColorStop(.25, '#161d30');
  gg.addColorStop(1, '#0a0e18');
  b.fillStyle = gg; b.fillRect(0, GROUND - 26, W, H - GROUND + 26);
  b.strokeStyle = 'rgba(150,190,255,.35)'; b.lineWidth = 2;
  b.beginPath(); b.moveTo(0, GROUND - 26); b.lineTo(W, GROUND - 26); b.stroke();
  b.strokeStyle = 'rgba(120,170,255,.12)'; b.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const y = GROUND - 20 + i * 13;
    b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke();
  }
  b.strokeStyle = 'rgba(120,170,255,.09)';
  for (let i = -8; i <= 8; i++) {
    b.beginPath(); b.moveTo(W / 2 + i * 60, GROUND - 22); b.lineTo(W / 2 + i * 190, H); b.stroke();
  }
}

/* ---------------- HUD ---------------- */
function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFighterHud(f, side) {
  const D = f.data;
  const bw = 430, bh = 22;
  const x = side === 0 ? 40 : W - 40 - bw;
  const y = 34;
  const hpR = clamp(f.hp / f.maxHp, 0, 1);

  ctx.save();
  // frame
  ctx.fillStyle = 'rgba(6,10,20,.72)';
  rrect(x - 4, y - 4, bw + 8, bh + 10, 6); ctx.fill();

  // hp
  const g = ctx.createLinearGradient(x, y, x + bw, y);
  g.addColorStop(0, '#39e58a'); g.addColorStop(.62, '#b8e84a'); g.addColorStop(1, '#ffcf4a');
  ctx.fillStyle = 'rgba(16,9,16,.92)';
  rrect(x, y, bw, bh, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  rrect(x, y, bw, bh, 4); ctx.fill();
  ctx.fillStyle = g;
  ctx.globalAlpha = hpR > 0 ? 1 : 0;
  if (side === 0) { rrect(x, y, Math.max(4, bw * hpR), bh, 4); ctx.fill(); }
  else { rrect(x + bw * (1 - hpR), y, Math.max(4, bw * hpR), bh, 4); ctx.fill(); }
  ctx.globalAlpha = 1;
  // damage tint
  if (f.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255,60,60,${f.hurtFlash / 22})`;
    rrect(x, y, bw, bh, 4); ctx.fill();
  }
  // sheen
  ctx.globalAlpha = .18; ctx.fillStyle = '#ffffff';
  rrect(x, y + 2, bw, 6, 3); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1;
  rrect(x, y, bw, bh, 4); ctx.stroke();

  // name
  ctx.font = '900 21px Trebuchet MS, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = D.accent;
  ctx.shadowColor = D.accent; ctx.shadowBlur = 12;
  const nameW = ctx.measureText(D.name).width;
  if (side === 0) { ctx.textAlign = 'left'; ctx.fillText(D.name, x, y - 12); }
  else { ctx.textAlign = 'right'; ctx.fillText(D.name, x + bw, y - 12); }
  ctx.shadowBlur = 0;
  ctx.font = '600 11px Trebuchet MS, sans-serif';
  ctx.fillStyle = 'rgba(210,225,255,.65)';
  if (side === 0) { ctx.textAlign = 'left'; ctx.fillText(D.title, x + nameW + 14, y - 12); }
  else { ctx.textAlign = 'right'; ctx.fillText(D.title, x + bw - nameW - 14, y - 12); }

  // meter
  const my = y + bh + 10, mw = bw, mh = 12;
  ctx.fillStyle = 'rgba(6,10,20,.8)';
  rrect(x, my, mw, mh, 6); ctx.fill();
  const mg = ctx.createLinearGradient(x, my, x + mw, my);
  const ready = !f.locked && f.meter >= 50;
  if (f.locked) { mg.addColorStop(0, '#4a5670'); mg.addColorStop(1, '#77839b'); }
  else { mg.addColorStop(0, D.accent); mg.addColorStop(1, '#ffffff'); }
  ctx.fillStyle = mg;
  const full = f.locked && f.meter >= 100;
  const mval = f.locked ? f.meter : f.meter;
  if (side === 0) { rrect(x, my, Math.max(2, mw * clamp(mval / 100, 0, 1)), mh, 6); ctx.fill(); }
  else { rrect(x + mw * (1 - clamp(mval / 100, 0, 1)), my, Math.max(2, mw * clamp(mval / 100, 0, 1)), mh, 6); ctx.fill(); }
  if (f.meterFlash > 0) {
    ctx.fillStyle = `rgba(255,60,60,${f.meterFlash / 34})`;
    rrect(x, my, mw, mh, 6); ctx.fill();
  }
  // 50% notch
  ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + mw * .5, my); ctx.lineTo(x + mw * .5, my + mh); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
  rrect(x, my, mw, mh, 6); ctx.stroke();

  // key hints
  ctx.font = '900 11px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  const keysLbl = side === 0 ? ['E', 'R'] : ['O', 'P'];
  const eReady = !f.locked && f.meter >= 50;
  const rReady = !f.locked && f.meter >= 100;
  ctx.fillStyle = eReady ? D.accent : 'rgba(160,172,196,.45)';
  ctx.fillText(keysLbl[0], x + mw * .25, my + 10);
  ctx.fillStyle = rReady ? '#ffffff' : 'rgba(160,172,196,.45)';
  ctx.fillText(keysLbl[1], x + mw * .75, my + 10);

  if (f.combo > 1) {
    ctx.font = '900 26px Trebuchet MS, sans-serif';
    ctx.textAlign = side === 0 ? 'left' : 'right';
    ctx.fillStyle = D.accent; ctx.shadowColor = D.accent; ctx.shadowBlur = 14;
    ctx.fillText(f.combo + ' HIT' + (f.combo > 1 ? 'S' : ''), side === 0 ? x : x + bw, my + 52);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawHUD() {
  if (!G.p1 || !G.p2) return;
  drawFighterHud(G.p1, 0);
  drawFighterHud(G.p2, 1);
}

function drawBanner() {
  const b = G.banner;
  if (!b) return;
  const k = b.t / b.life;
  const a = k < .12 ? k / .12 : (k > .78 ? (1 - k) / .22 : 1);
  const slide = (1 - easeOut(Math.min(1, b.t / 12))) * 60;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.translate(W / 2, 210 + slide);
  ctx.fillStyle = 'rgba(5,8,16,.72)';
  const wb = b.big ? 720 : 560;
  rrect(-wb / 2, -46, wb, b.big ? 96 : 82, 10); ctx.fill();
  ctx.strokeStyle = b.color; ctx.lineWidth = 2; ctx.globalAlpha = a * .8;
  rrect(-wb / 2, -46, wb, b.big ? 96 : 82, 10); ctx.stroke();
  ctx.globalAlpha = a;
  ctx.fillStyle = b.color;
  ctx.shadowColor = b.color; ctx.shadowBlur = 24;
  ctx.font = `900 ${b.big ? 50 : 38}px Trebuchet MS, sans-serif`;
  ctx.fillText(b.name, 0, b.big ? 6 : 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(226,236,255,.8)';
  ctx.font = '700 15px Trebuchet MS, sans-serif';
  ctx.fillText(b.sub + (b.big ? '  ·  ULTIMATE' : '  ·  SPECIAL'), 0, b.big ? 38 : 32);
  ctx.restore();
}

/* ---------------- fight scene ---------------- */
const motes = [];
for (let i = 0; i < 46; i++) motes.push({ x: rand(0, W), y: rand(0, H), s: rand(.6, 2), sp: rand(.2, .9), a: rand(.15, .6) });

function drawShadows() {
  for (const f of [G.p1, G.p2]) {
    if (!f) continue;
    const h = clamp(1 - f.airY / 260, .22, 1);
    ctx.save();
    const g = ctx.createRadialGradient(f.x, f.y + 3, 2, f.x, f.y + 3, 40 * h);
    g.addColorStop(0, `rgba(0,0,0,${.55 * h})`);
    g.addColorStop(.55, `rgba(0,0,0,${.28 * h})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(f.x, f.y + 3, 40 * h, 11 * h, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawFightScene() {
  if (!bgCanvas) buildBackground();
  ctx.drawImage(bgCanvas, 0, 0);

  // drifting motes
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const m of motes) {
    m.y -= m.sp; m.x += Math.sin((G.time + m.y) * .01) * .3;
    if (m.y < -10) { m.y = H + 10; m.x = rand(0, W); }
    ctx.globalAlpha = m.a * .7;
    ctx.fillStyle = '#9fb8ff';
    ctx.beginPath(); ctx.arc(m.x, m.y, m.s, 0, TAU); ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(cam.shakeX, cam.shakeY);

  drawMoonBg();
  drawShadows();

  // stage glow under fighters
  const pulse = .05 + Math.sin(G.time * .05) * .02;
  const sg = ctx.createRadialGradient(W / 2, GROUND, 20, W / 2, GROUND, 520);
  sg.addColorStop(0, `rgba(90,140,255,${pulse})`);
  sg.addColorStop(1, 'rgba(90,140,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, GROUND - 160, W, 300);

  for (const f of [G.p1, G.p2]) {
    if (!f) continue;
    const cur = f._joints, prev = f._prevJoints;
    if (cur && prev) {
      const acc = f.data.accent;
      const draw = (a, b, w) => {
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d < 9) return;
        drawSmear(a, b, w, f.data.id === 'asta' ? '#ff5a63' : acc, clamp((d - 9) / 70, 0, .5));
      };
      draw(prev.fh, cur.fh, 5.5 * (f.scale || 1));
      draw(prev.bh, cur.bh, 4.2 * (f.scale || 1));
      draw(prev.ff, cur.ff, 5 * (f.scale || 1));
      draw(prev.bf, cur.bf, 4.4 * (f.scale || 1));
    }
    f._prevJoints = cur;
  }
  for (const f of [G.p1, G.p2]) {
    if (!f || !f.trail.length) continue;
    for (const g of f.trail) drawGhost(f, g, g.t / 11);
  }
  const order = (G.p1 && G.p2) ? (G.p1.x <= G.p2.x ? [G.p2, G.p1] : [G.p1, G.p2]) : [];
  for (const f of order) if (f) drawFighter(f, f.x, f.y);

  drawProjectiles();
  drawFx();
  drawSpells();
  drawParticles();
  ctx.restore();

  if (cam.dark > 0.01) {
    ctx.save();
    ctx.globalAlpha = cam.dark * .8;
    ctx.fillStyle = '#03040a';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (cam.flash > 0.01) {
    ctx.save();
    ctx.globalAlpha = cam.flash;
    ctx.fillStyle = cam.flashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  drawHUD();
  drawBanner();
  drawIntroText();
  drawKoText();
}

function drawIntroText() {
  if (!G.intro) return;
  const t = G.intro;
  let txt = '', sub = '';
  if (t < 46) { txt = '3'; sub = 'ROUND 1'; }
  else if (t < 92) { txt = '2'; sub = 'ROUND 1'; }
  else if (t < 138) { txt = '1'; sub = 'ROUND 1'; }
  else if (t < 168) { txt = 'FIGHT!'; sub = ''; }
  else return;
  const pop = txt === 'FIGHT!';
  const local = pop ? (t - 138) : (t % 46);
  const sc = 1 + Math.max(0, (18 - local) / 18) * .6;
  ctx.save();
  ctx.globalAlpha = clamp(1 - Math.max(0, local - 30) / 16, 0, 1);
  ctx.translate(W / 2, 300);
  ctx.scale(sc, sc);
  ctx.textAlign = 'center';
  ctx.font = '900 130px Trebuchet MS, sans-serif';
  ctx.fillStyle = pop ? '#ffe38a' : '#ffffff';
  ctx.shadowColor = pop ? '#ff9d2e' : '#5a8cff';
  ctx.shadowBlur = 40;
  ctx.fillText(txt, 0, 40);
  ctx.restore();
}

function drawKoText() {
  if (!G.koTimer) return;
  const t = G.koTimer;
  const a = clamp(t / 30, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.font = '900 110px Trebuchet MS, sans-serif';
  ctx.fillStyle = '#ff4f5e';
  ctx.shadowColor = '#ff2a3a'; ctx.shadowBlur = 40;
  ctx.fillText('K.O.', W / 2, 300);
  if (G.winner && t > 40) {
    ctx.shadowBlur = 20;
    ctx.fillStyle = G.winner.data.accent;
    ctx.font = '900 46px Trebuchet MS, sans-serif';
    ctx.fillText(G.winner.data.name + ' WINS', W / 2, 372);
  }
  if (t > 90 && Math.floor(t / 30) % 2 === 0) {
    ctx.fillStyle = 'rgba(220,232,255,.85)';
    ctx.font = '700 20px Trebuchet MS, sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillText('ENTER  —  CHARACTER SELECT      ·      R  —  REMATCH', W / 2, 460);
  }
  ctx.restore();
}

/* ---------------- fight update ---------------- */
let ALLOW_INPUT = true;

function separate() {
  const a = G.p1, b = G.p2;
  if (!a || !b || a.state === 'ko' || b.state === 'ko') return;
  if (a.ult || b.ult || a.held || b.held) return;
  const minGap = 44;
  const d = b.x - a.x;
  if (Math.abs(d) < minGap) {
    const push = (minGap - Math.abs(d)) / 2 * (d === 0 ? 1 : Math.sign(d));
    a.x = clamp(a.x - push, LEFT_WALL, RIGHT_WALL);
    b.x = clamp(b.x + push, LEFT_WALL, RIGHT_WALL);
  }
}

function updateFight() {
  G.time++;
  cam.shake *= 0.88;
  if (cam.shake < 0.4) cam.shake = 0;
  cam.shakeX = (Math.random() * 2 - 1) * cam.shake;
  cam.shakeY = (Math.random() * 2 - 1) * cam.shake * .7;
  cam.flash *= 0.88;
  if (cam.flash < 0.01) cam.flash = 0;
  cam.dark = approach(cam.dark, 0, 0.015);
  if (G.banner) { G.banner.t++; if (G.banner.t >= G.banner.life) G.banner = null; }

  if (G.koTimer) {
    G.koTimer++;
    if (G.koTimer % 2 === 0) { updateTimers(); updateProjectiles(); updateFx(); updateParticles(); }
    ALLOW_INPUT = false;
    G.p1.update(); G.p2.update();
    if (G.koTimer > 100 && pressed['enter']) { G.state = 'select'; SEL.locked = [false, false]; SEL.startDelay = 0; }
    if (G.koTimer > 100 && pressed['r']) { startMatch(G.p1.data.id, G.p2.data.id); }
    return;
  }

  if (G.intro > 0) {
    G.intro++;
    if (G.intro > 176) G.intro = 0;
  }
  ALLOW_INPUT = G.intro === 0 || G.intro > 158;

  G.p1.update();
  G.p2.update();
  separate();
  updateTimers();
  updateProjectiles();
  updateFx();
  updateParticles();
}

/* ---------------- character select ---------------- */
const SEL = { c: [0, 1], locked: [false, false], previews: [], t: 0, startDelay: 0 };
const GRID = { cols: 4, rows: 2, tw: 236, th: 196, gap: 16 };
GRID.x0 = (W - (GRID.cols * GRID.tw + (GRID.cols - 1) * GRID.gap)) / 2;
GRID.y0 = 134;

function buildPreviews() {
  SEL.previews = ROSTER.map((c, i) => {
    const f = new Fighter(c.id, 0, 1, 0);
    f.scale = 0.78;
    f.animT = i * 13;
    f.walking = false;
    return f;
  });
}

function tileRect(i) {
  const col = i % GRID.cols, row = Math.floor(i / GRID.cols);
  return {
    x: GRID.x0 + col * (GRID.tw + GRID.gap),
    y: GRID.y0 + row * (GRID.th + GRID.gap),
    w: GRID.tw, h: GRID.th
  };
}

function navSel(p, dx, dy) {
  const c = SEL.c[p];
  let col = c % GRID.cols, row = Math.floor(c / GRID.cols);
  col = (col + dx + GRID.cols) % GRID.cols;
  row = (row + dy + GRID.rows) % GRID.rows;
  SEL.c[p] = row * GRID.cols + col;
  ring(tileRect(SEL.c[p]).x + GRID.tw / 2, tileRect(SEL.c[p]).y + GRID.th / 2, p === 0 ? '#4fd8ff' : '#ff8a4a', 12, 5, 16, 3);
}

function updateSelect() {
  SEL.t++;
  for (let p = 0; p < 2; p++) {
    const ci = CONTROLS[p];
    const lockKey = p === 0 ? 'f' : 'k';
    const backKey = p === 0 ? 'g' : 'l';
    if (SEL.locked[p]) {
      if (pressed[backKey]) { SEL.locked[p] = false; SEL.startDelay = 0; }
      continue;
    }
    if (pressed[ci.left]) navSel(p, -1, 0);
    if (pressed[ci.right]) navSel(p, 1, 0);
    if (pressed[ci.jump]) navSel(p, 0, -1);
    if (p === 0 && pressed['s']) navSel(p, 0, 1);
    if (p === 1 && pressed['arrowdown']) navSel(p, 0, 1);
    if (pressed['t']) { STYLE.classic = !STYLE.classic; }
    if (pressed[lockKey] || pressed['enter']) {
      SEL.locked[p] = true;
      const r = tileRect(SEL.c[p]);
      ring(r.x + r.w / 2, r.y + r.h / 2, p === 0 ? '#4fd8ff' : '#ff8a4a', 10, 8, 20, 4);
    }
  }
  if (SEL.locked[0] && SEL.locked[1]) {
    SEL.startDelay++;
    if (SEL.startDelay > 34) {
      startMatch(ROSTER[SEL.c[0]].id, ROSTER[SEL.c[1]].id);
      SEL.startDelay = 0;
    }
  } else SEL.startDelay = 0;
}

function drawTile(i, rect) {
  const ch = ROSTER[i];
  const D = ch;
  const hov = SEL.c[0] === i || SEL.c[1] === i;
  ctx.save();
  ctx.fillStyle = hov ? 'rgba(20,30,52,.97)' : 'rgba(10,15,27,.95)';
  rrect(rect.x, rect.y, rect.w, rect.h, 10); ctx.fill();
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, hexA(D.accent, .16));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  rrect(rect.x, rect.y, rect.w, rect.h, 10); ctx.fill();
  ctx.strokeStyle = hov ? hexA(D.accent, .8) : 'rgba(120,140,190,.3)';
  ctx.lineWidth = hov ? 2 : 1;
  rrect(rect.x, rect.y, rect.w, rect.h, 10); ctx.stroke();

  // preview fighter
  const pv = SEL.previews[i];
  ctx.save();
  ctx.beginPath(); rrect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 36, 9); ctx.clip();
  const glow = ctx.createRadialGradient(rect.x + rect.w / 2, rect.y + 150, 6, rect.x + rect.w / 2, rect.y + 150, 110);
  glow.addColorStop(0, hexA(D.accent, .3));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  drawFighter(pv, rect.x + rect.w / 2, rect.y + rect.h - 40);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.font = '900 20px Trebuchet MS, sans-serif';
  ctx.fillStyle = D.accent;
  ctx.shadowColor = D.accent; ctx.shadowBlur = 10;
  ctx.fillText(D.name, rect.x + rect.w / 2, rect.y + rect.h - 12);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawSelect() {
  if (!bgCanvas) buildBackground();
  ctx.drawImage(bgCanvas, 0, 0);
  ctx.fillStyle = 'rgba(5,8,16,.62)';
  ctx.fillRect(0, 0, W, H);

  // preview animation
  for (let i = 0; i < SEL.previews.length; i++) {
    const pv = SEL.previews[i];
    pv.animT++;
    pv.walking = true;
    pv.walkPhase += 0.06;
    if (pv.atk) { pv.atkT++; if (pv.atkT >= pv.atkDur) pv.atk = null; }
    else if ((SEL.t + i * 53) % 320 === 0) { pv.atk = 'punch'; pv.atkT = 0; pv.atkDur = 24; }
  }

  // title
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '900 54px Trebuchet MS, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#4b7bff'; ctx.shadowBlur = 34;
  ctx.fillText('STICK LEGENDS', W / 2, 76);
  ctx.shadowBlur = 0;
  ctx.font = '700 14px Trebuchet MS, sans-serif';
  ctx.fillStyle = 'rgba(178,198,232,.75)';
  ctx.letterSpacing = '4px';
  ctx.fillText('S E L E C T   Y O U R   F I G H T E R', W / 2, 102);
  ctx.restore();

  for (let i = 0; i < ROSTER.length; i++) drawTile(i, tileRect(i));

  // cursors
  for (let p = 0; p < 2; p++) {
    const r = tileRect(SEL.c[p]);
    const col = p === 0 ? '#4fd8ff' : '#ff8a4a';
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.shadowColor = col; ctx.shadowBlur = 18;
    const pad = p === 0 ? 2 : 7;
    const L = 20;
    const x = r.x - pad, y = r.y - pad, w = r.w + pad * 2, h = r.h + pad * 2;
    ctx.beginPath();
    ctx.moveTo(x, y + L); ctx.lineTo(x, y); ctx.lineTo(x + L, y);
    ctx.moveTo(x + w - L, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + L);
    ctx.moveTo(x + w, y + h - L); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - L, y + h);
    ctx.moveTo(x + L, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - L);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = col;
    rrect(p === 0 ? x : x + w - 44, y - 20, 44, 18, 5); ctx.fill();
    ctx.fillStyle = '#08101c';
    ctx.font = '900 12px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('P' + (p + 1), (p === 0 ? x : x + w - 44) + 22, y - 10);
    ctx.textBaseline = 'alphabetic';
    if (SEL.locked[p]) {
      ctx.fillStyle = 'rgba(5,10,18,.55)';
      rrect(x + 2, y + 2, w - 4, h - 4, 9); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      rrect(x + 8, y + 8, w - 16, h - 16, 8); ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = '900 22px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = col; ctx.shadowBlur = 16;
      ctx.fillText('READY', x + w / 2, y + h / 2 + 8);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  drawSelPanels();
  drawSelectHints();
}

function drawSelPanels() {
  const py = 560, ph = 138, pw = (W - 80 - 24) / 2;
  for (let p = 0; p < 2; p++) {
    const ch = ROSTER[SEL.c[p]];
    const x = p === 0 ? 40 : 40 + pw + 24;
    const col = p === 0 ? '#4fd8ff' : '#ff8a4a';
    ctx.save();
    ctx.fillStyle = 'rgba(8,12,24,.86)';
    rrect(x, py, pw, ph, 10); ctx.fill();
    ctx.strokeStyle = hexA(ch.accent, .55); ctx.lineWidth = 1.5;
    rrect(x, py, pw, ph, 10); ctx.stroke();
    ctx.fillStyle = col;
    rrect(x + 14, py + 12, 34, 18, 4); ctx.fill();
    ctx.fillStyle = '#08101c';
    ctx.font = '900 12px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P' + (p + 1), x + 31, py + 26);

    ctx.textAlign = 'left';
    ctx.fillStyle = ch.accent;
    ctx.font = '900 24px Trebuchet MS, sans-serif';
    ctx.fillText(ch.name, x + 58, py + 30);
    ctx.fillStyle = 'rgba(200,215,245,.72)';
    ctx.font = '600 12px Trebuchet MS, sans-serif';
    ctx.fillText(ch.title + '   ·   HP ' + ch.hp, x + 58, py + 50);

    ctx.font = '600 12.5px Trebuchet MS, sans-serif';
    ctx.fillStyle = 'rgba(186,202,230,.62)';
    ctx.fillText(ch.bio, x + 210, py + 26);

    const rows = [['E', ch.ultNameE], ['R', ch.ultNameR]];
    rows.forEach((row, i) => {
      const yy = py + 76 + i * 26;
      ctx.fillStyle = hexA(ch.accent, .22);
      rrect(x + 16, yy - 15, 22, 20, 4); ctx.fill();
      ctx.strokeStyle = hexA(ch.accent, .8); ctx.lineWidth = 1;
      rrect(x + 16, yy - 15, 22, 20, 4); ctx.stroke();
      ctx.fillStyle = ch.accent;
      ctx.font = '900 12px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(row[0], x + 27, yy);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e8eefc';
      ctx.font = '700 13px Trebuchet MS, sans-serif';
      ctx.fillText(row[1], x + 48, yy);
    });
    ctx.restore();
  }
}

function drawSelectHints() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '600 12px Trebuchet MS, sans-serif';
  ctx.fillStyle = 'rgba(160,178,208,.6)';
  ctx.fillText('P1: A/D/W/S move · F lock · G back      P2: ARROWS move · K lock · L back      T: ' + (STYLE.classic ? 'classic stickmen ON' : 'classic stickmen OFF'), W / 2, H - 8);
  ctx.restore();
}

/* ---------------- loading screen ---------------- */
const TIPS = [
  'E and R are both ults — after using one you must recharge the meter to 100%.',
  'The meter fills by dealing AND taking damage. Play aggressive.',
  'Titan\u2019s axe returns to him — dodge the throw, then punish.',
  'Asta\u2019s Demon-Dweller mode boosts his damage and speed.',
  'Yuno\u2019s Spirit Dive holds you in the air. Do not get caught.',
  'Frost can freeze you solid and shatter for huge damage.',
  'Kicks knock back harder than punches.',
  'Jumps beat low ground ults. Stay mobile.'
];
const loadFighter = new Fighter('shadow', 0, 1, 0);
loadFighter.scale = 1.55;

function updateLoading() {
  G.loading += 1.15;
  loadFighter.animT++;
  loadFighter.walking = true;
  loadFighter.walkPhase += 0.2;
  if (G.loading >= 100) {
    G.loading = 100;
    if (SEL.previews.length === 0) buildPreviews();
    G.state = 'select';
  }
}

function drawLoading() {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#070b16'); g.addColorStop(.55, '#101a30'); g.addColorStop(1, '#060a12');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // sweeping light
  const t = G.loading / 100;
  const lg = ctx.createRadialGradient(W / 2, H * .45, 40, W / 2, H * .45, 460);
  lg.addColorStop(0, 'rgba(70,120,255,.28)');
  lg.addColorStop(1, 'rgba(20,40,90,0)');
  ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 76px Trebuchet MS, sans-serif';
  ctx.shadowColor = '#4b7bff'; ctx.shadowBlur = 42;
  ctx.fillText('STICK LEGENDS', W / 2, 210);
  ctx.shadowBlur = 0;
  ctx.font = '700 15px Trebuchet MS, sans-serif';
  ctx.fillStyle = 'rgba(170,192,230,.8)';
  ctx.fillText('U L T I M A T E   F I G H T E R S', W / 2, 244);
  ctx.restore();

  // running fighter
  ctx.save();
  const runX = 120 + t * (W - 240);
  ctx.globalAlpha = .95;
  drawFighter(loadFighter, runX, 470);
  ctx.restore();

  // bar
  const bw = 560, bx = (W - bw) / 2, by = 540;
  ctx.save();
  ctx.fillStyle = 'rgba(8,12,24,.9)';
  rrect(bx, by, bw, 16, 8); ctx.fill();
  const bg2 = ctx.createLinearGradient(bx, by, bx + bw, by);
  bg2.addColorStop(0, '#4b7bff'); bg2.addColorStop(.5, '#6fe0ff'); bg2.addColorStop(1, '#b98bff');
  ctx.fillStyle = bg2;
  rrect(bx, by, Math.max(6, bw * t), 16, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1;
  rrect(bx, by, bw, 16, 8); ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '700 13px Trebuchet MS, sans-serif';
  ctx.fillStyle = 'rgba(190,208,240,.8)';
  ctx.fillText(Math.floor(t * 100) + '%  ' + (t < .45 ? 'FORGING FIGHTERS' : t < .8 ? 'LOADING ULTIMATES' : 'SHARPENING BLADES'), W / 2, by + 42);
  ctx.fillStyle = 'rgba(150,170,205,.55)';
  ctx.font = '600 13px Trebuchet MS, sans-serif';
  ctx.fillText('TIP: ' + TIPS[Math.min(TIPS.length - 1, Math.floor(t * TIPS.length))], W / 2, H - 60);
  ctx.restore();
}

/* ---------------- main loop ---------------- */
let last = 0, acc = 0;
const STEP = 1000 / 60;

function step() {
  if (cam.hitstop > 0) {
    cam.hitstop--;
    cam.flash *= 0.96;
    return;
  }
  if (G.state === 'loading') updateLoading();
  else if (G.state === 'select') { G.time++; updateSelect(); }
  else if (G.state === 'fight') updateFight();

  if (cam.slow > 0) cam.slow--;
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (G.state === 'loading') drawLoading();
  else if (G.state === 'select') drawSelect();
  else if (G.state === 'fight') drawFightScene();
}

function frame(ts) {
  requestAnimationFrame(frame);
  if (!last) last = ts;
  let dt = ts - last;
  last = ts;
  if (dt > 200) dt = 200;
  acc += dt;
  let guard = 0;
  while (acc >= STEP && guard++ < 5) {
    step();
    clearPressed();
    acc -= STEP;
  }
  render();
}

function fitCanvas() {
  const pad = 26;
  const s = Math.min(window.innerWidth / W, (window.innerHeight - pad) / H);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
}
addEventListener('resize', fitCanvas);

/* debug / QA hook */
window.__game = { G, SEL, ROSTER, startMatch, CHAR };

fitCanvas();
buildPreviews();
requestAnimationFrame(frame);
