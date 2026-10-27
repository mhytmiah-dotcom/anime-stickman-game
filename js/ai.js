/* ============================================================
   ai.js — CPU opponent ("the machine")
   ------------------------------------------------------------
   The CPU plays through exactly the same input path as a human:
   it writes into the shared `keys` / `pressed` maps under its own
   virtual key names (AI_KEY), and Fighter.handleInput() cannot tell
   the difference. That means the CPU automatically inherits every
   movement rule of the game — lunges, dash invincibility, combo
   cancels, air dive kicks and ult lockouts.

   Design goals:
     * beatable — decisions are rate-limited by `react` frames, so
       a slow CPU literally sees you late;
     * readable — it declines to act on things it "cannot see";
     * human-ish — it backs off, whiffs, and picks fights at range.
   ============================================================ */
'use strict';

/* Virtual controller. These names are not real keyboard keys, so a
   human on the P2 side can never collide with the CPU's inputs. */
const AI_KEY = {
  left: 'ai_left', right: 'ai_right', jump: 'ai_jump',
  punch: 'ai_punch', kick: 'ai_kick', e: 'ai_e', r: 'ai_r'
};

/* Difficulty table.
   react     — frames between decisions (smaller = faster reactions)
   aggro     — chance to press an attack when in range
   defense   — chance to jump / back-dash out of pressure
   ultUse    — chance to fire an ultimate once it is affordable
   chain     — chance to continue a punch chain into the finisher
   jump/dash — appetite for movement tech                        */
const AI_LEVELS = [
  { id: 'rookie',  name: 'ROOKIE',  react: 18, aggro: 0.42, defense: 0.26, ultUse: 0.45, chain: 0.30, jump: 0.10, dash: 0.12 },
  { id: 'fighter', name: 'FIGHTER', react: 10, aggro: 0.64, defense: 0.55, ultUse: 0.78, chain: 0.66, jump: 0.18, dash: 0.30 },
  { id: 'master',  name: 'MASTER',  react: 5,  aggro: 0.84, defense: 0.82, ultUse: 0.96, chain: 0.90, jump: 0.26, dash: 0.46 }
];

/* Session-level options (read by game.js). Defaults to solo play. */
const AI_GAME = { vsCPU: true, level: 1 };

/* ---------------- helpers ---------------- */
function aiClearKeys() {
  for (const k in AI_KEY) keys[AI_KEY[k]] = false;
}

function aiHold(dir) {
  if (dir > 0) keys[AI_KEY.right] = true;
  else if (dir < 0) keys[AI_KEY.left] = true;
}

function aiTap(name) {
  keys[AI_KEY[name]] = true;
  pressed[AI_KEY[name]] = true;
}

/* Effective punch reach in world units (matches attackBox). */
function aiReach(f) {
  return 84 * (f.data.reach || 1) * (f.scale || 1);
}

/* Closest incoming enemy projectile that is actually flying at us. */
function aiThreat(f) {
  let best = null;
  for (const p of projectiles) {
    if (!p.owner || p.owner === f) continue;
    const dx = p.x - f.x;
    if (Math.abs(dx) > 340) continue;
    const coming = Math.abs(p.vx) < 0.2 ||
      (p.vx > 0 && dx < 0) || (p.vx < 0 && dx > 0);
    if (!coming) continue;
    const dist = Math.abs(dx);
    if (!best || dist < best.dist) best = { p, dist };
  }
  return best;
}

/* ---------------- constructor ---------------- */
function makeCPU(level) {
  const lv = AI_LEVELS[clamp(Math.round(level) || 0, 0, AI_LEVELS.length - 1)];
  return {
    level: lv,
    t: 0,
    intent: { type: 'wait', dur: 1 },
    intentT: 1,
    fired: false,
    dashCd: 0,
    jumpCd: 0,
    ultCd: 90,     // grace period so it never opens with an ult
    decisions: 0,
    attacks: 0
  };
}

function aiSet(ai, intent) {
  ai.intent = intent;
  ai.intentT = intent.dur || 10;
  ai.fired = false;
  ai.decisions++;
}


/* ---------------- decision ---------------- */
/* Called only every `level.react` frames once the previous intent has
   expired — this is where reaction speed and personality live. */
