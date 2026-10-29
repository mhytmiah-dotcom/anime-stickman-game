/* ============================================================
   model.js — pure helpers shared by the scenes, the app and the
   Node tests. No DOM, no canvas, no clock: everything here is a
   deterministic function of its arguments.
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CosmosModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => {
    t = clamp(t, 0, 1);
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };
  const smoothstep = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  /* Small, fast, seedable PRNG so every render starts from the same sky. */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Latitude/longitude on a unit sphere, spun around the polar axis.
     +x right, +y down, +z toward the viewer. */
  function projectSpherical(lon, lat, spin) {
    const la = lat * DEG;
    const lo = (lon + (spin || 0)) * DEG;
    const cosLa = Math.cos(la);
    const x = cosLa * Math.sin(lo);
    const y = -Math.sin(la);
    const z = cosLa * Math.cos(lo);
    return { x, y, z, visible: z > 0 };
  }

  /* Screen-space projection: invisible points are pulled onto the limb
     so polygons that cross the horizon stay closed. */
  function projectToScreen(lon, lat, spin, cx, cy, radius) {
    const p = projectSpherical(lon, lat, spin);
    const len = Math.hypot(p.x, p.y) || 1;
    const scale = p.visible ? 1 : 1 / len;
    return {
      x: cx + p.x * radius * scale,
      y: cy + p.y * radius * scale,
      z: p.z,
      visible: p.visible
    };
  }

  /* Angular position of a planet. `elapsed` is in seconds of scene time;
     `orbitSpeed` is radians per second at one Earth year. */
  function planetAngle(periodYears, elapsed, phase) {
    return (phase || 0) + (elapsed * TAU) / (periodYears * 8);
  }

  function orbitPosition(orbitRadius, periodYears, elapsed, phase) {
    const angle = planetAngle(periodYears, elapsed, phase);
    return { angle, x: Math.cos(angle) * orbitRadius, y: Math.sin(angle) * orbitRadius };
  }

  /* ---- galaxy ---- */
  const STAR_COLORS = ['#cfe4ff', '#e8f3ff', '#ffe9c9', '#ffd6a5', '#ff9ecb', '#b7c7ff'];

  function makeGalaxy(count, seed, arms) {
    const rnd = mulberry32(seed === undefined ? 1337 : seed);
    const armCount = arms || 4;
    const stars = [];
    for (let i = 0; i < count; i++) {
      const arm = i % armCount;
      const isField = rnd() < 0.13;
      const isHii = rnd() < 0.05;
      const core = Math.pow(rnd(), 2.4);
      const r = isField ? Math.pow(rnd(), 0.55) : clamp(core * 0.55 + Math.pow(rnd(), 0.7) * 0.72, 0.02, 1);
      const spread = isField ? 2.4 : 0.18 + r * 0.34;
      const theta = isField
        ? rnd() * TAU
        : arm * (TAU / armCount) + r * 3.9 + (rnd() - 0.5) * spread + (rnd() < 0.5 ? 0 : 0.14);
      const color = isHii
        ? '#ff9ecb'
        : r < 0.24
          ? (rnd() < 0.7 ? '#ffe9c9' : '#ffd6a5')
          : STAR_COLORS[Math.floor(rnd() * STAR_COLORS.length)];
      stars.push({
        r,
        theta,
        arm,
        size: 0.55 + rnd() * (isHii ? 2.4 : 1.5),
        alpha: isField ? 0.28 + rnd() * 0.35 : 0.45 + rnd() * 0.55,
        phase: rnd() * TAU,
        color,
        kind: isHii ? 'hii' : isField ? 'field' : 'arm'
      });
    }
    return stars;
  }

  function makeStarfield(count, seed) {
    const rnd = mulberry32(seed === undefined ? 7 : seed);
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rnd(),
        y: rnd(),
        size: 0.35 + Math.pow(rnd(), 3) * 1.9,
        alpha: 0.22 + rnd() * 0.7,
        phase: rnd() * TAU,
        speed: 0.15 + rnd() * 0.9,
        tint: rnd() < 0.12 ? '#ffd9c2' : rnd() < 0.2 ? '#bcd6ff' : '#ffffff'
      });
    }
    return stars;
  }

  /* ---- quiz ---- */
  function scoreAnswer(question, choice) {
    return !!question && Number.isInteger(choice) && choice === question.answer;
  }

  function quizSummary(questions, answers) {
    const total = questions.length;
    let correct = 0;
    for (let i = 0; i < total; i++) {
      if (scoreAnswer(questions[i], answers[i])) correct++;
    }
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const rank = pct === 100 ? 'Cosmic cartographer'
      : pct >= 80 ? 'Galactic navigator'
      : pct >= 60 ? 'Orbit tour guide'
      : pct >= 40 ? 'Curious stargazer'
      : 'Fresh from the atmosphere';
    return { correct, total, pct, rank };
  }

  /* ---- tiny presentation helpers ---- */
  function formatNumber(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function hexToRgb(hex) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgba(hex, alpha) {
    const c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
  }

  return {
    TAU, DEG, clamp, lerp, easeInOut, smoothstep, mulberry32,
    projectSpherical, projectToScreen, planetAngle, orbitPosition,
    makeGalaxy, makeStarfield, scoreAnswer, quizSummary,
    formatNumber, hexToRgb, rgba, STAR_COLORS
  };
});
