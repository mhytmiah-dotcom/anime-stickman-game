/* ============================================================
   poses.js — procedural skeleton + character rendering
   ============================================================ */
'use strict';

const LIMB = { up: 23, fore: 22, thigh: 30, shin: 29, torso: 46, neck: 9 };

/* Build a jointed pose. Angles: 0 = straight down, + = forward, - = back */
function poseOf(f) {
  const p = {
    lean: .06, bob: 0, headTilt: 0, headX: 0,
    fA: [.30, .38], bA: [-.24, .42],
    fL: [.20, -.17], bL: [-.16, .20]
  };
  const t = f.animT;

  if (f.state === 'ko') {
    p.lean = -.4; p.fA = [-1.3, .6]; p.bA = [-1.6, .7];
    p.fL = [.5, -.4]; p.bL = [.1, -.2]; p.headTilt = -.5;
    return p;
  }
  if (f.state === 'stun' || f.frozen > 0) {
    p.lean = -.16; p.headTilt = .22 + Math.sin(t * .5) * .12;
    p.fA = [-.7, .5]; p.bA = [.9, .55];
    p.fL = [.35, -.25]; p.bL = [-.35, .3];
    p.bob = Math.sin(t * .7) * 1.5;
    if (f.frozen > 0) { p.fA = [-.3, .2]; p.bA = [-.2, .3]; p.fL = [.12, -.1]; p.bL = [-.12, .1]; }
    return p;
  }
  if (f.held) {
    p.lean = -.5; p.headTilt = -.3;
    p.fA = [-1.1, .5]; p.bA = [-1.5, .4];
    p.fL = [.7, -.5]; p.bL = [.2, -.3];
    return p;
  }

  /* ---- ultimates ---- */
  if (f.ult) {
    const k = clamp(f.poseT === undefined ? 0 : f.poseT, 0, 1);
    switch (f.pose) {
      case 'windup': {
        const a = easeOut(k);
        p.lean = -0.12 - a * 0.2;
        p.fA = [-0.55 - a * 0.9, 0.5 - a * 0.3];
        p.bA = [-0.7 - a * 0.8, 0.55];
        p.fL = [0.34 + a * 0.12, -0.3];
        p.bL = [-0.28 - a * 0.1, 0.34];
        p.headTilt = -0.15 - a * 0.1;
        p.bob = -a * 2;
        break;
      }
      case 'crouch':
        p.lean = 0.34;
        p.fL = [0.62, -1.28]; p.bL = [-0.5, -1.1];
        p.fA = [0.95, 0.5]; p.bA = [0.65, 0.65];
        p.headTilt = -0.16;
        break;
      case 'thrust': {
        const a = easeOut(clamp(k * 1.6, 0, 1));
        p.lean = 0.3;
        p.fA = [1.5, 0.06]; p.bA = [-1.1, 0.7];
        p.fL = [0.95, -0.25]; p.bL = [-0.75, 0.3];
        p.headTilt = -0.1;
        break;
      }
      case 'slashUp':
        p.lean = -0.25;
        p.fA = [2.55, 0.18]; p.bA = [2.2, 0.4];
        p.fL = [0.4, -0.35]; p.bL = [-0.45, 0.2];
        p.headTilt = -0.28;
        break;
      case 'slam':
        p.lean = 0.2;
        p.fA = [1.02, 0.2]; p.bA = [0.78, 0.36];
        p.fL = [0.55, -0.75]; p.bL = [-0.55, 0.1];
        p.headTilt = -0.1;
        break;
      case 'cast':
        p.lean = -0.1 + Math.sin(t * .12) * .04;
        p.fA = [1.95, 0.45]; p.bA = [1.8, 0.4];
        p.fL = [0.3, -0.22]; p.bL = [-0.26, 0.24];
        p.headTilt = -0.25;
        break;
      case 'recover': {
        const a = easeInOut(k);
        p.lean = 0.2 - a * 0.14;
        p.fA = [1.2 - a * 0.9, 0.4]; p.bA = [-0.6 + a * 0.4, 0.5];
        p.fL = [0.5 - a * 0.3, -0.4]; p.bL = [-0.4 + a * 0.24, 0.3];
        p.headTilt = -0.1 + a * 0.1;
        break;
      }
      case 'slam':
        break;
    }
    return p;
  }

  /* ---- dash ---- */
  if (f.dashT > 0) {
    p.lean = 0.42; p.headTilt = .1;
    p.fA = [-1.05, .5]; p.bA = [-1.5, .55];
    p.fL = [.78, -.48]; p.bL = [-.72, -.3];
    p.headX = 2;
    return p;
  }

  /* ---- attacks ---- */
  if (f.atk) {
    const k = f.atkT / f.atkDur;
    if (f.atk === 'airkick') {
      const a = easeInOut(clamp(k * 1.4, 0, 1));
      p.lean = .1 + a * .2;
      p.fL = [.35 + a * .75, -.5 + a * .3];
      p.bL = [-.5 - a * .1, -.95];
      p.fA = [1.1, .5]; p.bA = [-1.5 + a * .2, .6];
      p.headTilt = -.1;
      return p;
    }
    if (f.atk === 'punch') {
      if (k < 0.3) {
        const a = easeOut(k / .3);
        p.fA = [.3 - a * .9, .38 + a * 1.05]; p.lean = -.06 - a * .17;
        p.bA = [-.25 - a * .25, .5]; p.headX = a * 3;
      } else if (k < 0.55) {
        const a = easeOut((k - .3) / .25);
        p.fA = [-.6 + a * 2.05, 1.43 - a * 1.36]; p.lean = -.23 + a * .42;
        p.bA = [-.5 - a * .3, .6]; p.headX = 3 - a * 5;
      } else {
        const a = (k - .55) / .45;
        p.fA = [1.45 - a * 1.05, .07 + a * .45]; p.lean = .19 - a * .13;
        p.bA = [-.8 + a * .4, .6]; p.headX = -2 + a * 2;
      }
      p.fL = [.3, -.24]; p.bL = [-.26, .3];
      return p;
    }
    /* kick */
    if (k < 0.34) {
      const a = easeOut(k / .34);
      p.bL = [.1 + a * .55, -.3 - a * 1.0];
      p.lean = -.08 - a * .08;
      p.fA = [.5, .5]; p.bA = [-.5, .6];
      p.fL = [.22 + a * .1, -.2];
    } else if (k < 0.63) {
      const a = easeOut((k - .34) / .29);
      p.bL = [.65 + a * .8, -1.3 + a * 1.15];
      p.lean = -.16 - a * .24;
      p.fA = [.9 + a * .3, .5]; p.bA = [-.9, .6];
      p.fL = [.3 + a * .12, -.24];
    } else {
      const a = (k - .63) / .37;
      p.bL = [1.45 - a * 1.05, -.15 - a * .2];
      p.lean = -.4 + a * .32;
      p.fA = [1.2 - a * .7, .5]; p.bA = [-.7, .6];
      p.fL = [.42 - a * .1, -.26];
    }
    return p;
  }

  /* ---- airborne ---- */
  if (f.airY > 0) {
    const v = f.vy;
    if (f.jumpT < 5) {
      p.lean = .26; p.headTilt = -.1;
      p.fL = [.55, -1.15]; p.bL = [-.5, -1.05];
      p.fA = [2.35, .35]; p.bA = [2.05, .45];
    } else if (v > 4) {
      p.lean = .12; p.headTilt = -.06;
      p.fL = [.35, -.62]; p.bL = [-.52, -.5];
      p.fA = [2.5, .3]; p.bA = [-1.9, .5];
    } else if (v > -4) {
      p.lean = .05;
      p.fL = [.72, -.5]; p.bL = [-.7, -.42];
      p.fA = [2.2, .5]; p.bA = [-2.0, .6];
      p.headTilt = .02;
    } else {
      p.lean = -.06; p.headTilt = .12;
      p.fL = [.95, -.25]; p.bL = [-.35, -.78];
      p.fA = [1.6, .5]; p.bA = [-1.4, .6];
    }
    return p;
  }

  /* ---- landing squash ---- */
  if (f.landT > 0) {
    const k = f.landT / 12;
    p.lean = .2 * k;
    p.fL = [.3 + .55 * k, -.2 - 1.15 * k];
    p.bL = [-.2 - .45 * k, .24 - 1.0 * k];
    p.fA = [.35 + .5 * k, .45 + .25 * k];
    p.bA = [-.3 - .3 * k, .5 + .3 * k];
    p.headTilt = .12 * k;
    return p;
  }

  /* ---- walk ---- */
  if (f.walking) {
    const w = f.walkPhase;
    const s = Math.sin(w), c = Math.cos(w);
    p.fL = [s * .62, -.12 - Math.max(0, -s) * .95];
    p.bL = [-s * .62, -.12 - Math.max(0, s) * .95];
    p.fA = [-s * .5, .5 + Math.max(0, s) * .3];
    p.bA = [s * .5, .5 + Math.max(0, -s) * .3];
    p.lean = .16;
    p.headX = s * 1.4;
    p.headTilt = -.05 + Math.sin(w * 2) * .025;
    p.bob = 0;
    return p;
  }

  /* ---- idle ---- */
  const br = Math.sin(t * .055);
  p.bob = br * 1.6;
  p.fA = [.3 + br * .06, .4];
  p.bA = [-.24 - br * .06, .44];
  p.headTilt = Math.sin(t * .04) * .04;
  p.headX = Math.sin(t * .03) * 1.2;
  return p;
}