function aiDecide(f, ai, t, lv) {
  const dx = t.x - f.x;
  const ad = Math.abs(dx);
  const toward = Math.sign(dx) || 1;
  const reach = aiReach(f);
  const R = Math.random;

  const oppAtk = t.atk && t.atkT < t.atkDur * 0.85;
  const oppStun = t.state === 'stun' && t.stun > 6;
  const oppWhiff = t.atk && t.atkT > t.atkDur * 0.8;

  /* 1. projectile inbound — jump it or slip under it */
  const threat = aiThreat(f);
  if (threat && threat.dist < 300 && R() < lv.defense) {
    if (R() < 0.5 && ai.jumpCd <= 0) return aiSet(ai, { type: 'jump', dur: 24, toward });
    if (ai.dashCd <= 0) return aiSet(ai, { type: 'dash', dur: 14, dir: -toward });
  }

  /* 2. respect pressure: don't stand in front of a swinging opponent */
  if (oppAtk && ad < reach * 1.4 && R() < lv.defense) {
    if (R() < 0.30 && ai.jumpCd <= 0) return aiSet(ai, { type: 'jump', dur: 26, toward });
    if (R() < 0.55 && ai.dashCd <= 0) return aiSet(ai, { type: 'dash', dur: 14, dir: -toward });
    return aiSet(ai, { type: 'retreat', dur: 12 + randi(0, 10) });
  }

  /* 3. spend meter — ults are strongest at mid range */
  if (!f.locked && !f.ult && ai.ultCd <= 0 && ad > 120 && ad < 560) {
    if (f.meter >= 100 && R() < lv.ultUse) {
      return aiSet(ai, { type: 'ult', dur: 14, which: 'r' });
    }
    if (f.data.e && f.meter >= f.data.e.cost && R() < lv.ultUse * 0.35) {
      return aiSet(ai, { type: 'ult', dur: 14, which: 'e' });
    }
  }

  /* 4. punish a whiff or a stun */
  if ((oppStun || oppWhiff) && ad < reach * 1.5) {
    return aiSet(ai, { type: 'attack', dur: 26, kind: R() < 0.55 ? 'kick' : 'punch' });
  }

  /* 5. in range — attack, reset spacing, or wait for a better read */
  if (ad < reach * 0.98) {
    if (R() < lv.aggro) {
      return aiSet(ai, { type: 'attack', dur: 22 + randi(0, 8), kind: R() < 0.34 ? 'kick' : 'punch' });
    }
    if (R() < 0.4) return aiSet(ai, { type: 'retreat', dur: 10 + randi(0, 10) });
    return aiSet(ai, { type: 'wait', dur: 6 + randi(0, 10) });
  }

  /* 6. mid range — walk in, jump in, or dash in */
  if (ad < reach * 2.6) {
    if (ai.jumpCd <= 0 && R() < lv.jump * 0.25) return aiSet(ai, { type: 'jump', dur: 30, toward });
    if (ai.dashCd <= 0 && R() < lv.dash * 0.22) return aiSet(ai, { type: 'dash', dur: 14, dir: toward });
    return aiSet(ai, { type: 'approach', dur: 10 + randi(0, 12) });
  }

  /* 7. far away — close the gap */
  if (ai.dashCd <= 0 && R() < lv.dash * 0.35) return aiSet(ai, { type: 'dash', dur: 14, dir: toward });
  return aiSet(ai, { type: 'approach', dur: 16 + randi(0, 14) });
}

/* ---------------- execution ---------------- */
function aiExecute(f, ai, t, lv) {
  const it = ai.intent;
  const dx = t.x - f.x;
  const ad = Math.abs(dx);
  const toward = Math.sign(dx) || 1;

  switch (it.type) {
    case 'approach':
      aiHold(toward);
      break;

    case 'retreat':
      aiHold(-toward);
      break;

    case 'wait':
      break;

    case 'dash':
      if (!ai.fired && !f.atk && !f.ult) {
        ai.fired = true;
        ai.dashCd = 34 + randi(0, 24);
        f.startDash(it.dir || toward);
      }
      break;

    case 'jump':
      if (!ai.fired && !f.atk && !f.ult) {
        ai.fired = true;
        ai.jumpCd = 60 + randi(0, 30);
        aiTap('jump');
      }
      break;

    case 'attack': {
      if (f.atk || f.ult) {
        // already swinging — chain into the finisher during the cancel window
        if (f.atk && f.atkT > f.atkDur * 0.52 && Math.random() < lv.chain) {
          aiTap(it.kind === 'kick' ? 'kick' : 'punch');
          ai.attacks++;
        }
        break;
      }
      if (ad > aiReach(f) * 0.98) { aiHold(toward); break; }
      if (f.state === 'idle') {
        aiTap(it.kind === 'kick' ? 'kick' : 'punch');
        ai.attacks++;
      }
      break;
    }

    case 'ult':
      if (!ai.fired && !f.atk && !f.ult && f.state === 'idle') {
        ai.fired = true;
        ai.ultCd = 110 + randi(0, 60);
        f.tryUlt(it.which);
      }
      break;
  }
}

/* ---------------- per-frame brain ---------------- */
function aiThink(f) {
  const ai = f.ai;
  const lv = ai.level;

  aiClearKeys();
  ai.t++;
  if (ai.dashCd > 0) ai.dashCd--;
  if (ai.jumpCd > 0) ai.jumpCd--;
  if (ai.ultCd > 0) ai.ultCd--;
  if (ai.intentT > 0) ai.intentT--;

  const t = f.target;
  if (!t || !t.alive || G.koTimer || f.held || f.frozen > 0 || f.state === 'ko') {
    ai.intent = { type: 'wait', dur: 1 };
    ai.intentT = 1;
    return;
  }
  if (!ALLOW_INPUT) return;

  /* Airborne: steer, and dive-kick onto a grounded opponent. */
  if (f.airY > 0) {
    if (!f.atk) {
      aiHold(Math.sign(t.x - f.x));
      if (ai.intent.type === 'jump' && f.airY > 30 && f.airY < 130 &&
          Math.abs(t.x - f.x) < aiReach(f) * 1.2 && f.jumpT % 4 === 0) {
        aiTap('punch'); // becomes an airkick in startAttack()
        ai.attacks++;
      }
    }
    return;
  }

  if (ai.intentT <= 0 && ai.t % lv.react === 0) aiDecide(f, ai, t, lv);
  aiExecute(f, ai, t, lv);
}
