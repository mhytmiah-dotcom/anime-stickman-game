/* ============================================================
   characters.js — roster data, looks, and ult scripts
   ============================================================ */
'use strict';

const ROSTER = [

/* ---------------------------------------------------------- TITAN */
{
  id: 'titan', name: 'TITAN', title: 'THE EARTHSHAKER',
  color: '#9aa4b8', accent: '#ffcf5c', skin: '#d7b48f',
  hp: 130, speed: 3.1, jump: 15.2, reach: 1.22,
  weapon: 'axe', weaponColor: '#9aa3b5',
  look: { hair: 'horns', hairColor: '#d6dbe6', helmet: '#4a5364', cape: '#39404f', capeTrim: '#ffcf5c', belt: '#4a5364', bulky: true },
  ultNameE: 'AXE THROW', ultNameR: 'EARTHSPLITTER',
  bio: 'A mountain of a man. Slow feet, world-ending axe.',
  e: {
    cost: 50, dur: 62,
    tick(f, t, s) {
      if (t < 14) { f.pose = 'windup'; f.poseT = t / 14; return; }
      f.pose = 'thrust'; f.poseT = 1;
      if (!s.thrown) {
        s.thrown = true;
        f.noWeapon = true;
        proj({
          kind: 'axe', x: f.x + f.face * 26, y: f.y - f.h * .68, owner: f, r: 30, dmg: 16, kb: 9, ks: 20,
          spin: .45 * f.face, face: f.face, phase: 'out', traveled: 0, maxDist: 420, returnSpeed: 20
        });
        shake(4); flash('#ffcf5c', .08);
        burst(f.x + f.face * 26, f.y - f.h * .68, '#ffcf5c', 12, 5);
      }
      const p = projectiles.find(p => p.kind === 'axe' && p.owner === f);
      if (!p && s.thrown && !s.caught) { f.noWeapon = false; s.caught = true; }
      if (p) {
        if (Math.random() < .8) trail(p.x + rand(-14, 14), p.y + rand(-14, 14), pick(['#ffcf5c', '#fff3c4']), rand(2, 4), 14);
        if (p.phase === 'out') {
          p.x += 17 * p.face; p.traveled += 17;
          if (p.traveled > p.maxDist) { p.phase = 'back'; p.vx = 0; }
        } else {
          const dx = (f.x + f.face * 20) - p.x;
          const dy = (f.y - f.h * .62) - p.y;
          const d = Math.hypot(dx, dy) || 1;
          p.x += (dx / d) * p.returnSpeed; p.y += (dy / d) * p.returnSpeed;
          if (d < 26) {
            p.dead = true;
            f.noWeapon = false;
            s.caught = true;
            burst(p.x, p.y, '#ffcf5c', 10, 4);
          }
        }
      }
    }
  },
  r: {
    cost: 100, dur: 96,
    tick(f, t, s) {
      if (t < 20) { f.pose = 'windup'; f.poseT = 1; }
      else if (t < 26) { f.pose = 'crouch'; f.poseT = 1; }
      else if (t < 48) {
        if (!s.jumped) {
          s.jumped = true;
          f.airY = 0; f.vy = -19; f.vx = 0;
          dust(f.x, f.y, 10);
          ring(f.x, f.y, '#ffcf5c', 20, 6, 20, 5);
        }
        f.pose = 'slashUp'; f.poseT = 1;
      } else if (t < 54) {
        f.pose = 'crouch'; f.poseT = 1;
        if (!s.landed) {
          s.landed = true;
          f.airY = 0; f.vy = 0;
          shake(20); flash('#ffcf5c', .35); hitstop(7);
          ring(f.x, f.y, '#ffcf5c', 26, 15, 30, 6);
          dust(f.x, f.y, 26, '#a8946a');
          burst(f.x, f.y - 10, '#ffcf5c', 30, 11, { g: .25 });
          fxCrack({ x: f.x, y: f.y - 2, dir: f.face, color: '#ffb545', life: 52 });
          fxWave({ x: f.x + f.face * 30, ox: f.x, y: f.y, dir: f.face, dist: 480, color: '#ffcf5c', speed: .42, dmg: 30, kb: 15, ks: 30, up: -9, owner: f, life: 60 });
          for (let i = 0; i < 16; i++) {
            part({ x: f.x + f.face * rand(20, 460), y: f.y, vx: rand(-3, 3), vy: rand(-12, -4), g: .5, life: rand(20, 40), max: 40, size: rand(3, 8), color: pick(['#a8946a', '#ffcf5c', '#6f6355']), kind: 'shard', rot: rand(0, TAU), spin: rand(-.2, .2) });
          }
        }
      } else if (t < 76) { f.pose = 'slam'; f.poseT = 1; }
      else { f.pose = 'recover'; f.poseT = (t - 76) / 20; }
    }
  }
},

/* ---------------------------------------------------------- BLAZE */
{
  id: 'blaze', name: 'BLAZE', title: 'THE INFERNO',
  color: '#e8d9c8', accent: '#ff6a1a', skin: '#d7a97c',
  hp: 100, speed: 3.7, jump: 15.6, reach: 1.05,
  weapon: 'fists', weaponColor: '#ff7a18',
  look: { hair: 'flame', hairColor: '#ff7a18', gauntlets: '#ff8a2b' },
  ultNameE: 'FIREBALL BARRAGE', ultNameR: 'PHOENIX DIVE',
  bio: 'Everything he touches ends up on fire. Including you.',
  e: {
    cost: 50, dur: 48,
    tick(f, t, s) {
      if (t < 8) { f.pose = 'windup'; f.poseT = t / 8; return; }
      f.pose = 'thrust'; f.poseT = clamp((t - 8) / 6, 0, 1);
      if (t === 8 || t === 13 || t === 18) {
        const spread = (t - 13) * .16;
        proj({
          kind: 'fireball', x: f.x + f.face * 34, y: f.y - f.h * .68 + spread * 34, owner: f, r: 15,
          vx: f.face * 10.5, vy: spread * 1.1, dmg: 8, kb: 5, ks: 12, life: 90
        });
        ring(f.x + f.face * 34, f.y - f.h * .68 + spread * 34, '#ff8a2b', 8, 4, 12, 3);
        burst(f.x + f.face * 34, f.y - f.h * .68 + spread * 34, '#ffb347', 6, 4);
        shake(3);
      }
    }
  },
  r: {
    cost: 100, dur: 84,
    tick(f, t, s) {
      if (t < 20) {
        f.pose = t < 10 ? 'windup' : 'crouch'; f.poseT = t / 20;
        if (!s.charged && t > 12) {
          s.charged = true;
          f.aura = 1;
          ring(f.x, f.y, '#ff6a1a', 10, 7, 30, 4);
        }
        return;
      }
      if (t < 24) {
        if (!s.launched) {
          s.launched = true;
          f.phoenixActive = true; f.invuln = Math.max(f.invuln, 34);
          s.sx = f.x; s.sy = 0;
          s.tx = clamp((f.target ? f.target.x : f.x + f.face * 300) + f.face * 110, 80, W - 80);
          flash('#ff6a1a', .4); shake(12);
          ring(f.x, f.y - 40, '#ffb347', 20, 12, 24, 6);
          burst(f.x, f.y - f.h * .5, '#ff7a18', 26, 9, { g: -.05 });
        }
        return;
      }
      if (t < 52) {
        const p = (t - 24) / 28;
        f.x = lerp(s.sx, s.tx, p);
        f.airY = Math.sin(p * Math.PI) * 185;
        f.phoenixRot = -f.face * Math.cos(p * Math.PI) * .32;
        f.phoenixSize = 1;
        trail(f.x, f.y - f.airY - 20, pick(['#ff7a18', '#ffb347', '#ff3b00']), rand(4, 9), 24, -.6);
        if (Math.random() < .6) {
          part({ x: f.x - f.face * rand(20, 70), y: f.y - f.airY - rand(-20, 30), vx: rand(-1, 1), vy: rand(-2, 0), life: 30, max: 30, size: rand(4, 9), color: '#5a2a10', kind: 'smoke', g: -.03, glow: false });
        }
        const tg = f.target;
        if (tg && tg.alive && !s.hit && Math.abs(tg.x - f.x) < 62 && Math.abs(tg.y - f.y) < 210) {
          s.hit = true;
          tg.hurt({ dmg: 32, kb: 12, ks: 30, up: -7, dir: f.face, src: f });
          shake(16); hitstop(6);
          burst(tg.x, tg.y - 60, '#ff7a18', 30, 11, { g: .1 });
          ring(tg.x, tg.y - 60, '#ffb347', 14, 12, 26, 6);
        }
      } else {
        if (!s.landed) {
          s.landed = true;
          f.phoenixActive = false;
          f.airY = 0;
          dust(f.x, f.y, 14, '#8a6a52');
          ring(f.x, f.y, '#ff6a1a', 16, 9, 20, 5);
          shake(6);
        }
        f.pose = 'recover'; f.poseT = clamp((t - 52) / 22, 0, 1);
      }
    }
  }
},

/* ---------------------------------------------------------- VOLT */
{
  id: 'volt', name: 'VOLT', title: 'THE STORMCALLER',
  color: '#dbe6f5', accent: '#ffe83d', skin: '#caa27a',
  hp: 96, speed: 4.0, jump: 16.2, reach: 1.0,
  weapon: 'fists', weaponColor: '#ffe83d',
  look: { hair: 'bolt', hairColor: '#ffe83d', boots: '#2a3f6b', gloves: '#2a3f6b' },
  ultNameE: 'LIGHTNING DASH', ultNameR: 'THUNDER JUDGEMENT',
  bio: 'Faster than the thunder that follows him.',
  e: {
    cost: 50, dur: 44,
    tick(f, t, s) {
      if (t < 8) { f.pose = 'crouch'; f.poseT = t / 8; return; }
      if (!s.launched) {
        s.launched = true;
        s.sx = f.x;
        s.sy = f.y;
        s.tx = clamp((f.target ? f.target.x : f.x) + f.face * 90, 70, W - 70);
        f.invuln = Math.max(f.invuln, 24);
        f.hide = true;
        flash('#ffe83d', .28); shake(7);
        burst(f.x, f.y - f.h * .55, '#ffe83d', 14, 7);
        const tg = f.target;
        if (tg && tg.alive) {
          later(6, () => {
            if (!tg.alive) return;
            tg.hurt({ dmg: 17, kb: 7, ks: 24, up: -4, dir: f.face, src: f });
            fxLine({ x1: s.sx, y1: s.sy - 70, x2: s.tx, y2: s.sy - 70, color: '#ffe83d', width: 5, life: 12 });
            fxBolt({ x: tg.x, y: tg.y, fromX: s.sx, color: '#ffe83d', width: 2, up: 120, life: 12 });
            hitspark(tg.x, tg.y - tg.h * .6, '#ffe83d', 16);
            shake(10); hitstop(4);
          });
        }
      }
      const p = clamp((t - 8) / 12, 0, 1);
      f.x = lerp(s.sx, s.tx, easeOut(p));
      f.airY = Math.sin(p * Math.PI) * 26;
      if (t < 21) {
        for (let i = 0; i < 3; i++) trail(f.x + rand(-30, 30), f.y - f.h * .55 + rand(-24, 24), '#ffe83d', rand(3, 6), 18);
      }
      if (t === 20) { f.hide = false; f.airY = 0; ring(f.x, f.y, '#ffe83d', 10, 8, 18, 4); dust(f.x, f.y, 8); }
      if (t > 20) { f.pose = 'recover'; f.poseT = (t - 20) / 24; }
    }
  },
  r: {
    cost: 100, dur: 92,
    tick(f, t, s) {
      if (t < 24) {
        f.pose = t < 12 ? 'slashUp' : 'windup'; f.poseT = t / 24;
        if (t % 4 === 0) {
          const a = (f.x + rand(-70, 70));
          part({ x: a, y: f.y - rand(60, 200), vx: 0, vy: rand(-1, 1), life: 18, max: 18, size: rand(2, 4), color: '#ffe83d' });
        }
        return;
      }
      if (!s.started) {
        s.started = true;
        cam.dark = Math.max(cam.dark, .35);
        const tg = f.target;
        const spots = tg ? [tg.x - 60, tg.x + 40, tg.x + 10] : [f.x + 100, f.x + 160, f.x + 220];
        spots.forEach((sx, i) => {
          later(6 + i * 11, () => {
            sx = clamp(sx, 60, W - 60);
            fxMark({ x: sx, y: GROUND, radius: 46, color: '#ffe83d', life: 22 });
            later(12, () => {
              fxBolt({ x: sx, y: GROUND, color: '#ffe83d', width: 4, up: 620, life: 16 });
              shake(8);
              burst(sx, GROUND, '#ffe83d', 12, 7, { g: .2 });
              ring(sx, GROUND, '#ffe83d', 14, 8, 18, 4);
              if (f.target && f.target.alive && Math.abs(f.target.x - sx) < 74 && f.target.airY < 190) {
                f.target.hurt({ dmg: 6, kb: 3, ks: 10, dir: dirTo(sx, f.target.x), src: f });
              }
            });
          });
        });
        later(46, () => {
          const tx = f.target ? clamp(f.target.x, 70, W - 70) : f.x + 150;
          fxMark({ x: tx, y: GROUND, radius: 90, color: '#ffffff', life: 26 });
          later(16, () => {
            fxBolt({ x: tx, y: GROUND, color: '#fff9b0', width: 8, up: 700, life: 22 });
            fxPillar({ x: tx, y: GROUND, w: 120, color: '#ffe83d', life: 18 });
            fxBolt({ x: tx + rand(-30, 30), y: GROUND, color: '#ffe83d', width: 4, up: 660, life: 18 });
            flash('#ffffff', .5); shake(20); hitstop(8);
            ring(tx, GROUND, '#ffe83d', 20, 16, 28, 8);
            burst(tx, GROUND - 30, '#ffe83d', 26, 11, { g: .15 });
            if (f.target && f.target.alive && Math.abs(f.target.x - tx) < 120 && f.target.airY < 240) {
              f.target.hurt({ dmg: 22, kb: 11, ks: 28, up: -8, dir: dirTo(tx, f.target.x), src: f });
            }
          });
        });
      }
      f.pose = t > 62 ? 'recover' : 'cast'; f.poseT = t > 62 ? (t - 62) / 30 : 1;
    }
  }
},

/* ---------------------------------------------------------- ASTA */
{
  id: 'asta', name: 'ASTA', title: 'ANTI-MAGIC KNIGHT',
  color: '#e6e6ef', accent: '#e8323c', skin: '#d9ae83',
  hp: 106, speed: 3.9, jump: 16.0, reach: 1.12,
  weapon: 'greatsword', weaponColor: '#2b2b3a',
  look: { hair: 'spiky', hairColor: '#e8e8ea', headband: '#c0242e', cape: '#23232e', capeTrim: '#e8323c' },
  ultNameE: 'DEMON-SLAYER SLASH', ultNameR: 'DEMON-DWELLER MODE',
  bio: 'No magic. One huge sword. Zero quit.',
  e: {
    cost: 50, dur: 46,
    tick(f, t, s) {
      if (t < 10) { f.pose = 'windup'; f.poseT = t / 10; f.aura = .5; return; }
      if (!s.launched) {
        s.launched = true;
        s.sx = f.x;
        s.tx = clamp((f.target ? f.target.x : f.x) + f.face * 70, 70, W - 70);
        f.invuln = Math.max(f.invuln, 20);
        flash('#e8323c', .18); shake(6);
        burst(f.x, f.y - f.h * .55, '#e8323c', 14, 6);
        const tg = f.target;
        if (tg && tg.alive) {
          later(7, () => {
            if (!tg.alive) return;
            tg.hurt({ dmg: 18, kb: 10, ks: 26, up: -6, dir: f.face, src: f });
            fxSlash({ x: tg.x, y: tg.y - tg.h * .6, rot: -0.9 * f.face, size: 78, color: '#1a1a24', edge: '#e8323c', thick: 1.6, life: 16 });
            fxSlash({ x: tg.x, y: tg.y - tg.h * .6, rot: 0.7 * f.face, size: 62, color: '#e8323c', edge: '#ffffff', thick: 1.1, life: 12 });
            hitspark(tg.x, tg.y - tg.h * .6, '#e8323c', 18);
            shake(11); hitstop(5);
          });
        }
      }
      const p = clamp((t - 10) / 10, 0, 1);
      f.x = lerp(s.sx, s.tx, easeOut(p));
      if (t < 22) for (let i = 0; i < 2; i++) trail(f.x - f.face * rand(0, 40), f.y - f.h * .55 + rand(-20, 20), '#e8323c', rand(3, 6), 16);
      if (t > 20) { f.pose = 'recover'; f.poseT = (t - 20) / 26; }
      else f.pose = 'thrust';
    }
  },
  r: {
    cost: 100, dur: 96,
    tick(f, t, s) {
      if (t < 26) {
        f.pose = 'windup'; f.poseT = t / 26;
        f.aura = 1;
        if (t % 3 === 0) {
          part({ x: f.x + rand(-40, 40), y: f.y - rand(20, 170), vx: rand(-.6, .6), vy: rand(-2.6, -1), life: 24, max: 24, size: rand(3, 7), color: pick(['#e8323c', '#5a0f16', '#1a1a24']) });
        }
        if (!s.charged && t > 18) {
          s.charged = true;
          fxSpell({ x: f.x, y: f.y + 4, color: '#e8323c', r: 76, life: 44, spin: -.03 });
          shake(5);
        }
        return;
      }
      if (t === 26) {
        flash('#e8323c', .4); shake(12); hitstop(4);
        f.demon = 360;
        ring(f.x, f.y - f.h * .5, '#e8323c', 16, 14, 28, 7);
        burst(f.x, f.y - f.h * .55, '#e8323c', 30, 10, { g: -.04 });
      }
      if (t < 52) {
        f.pose = t < 40 ? 'windup' : 'slashUp'; f.poseT = (t - 26) / 26;
        if (t % 2 === 0) trail(f.x + f.face * rand(20, 60), f.y - f.h * .55 + rand(-30, 30), '#e8323c', rand(3, 7), 20, -.4);
        return;
      }
      if (!s.swung) {
        s.swung = true;
        const cx = f.x + f.face * 60, cy = f.y - f.h * .6;
        fxSlash({ x: cx, y: cy, rot: -1.15 * f.face, size: 130, color: '#12121a', edge: '#ff5a63', thick: 2.4, life: 26 });
        proj({
          kind: 'darkcrescent', x: cx + f.face * 30, y: cy, owner: f, r: 84, vx: f.face * 12.5,
          dmg: 30, kb: 14, ks: 30, life: 60, color: '#12121a', edge: '#ff5a63'
        });
        flash('#ffffff', .22); shake(14); hitstop(5);
      }
      f.pose = 'recover'; f.poseT = clamp((t - 52) / 44, 0, 1);
    }
  }
},

/* ---------------------------------------------------------- YUNO */
{
  id: 'yuno', name: 'YUNO', title: 'HEIR OF THE WIND',
  color: '#e2f3ec', accent: '#57e39b', skin: '#e0bb95',
  hp: 98, speed: 3.7, jump: 16.4, reach: 1.0,
  weapon: 'fists', weaponColor: '#57e39b',
  look: { hair: 'bangs', hairColor: '#1f2a38', mantle: '#2f8f63', mantleTrim: '#e9e2c0', grimoire: true, earring: '#ffd75e' },
  ultNameE: 'WIND BLADES', ultNameR: 'SPIRIT DIVE',
  bio: 'Calm. Quiet. Then the sky turns into blades.',
  e: {
    cost: 50, dur: 46,
    tick(f, t, s) {
      if (t < 8) { f.pose = 'windup'; f.poseT = t / 8; return; }
      f.pose = 'thrust'; f.poseT = 1;
      if (t === 8 || t === 13 || t === 18) {
        const off = (t - 13) * .55;
        proj({
          kind: 'wind', x: f.x + f.face * 30, y: f.y - f.h * .6 + off * 26, owner: f, r: 20,
          vx: f.face * 13, vy: off * .8, spin: .25 * f.face, dmg: 9, kb: 5, ks: 16, life: 60
        });
        ring(f.x + f.face * 30, f.y - f.h * .6 + off * 26, '#57e39b', 8, 5, 12, 3);
        shake(2);
      }
    }
  },
  r: {
    cost: 100, dur: 112,
    tick(f, t, s) {
      if (t < 22) {
        f.pose = 'cast'; f.poseT = t / 22;
        f.aura = 1;
        if (t === 6) { fxSpell({ x: f.x, y: f.y + 4, color: '#57e39b', r: 84, life: 96, spin: .025 }); }
        if (t % 2 === 0) {
          part({ x: f.x + rand(-70, 70), y: f.y - rand(10, 150), vx: rand(-1, 1), vy: rand(-3, -1), life: 26, max: 26, size: rand(2, 5), color: pick(['#57e39b', '#bfffe0']) });
        }
        return;
      }
      if (!s.started) {
        s.started = true;
        flash('#57e39b', .3); shake(9);
        fxSpell({ x: f.x, y: f.y + 4, color: '#eafff5', r: 96, life: 90, spin: -.02 });
        burst(f.x, f.y - f.h * .5, '#57e39b', 26, 9);
      }
      const tg = f.target;
      const holding = t < 64;
      if (holding && tg && tg.alive) {
        tg.held = true;
        tg.airY = lerp(tg.airY, 110, .18);
        tg.vx = 0;
        tg.x = lerp(tg.x, f.x + f.face * 115, .16);
        tg.hurtFlash = 6;
        if (t % 9 === 0 && t > 26) {
          tg.hurt({ dmg: 3, kb: 0, ks: 0, dir: 0, src: f, noCombo: false });
          sparks(tg.x, tg.y - tg.airY - 40, '#bfffe0', 6, 4);
          hitspark(tg.x, tg.y - tg.airY - 50, '#57e39b', 8);
          shake(4);
        }
      } else if (tg) tg.held = false;
      f.pose = t < 46 ? 'cast' : (t < 64 ? 'slashUp' : 'thrust');
      f.poseT = 1;
      f.airY = Math.sin(clamp((t - 22) / 60, 0, 1) * Math.PI) * 52;
      if (!s.burst && t >= 64) {
        s.burst = true;
        if (tg) tg.held = false;
        const cx = f.x + f.face * 115, cy = f.y - 60;
        ring(cx, cy, '#bfffe0', 20, 22, 34, 10);
        ring(cx, cy, '#57e39b', 10, 16, 28, 6);
        burst(cx, cy, '#57e39b', 34, 12, { g: 0 });
        burst(cx, cy, '#eafff5', 16, 9, { g: 0 });
        flash('#57e39b', .42); shake(18); hitstop(6);
        if (tg && tg.alive && Math.abs(tg.x - cx) < 190) {
          tg.hurt({ dmg: 18, kb: 13, ks: 30, up: -9, dir: f.face, src: f });
        }
      }
      if (t > 64) f.airY = Math.max(0, f.airY - 4);
      if (t > 92) f.pose = 'recover';
    }
  }
},

/* ---------------------------------------------------------- SHADOW */
{
  id: 'shadow', name: 'SHADOW', title: 'THE SILENT EDGE',
  color: '#3c4257', accent: '#b06bff', skin: '#c39a76',
  hp: 94, speed: 4.2, jump: 16.8, reach: 1.04,
  weapon: 'kunai', weaponColor: '#aeb6c8',
  look: { hair: 'bandana', hairColor: '#2a2f3e', scarf: '#8b3fd6', mask: '#22263a' },
  ultNameE: 'SHADOW CLONE STRIKE', ultNameR: 'VOID ASSASSINATION',
  bio: 'You will not hear him. You will only feel it.',
  e: {
    cost: 50, dur: 52,
    tick(f, t, s) {
      if (!s.cast && t >= 6) {
        s.cast = true;
        flash('#b06bff', .22); shake(5);
        for (let i = 0; i < 10; i++) part({ x: f.x + rand(-30, 30), y: f.y - rand(10, 110), vx: rand(-1, 1), vy: rand(-2, 0), life: 30, max: 30, size: rand(6, 14), color: '#2a1a3e', kind: 'smoke', g: -.02, glow: false });
        const tg = f.target;
        const tx = tg ? tg.x : f.x + f.face * 140, ty = tg ? tg.y : f.y;
        for (let i = 0; i < 2; i++) {
          later(4 + i * 9, () => {
            const side = i % 2 ? 1 : -1;
            const cx = clamp(tx + side * 74, 60, W - 60);
            fxSlash({ x: cx, y: ty - 74, rot: -1.1 * side, size: 54, color: '#b06bff', edge: '#ffffff', thick: 1.2, life: 14 });
            burst(cx, ty - 74, '#b06bff', 12, 6);
            if (tg && tg.alive) tg.hurt({ dmg: 8, kb: 3, ks: 8, dir: side, src: f });
            shake(5);
          });
        }
      }
      f.pose = t < 6 ? 'crouch' : (t < 32 ? 'thrust' : 'recover');
      f.poseT = clamp(t / 20, 0, 1);
      if (t < 6) f.alpha = .55 + Math.sin(t) * .15;
    }
  },
  r: {
    cost: 100, dur: 100,
    tick(f, t, s) {
      const tg = f.target;
      if (t < 14) {
        f.pose = 'crouch'; f.poseT = t / 14; f.alpha = .4;
        if (t === 6) { fxText({ x: f.x, y: f.y - 160, text: 'NOTHING PERSONAL', color: '#c9a4ff', size: 22 }); }
        return;
      }
      if (!s.started) {
        s.started = true;
        cam.dark = Math.max(cam.dark, .55);
        f.hide = true; f.invuln = 999;
        for (let i = 0; i < 14; i++) part({ x: f.x + rand(-24, 24), y: f.y - rand(0, 120), vx: rand(-1.5, 1.5), vy: rand(-2.4, -.2), life: 34, max: 34, size: rand(6, 16), color: '#1a1226', kind: 'smoke', g: -.02, glow: false });
        const cx = tg ? tg.x : f.x + f.face * 100, cy = tg ? tg.y : f.y;
        for (let i = 0; i < 6; i++) {
          later(6 + i * 8, () => {
            const side = i % 2 ? 1 : -1;
            const y = cy - 40 - (i % 3) * 34;
            const x = clamp(cx + side * rand(46, 86), 40, W - 40);
            fxSlash({ x, y, rot: rand(-1.6, -0.4) * side, size: rand(48, 66), color: '#b06bff', edge: '#ffffff', thick: 1.3, life: 14 });
            sparks(x, y, '#c9a4ff', 5, 5);
            if (tg && tg.alive) tg.hurt({ dmg: 3, kb: 1, ks: 4, dir: side, src: f });
            shake(4);
          });
        }
        later(58, () => {
          f.hide = false; f.x = clamp((tg ? tg.x : f.x) + f.face * 66, 70, W - 70);
          f.alpha = 1;
          f.fxCross = 1;
          fxSlash({ x: f.target ? f.target.x : f.x, y: f.target ? f.target.y - 80 : f.y - 80, rot: -1.2, size: 110, color: '#b06bff', edge: '#ffffff', thick: 2.2, life: 22 });
          fxSlash({ x: f.target ? f.target.x : f.x, y: f.target ? f.target.y - 80 : f.y - 80, rot: 0.9, size: 96, color: '#7a35c9', edge: '#ffffff', thick: 1.6, life: 18 });
          flash('#b06bff', .38); shake(16); hitstop(6);
          if (f.target && f.target.alive) {
            f.target.hurt({ dmg: 12, kb: 13, ks: 30, up: -8, dir: f.face, src: f });
            }
        });
      }
      f.pose = t > 66 ? 'recover' : 'slashUp'; f.poseT = 1;
    }
  }
},

/* ---------------------------------------------------------- FROST */
{
  id: 'frost', name: 'FROST', title: 'THE WINTER WITCH',
  color: '#dff2ff', accent: '#7fd4ff', skin: '#e4c3a4',
  hp: 100, speed: 3.4, jump: 15.4, reach: 1.04,
  weapon: 'staff', weaponColor: '#9fe8ff',
  look: { hair: 'long', hairColor: '#cfe6f5', cape: '#2e5f86', capeTrim: '#cdefff', crown: true },
  ultNameE: 'ICE SPIKES', ultNameR: 'ABSOLUTE ZERO',
  bio: 'Speaks softly. Freezes everything.',
  e: {
    cost: 50, dur: 56,
    tick(f, t, s) {
      if (t < 10) { f.pose = 'windup'; f.poseT = t / 10; return; }
      f.pose = 'slashUp'; f.poseT = 1;
      if (!s.cast) {
        s.cast = true;
        shake(6); flash('#9fe8ff', .18);
        const startX = f.x + f.face * 60;
        for (let i = 0; i < 6; i++) {
          const sx = clamp(startX + f.face * i * 62, 40, W - 40);
          later(3 + i * 4, () => {
            fxSpike({ x: sx, y: GROUND, color: '#bfefff', dir: f.face });
            burst(sx, GROUND - 30, '#cdf4ff', 8, 5, { g: .1 });
            ring(sx, GROUND, '#9fe8ff', 10, 5, 14, 3);
            shake(3);
            const tg = f.target;
            if (tg && tg.alive && Math.abs(tg.x - sx) < 46 && tg.airY < 70) {
              tg.hurt({ dmg: 6, kb: 4, ks: 12, up: -4, dir: f.face, src: f });
              tg.frozen = Math.max(tg.frozen, 34);
              for (let k = 0; k < 6; k++) part({ x: sx + rand(-20, 20), y: GROUND - rand(20, 90), vx: rand(-2, 2), vy: rand(-4, -1), g: .18, life: 20, max: 20, size: rand(3, 6), color: '#dff8ff', kind: 'shard', rot: rand(0, TAU), spin: rand(-.2, .2) });
            }
          });
        }
      }
      if (t > 30) { f.pose = 'recover'; f.poseT = (t - 30) / 26; }
    }
  },
  r: {
    cost: 100, dur: 108,
    tick(f, t, s) {
      if (t < 18) {
        f.pose = 'cast'; f.poseT = t / 18; f.aura = 1;
        if (t === 6) fxSpell({ x: f.x, y: f.y + 4, color: '#9fe8ff', r: 82, life: 92, spin: -.022 });
        return;
      }
      if (!s.started) {
        s.started = true;
        cam.dark = Math.max(cam.dark, .45);
        flash('#9fe8ff', .3); shake(10);
      }
      for (let i = 0; i < 3; i++) {
        part({ x: rand(-40, W), y: rand(-60, GROUND), vx: rand(5, 12), vy: rand(1, 4), life: 60, max: 60, size: rand(1.5, 3.5), color: '#dff8ff', g: .01, glow: true, drag: .999 });
      }
      const tg = f.target;
      if (t < 76 && tg && tg.alive) {
        tg.frozen = Math.max(tg.frozen, 4);
        tg.vx *= .8;
        if (t % 10 === 0 && t > 26) {
          tg.hurt({ dmg: 4, kb: 0, ks: 0, dir: 0, src: f });
          sparks(tg.x, tg.y - 70, '#dff8ff', 6, 4);
          shake(2);
        }
      }
      if (t === 40) { fxText({ x: f.x, y: f.y - 120, text: 'FREEZE', color: '#ffffff', size: 22 }); }
      if (!s.shatter && t >= 76) {
        s.shatter = true;
        const tx = tg ? tg.x : f.x + f.face * 100, ty = tg ? tg.y - 70 : f.y - 70;
        ring(tx, ty, '#eaffff', 22, 20, 30, 10);
        ring(tx, ty, '#7fd4ff', 14, 26, 34, 6);
        flash('#ffffff', .5); shake(20); hitstop(7);
        for (let i = 0; i < 34; i++) {
          const a = rand(0, TAU), sp = rand(3, 13);
          part({ x: tx + rand(-20, 20), y: ty + rand(-40, 40), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, g: .3, life: rand(24, 48), max: 48, size: rand(4, 11), color: pick(['#dff8ff', '#9fe8ff', '#ffffff']), kind: 'shard', rot: rand(0, TAU), spin: rand(-.3, .3) });
        }
        if (tg && tg.alive && Math.abs(tg.x - tx) < 170) {
          tg.hurt({ dmg: 22, kb: 12, ks: 28, up: -10, dir: f.face, src: f });
        }
      }
      f.pose = t > 76 ? 'recover' : 'cast'; f.poseT = 1;
    }
  }
},

/* ---------------------------------------------------------- RONIN */
{
  id: 'ronin', name: 'RONIN', title: 'THE MOON SAMURAI',
  color: '#dcd4e8', accent: '#c9d6ff', skin: '#d2a87f',
  hp: 102, speed: 3.8, jump: 16.0, reach: 1.16,
  weapon: 'katana', weaponColor: '#e8f0ff',
  look: { hair: 'ponytail', hairColor: '#1e2330', sash: '#5c3f8f', robe: '#333a54' },
  ultNameE: 'IAI — QUICK DRAW', ultNameR: 'MOON THOUSAND CUTS',
  bio: 'One draw. One breath. One cut.',
  e: {
    cost: 50, dur: 48,
    tick(f, t, s) {
      if (t < 16) { f.pose = 'crouch'; f.poseT = t / 16; f.alpha = .9; return; }
      if (!s.launched) {
        s.launched = true;
        const tg = f.target;
        s.sx = f.x;
        s.tx = clamp((tg ? tg.x : f.x) + f.face * 74, 60, W - 60);
        f.invuln = Math.max(f.invuln, 20);
        fxLine({ x1: s.sx, y1: f.y - 70, x2: s.tx, y2: f.y - 70, color: '#e8f0ff', width: 3, life: 12 });
        flash('#c9d6ff', .16);
        if (tg && tg.alive) {
          later(4, () => {
            fxSlash({ x: tg.x, y: tg.y - tg.h * .62, rot: -0.35 * f.face, size: 86, color: '#c9d6ff', edge: '#ffffff', thick: 1.4, life: 16 });
            hitspark(tg.x, tg.y - tg.h * .62, '#e8f0ff', 14);
            tg.hurt({ dmg: 19, kb: 9, ks: 24, up: -5, dir: f.face, src: f });
            shake(10); hitstop(5);
          });
        }
      }
      const p = clamp((t - 16) / 6, 0, 1);
      f.x = lerp(s.sx, s.tx, easeOut(p));
      f.pose = t < 24 ? 'thrust' : 'recover';
      f.poseT = clamp((t - 16) / 22, 0, 1);
    }
  },
  r: {
    cost: 100, dur: 104,
    tick(f, t, s) {
      const tg = f.target;
      if (t < 16) {
        f.pose = 'crouch'; f.poseT = t / 16;
        return;
      }
      if (!s.started) {
        s.started = true;
        cam.dark = Math.max(cam.dark, .62);
        fxMoon({ x: f.x + f.face * 240, y: 160, r: 108, color: '#eef6ff', life: 96 });
        flash('#dfe9ff', .22); shake(8);
      }
      const cx = tg ? tg.x : f.x + f.face * 100, cy = tg ? tg.y : f.y;
      for (let i = 0; i < 6; i++) {
        if (t === 20 + i * 8) {
          const x = cx + rand(-50, 50), y = cy - rand(40, 150);
          fxSlash({ x, y, rot: rand(-1.7, 0) * (i % 2 ? 1 : -1), size: rand(50, 74), color: '#eef6ff', edge: '#ffffff', thick: 1.2, life: 12 });
          sparks(x, y, '#c9d6ff', 4, 5);
          if (tg && tg.alive) tg.hurt({ dmg: 2, kb: 0, ks: 0, dir: 0, src: f });
          shake(3);
        }
      }
      if (!s.fin && t >= 70) {
        s.fin = true;
        const cx2 = clamp(cx, 80, W - 80);
        fxSlash({ x: cx2, y: cy - 84, rot: -1.5707, size: 160, color: '#c9d6ff', edge: '#ffffff', thick: 2.6, life: 26 });
        proj({ kind: 'moonbeam', x: f.x + f.face * 40, y: f.y - 78, vx: f.face * 15, owner: f, r: 52, dmg: 20, kb: 14, ks: 30, life: 60 });
        flash('#ffffff', .42); shake(18); hitstop(7);
        if (tg && tg.alive && Math.abs(tg.x - f.x) < 420) tg.hurt({ dmg: 8, kb: 6, ks: 20, up: -6, dir: f.face, src: f });
      }
      f.pose = t > 70 ? 'slashUp' : 'cast'; f.poseT = 1;
      if (t > 88) { f.pose = 'recover'; f.poseT = (t - 88) / 16; }
    }
  }
}
];

const CHAR = {};
ROSTER.forEach(c => { CHAR[c.id] = c; });