function limbPts(ox, oy, a1, a2, l1, l2) {
  const jx = ox + Math.sin(a1) * l1, jy = oy + Math.cos(a1) * l1;
  const ex = jx + Math.sin(a1 + a2) * l2, ey = jy + Math.cos(a1 + a2) * l2;
  return { jx, jy, ex, ey, a1, a2 };
}

function shade(hex, k) {
  if (!hex || hex[0] !== '#') return hex || '#888';
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  const r = Math.round(clamp(((n >> 16) & 255) * k, 0, 255));
  const g = Math.round(clamp(((n >> 8) & 255) * k, 0, 255));
  const b = Math.round(clamp((n & 255) * k, 0, 255));
  return `rgb(${r},${g},${b})`;
}

/* ---------------- main fighter render ---------------- */
function drawFighter(f, baseX, baseY) {
  const D = f.data, L = D.look || {};
  const target = poseOf(f);
  f.cur = blendPose(f.cur, target, poseRate(f));
  const P = f.cur;
  if (f.hide && !f.phoenixActive) return;
  if (f.phoenixActive) { drawPhoenix(f, baseX, baseY); return; }

  const s = f.scale || 1;
  const classic = STYLE.classic;
  const bulk = (L.bulky && !classic) ? 1.18 : 1;
  const lw = (classic ? 5.4 : 7) * bulk * s;
  const cx = baseX, cy = baseY - f.airY * s;

  const fLeg = limbPts(0, 0, P.fL[0], P.fL[1], LIMB.thigh, LIMB.shin);
  const bLeg = limbPts(0, 0, P.bL[0], P.bL[1], LIMB.thigh, LIMB.shin);
  const footY = Math.max(fLeg.ey, bLeg.ey);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale((f.face || 1) * s, s);
  ctx.globalAlpha = (f.alpha === undefined ? 1 : f.alpha) * (f.ghost ? .55 : 1);

  const hipY = f.airY > 0 ? -LIMB.thigh : -footY;
  ctx.translate(P.headX || 0, hipY + P.bob);
  if (f.state === 'ko') {
    ctx.rotate((f.koRot || 0));
  }

  if (f.ult && D.id === 'yuno' && f.ultT > 16) drawSpirit(f, s);
  drawAura(f, D, s);

  const body = f.ghost ? '#dfe8ff' : D.color;
  const back = f.ghost ? '#b9c8ff' : shade(D.color, .62);

  /* cape */
  if (!classic && L.cape) drawCape(f, L, P, LIMB);
  if (!classic && L.scarf) drawScarf(f, L, P);

  /* back leg */
  drawLimb(bLeg, back, lw);
  drawFoot(bLeg, back, s, L);

  /* torso */
  const neckX = Math.sin(P.lean) * LIMB.torso;
  const neckY = -Math.cos(P.lean) * LIMB.torso;
  const spineBend = Math.sin(P.lean * 1.8) * 4;
  ctx.strokeStyle = 'rgba(6,9,16,.55)'; ctx.lineWidth = lw * 1.12 + 3.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(neckX * .5 + spineBend, neckY * .5, neckX, neckY); ctx.stroke();
  ctx.strokeStyle = body; ctx.lineWidth = lw * 1.12;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(neckX * .5 + spineBend, neckY * .5, neckX, neckY); ctx.stroke();
  if (!classic && (L.robe || L.belt)) {
    ctx.strokeStyle = L.robe || L.belt; ctx.lineWidth = lw * 1.14;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(neckX * .45, neckY * .45); ctx.stroke();
  }

  /* back arm */
  const sh = { x: neckX * .92, y: neckY * .92 };
  const bArm = limbPts(sh.x, sh.y, P.bA[0], P.bA[1], LIMB.up, LIMB.fore);
  drawLimb(bArm, back, lw * .92);
  drawHand(bArm, P.bA[0] + P.bA[1], back, lw * .74, f.animT + 2);
  if (!classic && (L.gloves || L.gauntlets)) drawGlove(bArm.ex, bArm.ey, shade(L.gloves || L.gauntlets, .8), s, .85);

  /* two-handed weapons rest behind the head, so they never cut across the face */
  const twoHanded = (D.weapon === 'axe' || D.weapon === 'greatsword');
  const restWeapon = twoHanded && !f.atk && !f.ult && !f.noWeapon;
  if (restWeapon) {
    if (D.weapon === 'greatsword') drawWeaponAt(f, D, sh.x - 4 * s, sh.y + 22 * s, 3.42, s);
    else drawWeaponAt(f, D, sh.x - 10 * s, sh.y + 10 * s, 3.52, s);
  }
  if (!classic && L.mantle) drawMantle(L, P, s);

  /* head */
  const headX = neckX + Math.sin(P.lean + P.headTilt) * LIMB.neck;
  const headY = neckY - Math.cos(P.lean + P.headTilt) * LIMB.neck;
  drawHead(f, headX, headY, P, L, D, s, lw);

  /* front leg */
  drawLimb(fLeg, body, lw);
  drawFoot(fLeg, body, s, L);

  /* front arm + weapon */
  const fArm = limbPts(sh.x, sh.y, P.fA[0], P.fA[1], LIMB.up, LIMB.fore);
  drawLimb(fArm, body, lw);
  drawHand(fArm, P.fA[0] + P.fA[1], body, lw * .8, f.animT);
  if (!classic && (L.gloves || L.gauntlets)) drawGlove(fArm.ex, fArm.ey, L.gloves || L.gauntlets, s);
  if (D.weapon && D.weapon !== 'fists' && !f.noWeapon && !restWeapon) {
    const staffRest = D.weapon === 'staff' && !f.atk && !f.ult;
    if (staffRest) drawWeaponAt(f, D, fArm.ex, fArm.ey + 3 * s, Math.PI, s);
    else drawWeaponAt(f, D, fArm.ex, fArm.ey, P.fA[0] + P.fA[1], s);
  }
  if (!classic && L.grimoire) {
    drawGrimoire(f, -neckX * .4 - 26, neckY - 46, s);
  }
  if (f.demon > 0) drawDemonMarks(headX, headY, s, P);
  if (f.frozen > 0) drawIceBlock(s);
  if (f.state !== 'ko') {
    const wx = lx => cx + (f.face || 1) * s * lx;
    const wy = ly => cy + s * (hipY + P.bob + ly);
    f._joints = {
      fh: { x: wx(fArm.ex), y: wy(fArm.ey) },
      bh: { x: wx(bArm.ex), y: wy(bArm.ey) },
      ff: { x: wx(fLeg.ex), y: wy(fLeg.ey) },
      bf: { x: wx(bLeg.ex), y: wy(bLeg.ey) }
    };
  }
  if (f.hurtFlash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const k = f.hurtFlash / 8;
    const g = ctx.createRadialGradient(0, -56, 4, 0, -56, 58);
    g.addColorStop(0, `rgba(255,220,220,${0.34 * k})`);
    g.addColorStop(.55, `rgba(255,120,120,${0.16 * k})`);
    g.addColorStop(1, 'rgba(255,80,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -56 * s, 30 * s, 62 * s, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawLimb(l, color, lw) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // soft dark outline so fighters pop off the night stage
  ctx.strokeStyle = 'rgba(6,9,16,.55)';
  ctx.lineWidth = lw + 3.2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(l.jx, l.jy); ctx.lineTo(l.ex, l.ey); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(l.jx, l.jy); ctx.lineTo(l.ex, l.ey); ctx.stroke();
}

function drawFoot(l, color, s, L) {
  ctx.save();
  if (STYLE.classic) {
    ctx.strokeStyle = color; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(l.ex - 1 * s, l.ey); ctx.lineTo(l.ex + 7 * s, l.ey); ctx.stroke();
    ctx.restore();
    return;
  }
  const col = L.boots ? L.boots : shade(typeof color === 'string' && color[0] === '#' ? color : '#888', .9);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(6,9,16,.5)'; ctx.lineWidth = 8.5 * s;
  ctx.beginPath(); ctx.moveTo(l.ex - 2 * s, l.ey); ctx.lineTo(l.ex + 7 * s, l.ey); ctx.lineTo(l.ex + 10 * s, l.ey + 2.4 * s); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 6 * s;
  ctx.beginPath(); ctx.moveTo(l.ex - 2 * s, l.ey); ctx.lineTo(l.ex + 7 * s, l.ey); ctx.lineTo(l.ex + 10 * s, l.ey + 2.4 * s); ctx.stroke();
  ctx.restore();
}

/* ---------------- head + hair ---------------- */
function drawHead(f, hx, hy, P, L, D, s, lw) {
  const r = 11.5 * s;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(P.headTilt * .5);

  /* plain stickman head: hollow circle + eye dot */
  if (STYLE.classic) {
    const rr = 10.5 * s;
    ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU);
    ctx.fillStyle = '#0a0d16'; ctx.fill();
    ctx.strokeStyle = D.color; ctx.lineWidth = 4.4 * s; ctx.stroke();
    ctx.fillStyle = D.color;
    ctx.beginPath(); ctx.arc(rr * .42, -rr * .08, 1.8 * s, 0, TAU); ctx.fill();
    ctx.restore();
    return;
  }

  // neck
  ctx.strokeStyle = D.skin; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 6 * s); ctx.lineTo(0, 2 * s); ctx.stroke();

  // skull
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
  ctx.fillStyle = D.skin; ctx.fill();
  ctx.strokeStyle = shade(D.color, .9); ctx.lineWidth = 2.4 * s; ctx.stroke();

  // eye
  ctx.fillStyle = '#1b1f2b';
  ctx.beginPath(); ctx.ellipse(r * .42, -r * .05, 1.9 * s, 2.5 * s, 0, 0, TAU); ctx.fill();
  if (D.accent) {
    ctx.fillStyle = D.accent;
    ctx.beginPath(); ctx.ellipse(r * .46, -r * .12, 1.1 * s, 1.4 * s, 0, 0, TAU); ctx.fill();
  }

  const hc = L.hairColor || '#222';
  ctx.strokeStyle = hc; ctx.fillStyle = hc; ctx.lineWidth = 3 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  switch (L.hair) {
    case 'horns': {
      // helmet dome
      ctx.fillStyle = L.helmet; ctx.beginPath();
      ctx.arc(0, -2 * s, r * 1.02, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
      ctx.strokeStyle = shade(L.helmet, .6); ctx.lineWidth = 2 * s; ctx.stroke();
      // horns
      ctx.strokeStyle = L.hairColor; ctx.lineWidth = 5 * s;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * r * .55, -r * .72);
        ctx.quadraticCurveTo(dir * r * 1.35, -r * 1.35, dir * r * 1.15, -r * 2.0);
        ctx.stroke();
      }
      break;
    }
    case 'flame': {
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI * .95 + (i / (n - 1)) * Math.PI * .9;
        const flick = 1 + Math.sin(f.animT * .4 + i) * .22;
        const len = r * (1.5 + (i % 2) * .55) * flick;
        ctx.fillStyle = i % 2 ? '#ffd24a' : '#ff6a1a';
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * .9, Math.sin(a) * r * .9);
        ctx.quadraticCurveTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2 - len * .45, Math.cos(a) * r * 1.0 + Math.sin(f.animT * .3 + i) * 3, Math.sin(a) * r - len);
        ctx.quadraticCurveTo(Math.cos(a) * r * .55, Math.sin(a) * r * .6 - len * .35, Math.cos(a) * r * .35, Math.sin(a) * r * .55);
        ctx.fill();
      }
      break;
    }
    case 'bolt': {
      ctx.fillStyle = hc;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * .95 + i * .38;
        const len = r * (1.15 + (i % 2) * .45);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * .8, Math.sin(a) * r * .8);
        ctx.lineTo(Math.cos(a + .12) * r * .9 + 4, Math.sin(a) * r - len * .55);
        ctx.lineTo(Math.cos(a) * r * .95, Math.sin(a) * r - len);
        ctx.lineTo(Math.cos(a - .12) * r * .8, Math.sin(a) * r - len * .5);
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'spiky': {
      ctx.fillStyle = hc;
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI * 1.06 + i * 0.31;
        const bl = r * (i % 2 === 0 ? 1.75 : 1.35);
        const bx = Math.cos(a) * r * 0.82, by = Math.sin(a) * r * 0.82;
        const px = -Math.sin(a) * 4.4 * s, py = Math.cos(a) * 4.4 * s;
        ctx.beginPath();
        ctx.moveTo(bx + px, by + py);
        ctx.lineTo(Math.cos(a + .1) * bl, Math.sin(a + .1) * bl - 2);
        ctx.lineTo(bx - px, by - py);
        ctx.closePath(); ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, -1 * s, r * 0.92, Math.PI * 0.98, Math.PI * 2.02);
      ctx.lineTo(r * 0.55, r * 0.18);
      ctx.lineTo(r * 0.1, -r * 0.12);
      ctx.lineTo(-r * 0.5, r * 0.14);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'bangs': {
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.arc(0, -2 * s, r * 1.08, Math.PI * .98, Math.PI * 2.02);
      ctx.lineTo(r * .9, r * .1); ctx.lineTo(r * .3, -r * .25);
      ctx.lineTo(-r * .1, r * .15); ctx.lineTo(-r * .8, -r * .1);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 1.02, -r * .3); ctx.quadraticCurveTo(-r * 1.5, r * .5, -r * .85, r * 1.0);
      ctx.quadraticCurveTo(-r * .95, r * .3, -r * .7, -r * .1); ctx.fill();
      break;
    }
    case 'long': {
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.arc(0, -2 * s, r * 1.12, Math.PI * .92, Math.PI * 2.08);
      ctx.lineTo(r * .8, r * .4); ctx.lineTo(r * .2, -r * .1); ctx.lineTo(-r * .5, r * .3);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 1.05, -r * .5);
      ctx.quadraticCurveTo(-r * 1.9, r * 1.6, -r * 1.0, r * 2.4);
      ctx.quadraticCurveTo(-r * 1.25, r * 1.1, -r * .75, -r * .2);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'ponytail': {
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.arc(0, -2 * s, r * 1.06, Math.PI * .95, Math.PI * 2.05);
      ctx.lineTo(r * .85, r * .12); ctx.lineTo(-r * .9, -r * .05);
      ctx.closePath(); ctx.fill();
      const lag = Math.sin(f.animT * .08) * 4 * s;
      ctx.strokeStyle = hc; ctx.lineWidth = 8 * s; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * .85, -r * .3);
      ctx.quadraticCurveTo(-r * 2.0, r * .2 + lag, -r * 2.1, r * 1.5 + lag);
      ctx.stroke();
      ctx.strokeStyle = L.sash || '#5c3f8f'; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(-r * .5, -r * .95); ctx.lineTo(-r * 1.1, -r * .55); ctx.stroke();
      break;
    }
    case 'bandana': {
      ctx.fillStyle = L.mask || '#22263a';
      ctx.beginPath(); ctx.arc(0, 0, r * 1.0, Math.PI * .15, Math.PI * .85); ctx.fill();
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.arc(0, -2 * s, r * 1.05, Math.PI * .98, Math.PI * 2.02);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = L.scarf || '#8b3fd6'; ctx.lineWidth = 5 * s;
      ctx.beginPath(); ctx.moveTo(-r * .9, -r * .25); ctx.lineTo(r * .9, -r * .35); ctx.stroke();
      const lag = Math.sin(f.animT * .09) * 3 * s;
      ctx.beginPath(); ctx.moveTo(-r * .95, -r * .3); ctx.quadraticCurveTo(-r * 1.9, -r * .1 + lag, -r * 2.2, r * .6 + lag); ctx.stroke();
      break;
    }
  }

  if (L.headband) {
    ctx.strokeStyle = L.headband; ctx.lineWidth = 4.2 * s;
    ctx.beginPath(); ctx.moveTo(-r * 1.02, -r * .42); ctx.lineTo(r * 1.0, -r * .52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * .9, -r * .45); ctx.quadraticCurveTo(-r * 1.7, -r * .1, -r * 1.9, r * .55); ctx.stroke();
  }
  if (L.crown) {
    ctx.fillStyle = '#bfe9ff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2 * s;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * .45 - 3 * s, -r * .95);
      ctx.lineTo(i * r * .45, -r * 1.6 - (i === 0 ? 5 * s : 0));
      ctx.lineTo(i * r * .45 + 3 * s, -r * .95);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  if (L.earring) {
    ctx.fillStyle = L.earring;
    ctx.beginPath(); ctx.arc(-r * .75, r * .2, 1.9 * s, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ---------------- cloth ---------------- */
function drawCape(f, L, P, LM) {
  const nX = Math.sin(P.lean) * LM.torso * .88;
  const nY = -Math.cos(P.lean) * LM.torso * .88;
  const lag = clamp(f.capeLag || 0, -1, 1);
  const lift = clamp(f.airY / 140, 0, 1);
  const sway = Math.sin(f.animT * .08) * 4;
  const tipX = -34 - lag * 28 - lift * 16 + sway * .4;
  const tipY = nY * .9 + 74 - lift * 30;
  const midX = -24 - lag * 16;
  const midY = nY * .82 + 34 + sway;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(nX + 7, nY + 3);
  ctx.quadraticCurveTo(midX, midY, tipX, tipY);
  ctx.quadraticCurveTo(tipX - 20, tipY - 30, midX - 12, nY * .5 + 24);
  ctx.quadraticCurveTo(-10, nY * .8, nX - 7, nY + 3);
  ctx.closePath();
  const g = ctx.createLinearGradient(nX, nY, tipX, tipY);
  g.addColorStop(0, L.cape);
  g.addColorStop(1, shade(L.cape, .55));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = hexA(L.capeTrim || L.cape, .5);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function drawScarf(f, L, P) {
  const nX = Math.sin(P.lean) * 34, nY = -Math.cos(P.lean) * 34;
  const lag = clamp(f.capeLag || 0, -1, 1);
  const lift = clamp(f.airY / 130, 0, 1);
  ctx.save();
  ctx.strokeStyle = L.scarf;
  ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(nX + 2, nY + 2);
  ctx.quadraticCurveTo(-24 - lag * 20, nY + 10 - lift * 20, -54 - lag * 34, nY + 26 - lift * 54 + Math.sin(f.animT * .14) * 5);
  ctx.stroke();
  ctx.strokeStyle = shade(L.scarf, .7); ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();
}

/* ---------------- weapons ---------------- */
function drawWeaponAt(f, D, hx, hy, armAngle, s) {
  const rot = Math.PI / 2 - armAngle;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(rot);
  const c = D.weaponColor || '#dfe6ff';
  switch (D.weapon) {
    case 'greatsword': {
      // grip + guard
      ctx.strokeStyle = '#2a2228'; ctx.lineWidth = 6 * s;
      ctx.beginPath(); ctx.moveTo(-14 * s, 0); ctx.lineTo(0, 0); ctx.stroke();
      ctx.fillStyle = '#6d6472';
      ctx.fillRect(-2 * s, -8 * s, 5 * s, 16 * s);
      // blade
      const len = 56 * s;
      ctx.beginPath();
      ctx.moveTo(2 * s, -6.5 * s);
      ctx.lineTo(len * .88, -8.5 * s);
      ctx.lineTo(len, 0);
      ctx.lineTo(len * .88, 8.5 * s);
      ctx.lineTo(2 * s, 6.5 * s);
      ctx.closePath();
      ctx.fillStyle = f.demon > 0 ? '#12121a' : '#1e1e28';
      ctx.fill();
      ctx.strokeStyle = f.demon > 0 ? '#ff5a63' : '#8e93a8';
      ctx.lineWidth = 2 * s; ctx.stroke();
      ctx.strokeStyle = f.demon > 0 ? '#ff7a83' : '#c9cee0';
      ctx.lineWidth = 1.3 * s;
      ctx.beginPath(); ctx.moveTo(10 * s, 0); ctx.lineTo(len * .82, 0); ctx.stroke();
      if (f.demon > 0) {
        ctx.shadowColor = '#e8323c'; ctx.shadowBlur = 14;
        ctx.strokeStyle = '#e8323c'; ctx.lineWidth = 1.4 * s;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.arc(24 * s + i * 10 * s, 0, 4 * s, 0, TAU); ctx.stroke();
        }
      }
      break;
    }
    case 'katana': {
      ctx.strokeStyle = '#2b2430'; ctx.lineWidth = 5 * s;
      ctx.beginPath(); ctx.moveTo(-16 * s, 0); ctx.lineTo(0, 0); ctx.stroke();
      ctx.strokeStyle = '#8b8496'; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(-1 * s, -8 * s); ctx.lineTo(-1 * s, 8 * s); ctx.stroke();
      const len = 62 * s;
      ctx.beginPath();
      ctx.moveTo(1 * s, 2.4 * s);
      ctx.quadraticCurveTo(len * .55, -3 * s, len, -2 * s);
      ctx.quadraticCurveTo(len * .55, 1 * s, 1 * s, -1.6 * s);
      ctx.closePath();
      ctx.fillStyle = c; ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1 * s; ctx.stroke();
      break;
    }
    case 'axe': {
      drawAxeShape(2 * s, 0, 0, D.weaponColor, D.accent);
      break;
    }
    case 'staff': {
      ctx.strokeStyle = '#6a5a48'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-26 * s, 0); ctx.lineTo(44 * s, 0); ctx.stroke();
      const px = 50 * s;
      const pulse = 1 + Math.sin(f.animT * .12) * .12;
      ctx.shadowColor = c; ctx.shadowBlur = 16;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(px, -8 * s * pulse); ctx.lineTo(px + 8 * s * pulse, 0);
      ctx.lineTo(px, 8 * s * pulse); ctx.lineTo(px - 8 * s * pulse, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2 * s; ctx.stroke();
      break;
    }
    case 'kunai': {
      ctx.strokeStyle = '#2b2430'; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(-9 * s, 0); ctx.lineTo(0, 0); ctx.stroke();
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.moveTo(0, -4 * s); ctx.lineTo(20 * s, 0); ctx.lineTo(0, 4 * s); ctx.closePath();
      ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = .9 * s; ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

function drawGrimoire(f, x, y, s) {
  ctx.save();
  ctx.translate(x, y + Math.sin(f.animT * .07) * 4 * s);
  ctx.rotate(Math.sin(f.animT * .04) * .18);
  ctx.shadowColor = '#57e39b'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#e9e2c0'; ctx.strokeStyle = '#2f8f63'; ctx.lineWidth = 1.4 * s;
  ctx.fillRect(-7 * s, -9 * s, 14 * s, 18 * s);
  ctx.strokeRect(-7 * s, -9 * s, 14 * s, 18 * s);
  ctx.strokeStyle = '#57e39b'; ctx.lineWidth = 1 * s;
  ctx.beginPath(); ctx.moveTo(0, -9 * s); ctx.lineTo(0, 9 * s); ctx.stroke();
  ctx.restore();
}

function drawDemonMarks(hx, hy, s, P) {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = '#ff5a63'; ctx.lineWidth = 1.6 * s; ctx.globalAlpha = .9;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 5 * s, -2 * s);
    ctx.quadraticCurveTo(i * 9 * s, 3 * s, i * 4 * s, 8 * s);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhoenix(f, x, y) {
  const s = f.scale || 1;
  const t = f.animT;
  const cy = y - f.airY;
  ctx.save();
  ctx.translate(x, cy - 56 * s);
  ctx.scale(f.face * s * 1.28, s * 1.28);
  ctx.rotate(f.phoenixRot || 0);
  ctx.globalCompositeOperation = 'lighter';

  // tail streams
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const wav = Math.sin(t * .3 + i) * 10;
    ctx.strokeStyle = i === 0 ? 'rgba(255,120,20,.75)' : 'rgba(255,190,70,.5)';
    ctx.lineWidth = i === 0 ? 9 : 5;
    ctx.beginPath();
    ctx.moveTo(-14, i * 6);
    ctx.quadraticCurveTo(-52, i * 16 + wav, -96, i * 26 + wav * 1.6);
    ctx.stroke();
  }

  // wings: three feather layers each side
  const flap = Math.sin(t * .45) * .22;
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.rotate(dir * (0.22 + flap));
    for (let i = 0; i < 3; i++) {
      const len = 84 - i * 16;
      const spread = -0.16 - i * 0.22;
      ctx.save();
      ctx.rotate(spread);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, 'rgba(255,236,150,.95)');
      g.addColorStop(.45, dir > 0 ? 'rgba(255,140,30,.72)' : 'rgba(255,110,20,.62)');
      g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(4, -14);
      ctx.quadraticCurveTo(len * .55, -34 - i * 6, len, -10);
      ctx.quadraticCurveTo(len * .6, 18 + i * 6, 4, 14);
      ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,170,60,.35)';
      ctx.lineWidth = 1.2; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.restore();
    }
    ctx.restore();
  }

  // body
  const g2 = ctx.createRadialGradient(0, 0, 2, 0, 0, 40);
  g2.addColorStop(0, '#fffdf0');
  g2.addColorStop(.42, '#ffd75e');
  g2.addColorStop(1, 'rgba(255,90,0,0)');
  ctx.fillStyle = g2;
  ctx.beginPath(); ctx.ellipse(0, 0, 36, 22, 0, 0, TAU); ctx.fill();

  // head + beak + crest
  ctx.fillStyle = '#fff6c9';
  ctx.beginPath(); ctx.ellipse(24, -8, 13, 10, .2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff9a2b';
  ctx.beginPath(); ctx.moveTo(35, -7); ctx.lineTo(48, -2); ctx.lineTo(35, 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1b1008';
  ctx.beginPath(); ctx.arc(28, -11, 2, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#ffd75e'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(20, -16); ctx.quadraticCurveTo(14, -30, 22, -34); ctx.stroke();
  ctx.restore();
}

function drawAura(f, D, s) {
  const strength = Math.max(f.aura || 0, f.demon > 0 ? .95 : 0);
  if (strength < .06) return;
  const col = f.demon > 0 ? '#e8323c' : D.accent;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cy = -56 * s, rx = 46 * s, ry = 74 * s;
  const g = ctx.createRadialGradient(0, cy, 4, 0, cy, ry);
  g.addColorStop(0, hexA(col, .20 * strength));
  g.addColorStop(.55, hexA(col, .08 * strength));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawGlove(x, y, color, s, k) {
  ctx.save();
  ctx.globalAlpha *= (k || 1);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, 5.6 * s, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawMantle(L, P, s) {
  const nX = Math.sin(P.lean) * 44, nY = -Math.cos(P.lean) * 44;
  ctx.save();
  ctx.translate(nX, nY);
  ctx.rotate(P.lean * .6);
  ctx.beginPath();
  ctx.moveTo(-14 * s, 0);
  ctx.quadraticCurveTo(0, 5 * s, 14 * s, 0);
  ctx.lineTo(18 * s, 15 * s);
  ctx.lineTo(0, 26 * s);
  ctx.lineTo(-18 * s, 15 * s);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, 0, 22 * s);
  g.addColorStop(0, L.mantle);
  g.addColorStop(1, shade(L.mantle, .68));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = L.mantleTrim || shade(L.mantle, .5);
  ctx.lineWidth = 1.3 * s; ctx.stroke();
  ctx.restore();
}


function drawSpirit(f, s) {
  const p = clamp((f.ultT - 16) / 14, 0, 1);
  const fade = f.ultT > 88 ? clamp((112 - f.ultT) / 24, 0, 1) : 1;
  const a = p * fade;
  if (a <= 0) return;
  const t = f.animT;
  const cy = -128 * s;
  ctx.save();
  ctx.translate(0, cy);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a * .85;

  // glow core
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 110 * s);
  g.addColorStop(0, 'rgba(190,255,225,.55)');
  g.addColorStop(.5, 'rgba(87,227,155,.18)');
  g.addColorStop(1, 'rgba(87,227,155,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 110 * s, 0, TAU); ctx.fill();

  // spectral wings
  const flap = Math.sin(t * .12) * .18;
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.rotate(dir * (0.16 + flap));
    for (let i = 0; i < 4; i++) {
      const len = (118 - i * 20) * s;
      ctx.save();
      ctx.rotate(-0.1 - i * 0.17);
      const wg = ctx.createLinearGradient(0, 0, len, 0);
      wg.addColorStop(0, 'rgba(200,255,232,.75)');
      wg.addColorStop(.6, 'rgba(87,227,155,.35)');
      wg.addColorStop(1, 'rgba(87,227,155,0)');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(4, -10);
      ctx.quadraticCurveTo(len * .55, -30 - i * 5, len, -6);
      ctx.quadraticCurveTo(len * .6, 14 + i * 5, 4, 10);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // spectral head + eyes
  ctx.fillStyle = 'rgba(210,255,238,.5)';
  ctx.beginPath(); ctx.ellipse(0, -2 * s, 20 * s, 14 * s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#eafff5';
  ctx.beginPath(); ctx.arc(-5 * s, -4 * s, 2.6 * s, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(6 * s, -4 * s, 2.6 * s, 0, TAU); ctx.fill();

  // wind arcs
  ctx.strokeStyle = 'rgba(200,255,232,.45)';
  ctx.lineWidth = 2 * s;
  for (let i = 0; i < 3; i++) {
    const rr = (58 + i * 26) * s;
    ctx.beginPath();
    ctx.ellipse(0, 10 * s, rr, rr * .34, Math.sin(t * .04 + i) * .3, 0.2 + i, 2.4 + i);
    ctx.stroke();
  }
  ctx.restore();
}


function drawIceBlock(s) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, -110 * s, 0, 0);
  g.addColorStop(0, 'rgba(224,250,255,.85)');
  g.addColorStop(.6, 'rgba(150,225,255,.55)');
  g.addColorStop(1, 'rgba(120,200,255,.7)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-26 * s, 0);
  ctx.lineTo(-32 * s, -52 * s);
  ctx.lineTo(-18 * s, -104 * s);
  ctx.lineTo(6 * s, -118 * s);
  ctx.lineTo(26 * s, -96 * s);
  ctx.lineTo(30 * s, -40 * s);
  ctx.lineTo(20 * s, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(235,252,255,.85)';
  ctx.lineWidth = 1.6 * s;
  ctx.stroke();
  // facets
  ctx.strokeStyle = 'rgba(255,255,255,.4)';
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(-18 * s, -104 * s); ctx.lineTo(4 * s, -60 * s); ctx.lineTo(30 * s, -40 * s);
  ctx.moveTo(-32 * s, -52 * s); ctx.lineTo(4 * s, -60 * s); ctx.lineTo(20 * s, 0);
  ctx.stroke();
  ctx.restore();
}

/* speed-trail silhouette (dash / fast movement) */
function drawGhost(f, g, a) {
  const s = f.scale || 1;
  const P = poseOf(f);
  ctx.save();
  ctx.globalAlpha = clamp(a, 0, 1) * .3;
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(g.x, g.y - (g.airY || 0));
  ctx.scale((g.face || 1) * s, s);
  const fLeg = limbPts(0, 0, P.fL[0], P.fL[1], LIMB.thigh, LIMB.shin);
  const bLeg = limbPts(0, 0, P.bL[0], P.bL[1], LIMB.thigh, LIMB.shin);
  const hipY = -Math.max(fLeg.ey, bLeg.ey);
  ctx.translate(0, hipY);
  const neckX = Math.sin(P.lean) * LIMB.torso;
  const neckY = -Math.cos(P.lean) * LIMB.torso;
  ctx.strokeStyle = f.data.accent;
  ctx.lineWidth = 9 * s;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(fLeg.jx, fLeg.jy); ctx.lineTo(fLeg.ex, fLeg.ey); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bLeg.jx, bLeg.jy); ctx.lineTo(bLeg.ex, bLeg.ey); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(neckX, neckY); ctx.stroke();
  const sh = { x: neckX * .92, y: neckY * .92 };
  const fArm = limbPts(sh.x, sh.y, P.fA[0], P.fA[1], LIMB.up, LIMB.fore);
  ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(fArm.jx, fArm.jy); ctx.lineTo(fArm.ex, fArm.ey); ctx.stroke();
  ctx.beginPath(); ctx.arc(neckX + Math.sin(P.lean) * LIMB.neck, neckY - Math.cos(P.lean) * LIMB.neck, 11 * s, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ---------------- pose blending (fluid, overlapping motion) ---------------- */
function clonePose(t) {
  return {
    lean: t.lean, bob: t.bob, headTilt: t.headTilt, headX: t.headX,
    fA: [t.fA[0], t.fA[1]], bA: [t.bA[0], t.bA[1]],
    fL: [t.fL[0], t.fL[1]], bL: [t.bL[0], t.bL[1]]
  };
}

function blendPose(prev, t, a) {
  if (!prev) return clonePose(t);
  const L = (x, y) => x + (y - x) * a;
  return {
    lean: L(prev.lean, t.lean), bob: L(prev.bob, t.bob),
    headTilt: L(prev.headTilt, t.headTilt), headX: L(prev.headX, t.headX),
    fA: [L(prev.fA[0], t.fA[0]), L(prev.fA[1], t.fA[1])],
    bA: [L(prev.bA[0], t.bA[0]), L(prev.bA[1], t.bA[1])],
    fL: [L(prev.fL[0], t.fL[0]), L(prev.fL[1], t.fL[1])],
    bL: [L(prev.bL[0], t.bL[0]), L(prev.bL[1], t.bL[1])]
  };
}

/* how fast the body catches up to the target pose (per state) */
function poseRate(f) {
  if (f.state === 'ko') return 0.18;
  if (f.state === 'stun') return 0.3;
  if (f.ult) return 0.42;
  if (f.atk) {
    const k = f.atkT / f.atkDur;
    if (k > 0.26 && k < 0.66) return 0.82;  // snap on the strike
    return 0.5;
  }
  if (f.dashT > 0) return 0.7;
  if (f.airY > 0) return 0.32;
  if (f.landT > 0) return 0.55;
  if (f.walking) return 0.4;
  return 0.26;
}

/* tapered motion smear between two world points */
function drawSmear(a, b, w, color, alpha) {
  if (!a || !b) return;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 6) return;
  const nx = -dy / len, ny = dx / len;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
  g.addColorStop(0, hexA(color, 0));
  g.addColorStop(.55, hexA(color, .45));
  g.addColorStop(1, hexA(color, .85));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(a.x + nx * w * .25, a.y + ny * w * .25);
  ctx.lineTo(b.x + nx * w, b.y + ny * w);
  ctx.lineTo(b.x - nx * w, b.y - ny * w);
  ctx.lineTo(a.x - nx * w * .25, a.y - ny * w * .25);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* hand with a wrist joint (adds a little overlap/flick on fast swings) */
function drawHand(arm, angle, color, lw, phase) {
  const a = angle - 0.55 + Math.sin(phase * .19) * .06;
  const hx = arm.ex + Math.sin(a) * 8;
  const hy = arm.ey + Math.cos(a) * 8;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(6,9,16,.5)'; ctx.lineWidth = lw + 2.6;
  ctx.beginPath(); ctx.moveTo(arm.ex, arm.ey); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(arm.ex, arm.ey); ctx.lineTo(hx, hy); ctx.stroke();
}
