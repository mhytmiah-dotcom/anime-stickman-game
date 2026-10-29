/* ============================================================
   scenes.js — the three canvas paintings: Earth, the Solar
   System and the Milky Way. Pure draw functions: give them a
   2D context, a size and a state object and they paint.
   ============================================================ */
(function (root, factory) {
  let model = root.CosmosModel;
  if (!model && typeof require === 'function') {
    try { model = require('./model.js'); } catch (err) { model = null; }
  }
  const api = factory(model);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CosmosScenes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (M) {
  'use strict';
  if (!M) throw new Error('CosmosScenes needs CosmosModel loaded first');

  const { TAU, clamp, lerp, rgba, mulberry32 } = M;
  const FONT = '"Segoe UI", system-ui, Arial, sans-serif';

  /* Simplified coastlines: [longitude, latitude] pairs. */
  const CONTINENTS = [
    { name: 'North America', points: [
      [-168, 66], [-155, 71], [-130, 70], [-110, 73], [-90, 73], [-75, 70], [-60, 60], [-52, 47],
      [-65, 45], [-70, 42], [-75, 35], [-81, 25], [-90, 29], [-97, 26], [-105, 31], [-114, 32],
      [-122, 38], [-124, 48], [-132, 55], [-145, 60], [-160, 58], [-168, 66]
    ] },
    { name: 'South America', points: [
      [-79, 9], [-71, 12], [-62, 11], [-52, 5], [-44, -2], [-35, -6], [-38, -15], [-41, -22],
      [-48, -27], [-58, -35], [-62, -41], [-66, -50], [-71, -55], [-75, -48], [-73, -38], [-71, -25],
      [-70, -18], [-76, -14], [-81, -5], [-79, 9]
    ] },
    { name: 'Africa', points: [
      [-17, 15], [-16, 22], [-10, 27], [0, 32], [10, 34], [20, 32], [32, 31], [35, 23], [43, 12],
      [51, 12], [43, 2], [41, -8], [36, -18], [32, -26], [26, -34], [18, -34], [13, -25], [12, -15],
      [9, -1], [5, 5], [-5, 5], [-13, 9], [-17, 15]
    ] },
    { name: 'Europe', points: [
      [-9, 37], [-9, 43], [-2, 43], [-1, 46], [-4, 48], [-1, 49], [2, 51], [4, 53], [7, 54],
      [9, 57], [11, 59], [15, 56], [19, 55], [21, 56], [24, 60], [30, 60], [31, 70], [20, 70],
      [10, 64], [5, 61], [8, 54], [13, 54], [15, 50], [20, 48], [29, 45], [28, 41], [23, 40],
      [20, 39], [13, 38], [18, 40], [13, 45], [9, 44], [3, 43], [3, 37], [-9, 37]
    ] },
    { name: 'Asia', points: [
      [30, 70], [45, 72], [60, 74], [80, 76], [100, 76], [120, 73], [140, 71], [160, 68], [172, 66],
      [162, 60], [152, 59], [142, 54], [135, 45], [130, 40], [122, 31], [120, 22], [110, 15], [102, 10],
      [95, 5], [88, 7], [80, 9], [72, 20], [62, 24], [52, 28], [45, 33], [38, 36], [30, 40], [28, 45],
      [32, 50], [40, 55], [45, 62], [38, 66], [30, 70]
    ] },
    { name: 'Australia', points: [
      [113, -22], [114, -32], [118, -35], [126, -33], [134, -33], [141, -38], [150, -37], [153, -28],
      [148, -20], [142, -11], [132, -11], [125, -14], [116, -20], [113, -22]
    ] },
    { name: 'Antarctica', points: [
      [-180, -66], [-120, -70], [-60, -72], [0, -70], [60, -68], [120, -68], [180, -66],
      [180, -90], [-180, -90]
    ] },
    { name: 'Greenland', points: [
      [-45, 60], [-30, 68], [-20, 76], [-25, 83], [-45, 84], [-58, 80], [-60, 70], [-45, 60]
    ] },
    { name: 'Madagascar', points: [
      [43, -12], [50, -15], [50, -24], [45, -26], [43, -20], [43, -12]
    ] },
    { name: 'Japan', points: [
      [130, 31], [136, 35], [141, 41], [145, 45], [141, 43], [138, 37], [132, 34], [130, 31]
    ] },
    { name: 'British Isles', points: [
      [-7, 50], [-6, 54], [-5, 58], [-2, 59], [1, 53], [1, 51], [-1, 50.2], [-5, 50], [-7, 50]
    ] },
    { name: 'New Zealand', points: [
      [166, -46], [172, -44], [174, -38], [178, -38], [175, -41], [170, -45], [166, -46]
    ] }
  ];
  const CITY_SITES = [
    [2.35, 48.86], [-0.13, 51.5], [13.4, 52.5], [12.5, 41.9], [-3.7, 40.4], [4.9, 52.37], [-74, 40.7],
    [-87.6, 41.9], [-118.2, 34.05], [-122.4, 37.8], [-80.2, 25.8], [-99.1, 19.4], [-46.6, -23.5],
    [-58.4, -34.6], [-70.7, -33.4], [28, -26.2], [31.2, -29.9], [3.4, 6.5], [-0.2, 5.6], [36.8, -1.3],
    [31.2, 30], [55.3, 25.2], [72.9, 19.1], [77.2, 28.6], [88.4, 22.6], [100.5, 13.75], [106.8, -6.2],
    [121, 14.6], [116.4, 39.9], [121.5, 31.2], [114.2, 22.3], [126.9, 37.6], [139.7, 35.7], [135.5, 34.7],
    [151.2, -33.9], [144.9, -37.8], [174.8, -36.9], [18.4, -33.9], [45.3, 2.05], [7.5, 9],
    [37.6, 55.75], [30.3, 59.9], [24.9, 60.2], [10.75, 59.9], [12.6, 55.7], [19, 47.5], [21, 52.2],
    [35.2, 31.8], [51.4, 35.7], [46.7, 24.7], [103.8, 1.35], [101.7, 3.1], [96.2, 16.8], [67, 24.9]
  ];

  function pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function landAt(lon, lat) {
    for (let i = 0; i < CONTINENTS.length; i++) {
      if (pointInPolygon(lon, lat, CONTINENTS[i].points)) return true;
    }
    return false;
  }

  let earthCache = null;
  function buildEarthData(seed) {
    const rnd = mulberry32(seed === undefined ? 2024 : seed);
    const clouds = [];
    for (let i = 0; i < 26; i++) {
      clouds.push({
        lon: rnd() * 360 - 180,
        lat: rnd() * 150 - 75,
        size: 7 + rnd() * 20,
        alpha: 0.1 + rnd() * 0.2
      });
    }
    const cities = CITY_SITES
      .filter(([lon, lat]) => landAt(lon, lat) && Math.abs(lat) <= 72)
      .map(([lon, lat]) => ({
        lon, lat,
        size: 0.9 + rnd() * 1.3,
        phase: rnd() * TAU
      }));
    /* sprinkle extra lights on land only */
    let guard = 0;
    while (cities.length < 190 && guard++ < 4000) {
      const lon = rnd() * 360 - 180;
      const lat = Math.asin(rnd() * 1.6 - 0.8) * (180 / Math.PI);
      if (!landAt(lon, lat) || Math.abs(lat) > 72) continue;
      cities.push({ lon, lat, size: 0.5 + rnd() * 0.9, phase: rnd() * TAU });
    }
    return { clouds, cities };
  }

  function paintSpace(ctx, w, h, stars, time) {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#04060f');
    bg.addColorStop(0.55, '#070c1c');
    bg.addColorStop(1, '#03040a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const nebula = [
      [0.18, 0.22, 0.42, 'rgba(58,88,190,0.09)'],
      [0.82, 0.72, 0.46, 'rgba(140,60,170,0.07)'],
      [0.65, 0.15, 0.3, 'rgba(40,150,180,0.05)']
    ];
    for (let i = 0; i < nebula.length; i++) {
      const [nx, ny, nr, color] = nebula[i];
      const g = ctx.createRadialGradient(nx * w, ny * h, 0, nx * w, ny * h, nr * Math.max(w, h));
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    if (!stars) return;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.72 + 0.28 * Math.sin(time * s.speed + s.phase);
      ctx.globalAlpha = s.alpha * tw;
      ctx.fillStyle = s.tint;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawEarth(ctx, w, h, s) {
    const data = s.data || earthCache || (earthCache = buildEarthData());
    const time = s.time || 0;
    const spin = s.spin || 0;
    paintSpace(ctx, w, h, s.stars, time);

    const R = Math.min(w * 0.4, h * 0.42);
    const cx = w * 0.5;
    const cy = h * 0.52;

    /* atmosphere halo */
    const halo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.36);
    halo.addColorStop(0, 'rgba(96,170,255,0.34)');
    halo.addColorStop(0.55, 'rgba(70,130,240,0.12)');
    halo.addColorStop(1, 'rgba(40,80,200,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.36, 0, TAU);
    ctx.fill();

    /* ocean */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.clip();
    const ocean = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.08, cx, cy, R * 1.18);
    ocean.addColorStop(0, '#3b8fdd');
    ocean.addColorStop(0.42, '#1f5ea8');
    ocean.addColorStop(0.78, '#123d72');
    ocean.addColorStop(1, '#071d38');
    ctx.fillStyle = ocean;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    /* continents */
    ctx.lineJoin = 'round';
    for (let i = 0; i < CONTINENTS.length; i++) {
      const poly = CONTINENTS[i].points;
      ctx.beginPath();
      for (let j = 0; j < poly.length; j++) {
        const p = M.projectToScreen(poly[j][0], poly[j][1], spin, cx, cy, R);
        if (j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      g.addColorStop(0, '#63b075');
      g.addColorStop(0.45, '#3f8c58');
      g.addColorStop(1, '#255c3b');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(150,220,170,0.28)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    /* polar ice */
    const capA = M.projectToScreen(0, 78, spin, cx, cy, R);
    const capB = M.projectToScreen(0, -78, spin, cx, cy, R);
    ctx.fillStyle = 'rgba(232,246,255,0.88)';
    ctx.beginPath();
    ctx.ellipse(capA.x, capA.y, R * 0.36, R * 0.13, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(capB.x, capB.y, R * 0.42, R * 0.16, 0, 0, TAU);
    ctx.fill();

    /* cloud haze */
    for (let i = 0; i < data.clouds.length; i++) {
      const c = data.clouds[i];
      const p = M.projectSpherical(c.lon + spin * 1.09, c.lat, 0);
      if (p.z <= 0.02) continue;
      const px = cx + p.x * R;
      const py = cy + p.y * R;
      const rr = c.size * (R / 230) * (0.5 + p.z);
      const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
      g.addColorStop(0, 'rgba(255,255,255,' + c.alpha * p.z + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rr, 0, TAU);
      ctx.fill();
    }

    /* day / night terminator */
    const shade = ctx.createLinearGradient(cx - R, cy - R * 0.9, cx + R * 0.95, cy + R);
    shade.addColorStop(0, 'rgba(3,8,22,0)');
    shade.addColorStop(0.5, 'rgba(4,10,26,0.16)');
    shade.addColorStop(0.78, 'rgba(2,6,18,0.62)');
    shade.addColorStop(1, 'rgba(1,3,12,0.86)');
    ctx.fillStyle = shade;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    /* sun glint */
    const glint = ctx.createRadialGradient(cx - R * 0.44, cy - R * 0.46, 0, cx - R * 0.44, cy - R * 0.46, R * 0.85);
    glint.addColorStop(0, 'rgba(255,246,220,0.18)');
    glint.addColorStop(1, 'rgba(255,246,220,0)');
    ctx.fillStyle = glint;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    /* city lights glow through the night side */
    const L = { x: -0.55, y: -0.42, z: 0.72 };
    const lightStep = R < 170 ? 2 : 1;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < data.cities.length; i += lightStep) {
      const c = data.cities[i];
      const p = M.projectSpherical(c.lon, c.lat, spin);
      if (!p.visible) continue;
      const day = p.x * L.x + p.y * L.y + p.z * L.z;
      if (day > 0.08) continue;
      const tw = 0.72 + 0.28 * Math.sin(time * 1.6 + c.phase);
      ctx.globalAlpha = clamp(-day * 1.6, 0, 0.95) * tw;
      ctx.fillStyle = '#ffd58a';
      ctx.beginPath();
      ctx.arc(cx + p.x * R, cy + p.y * R, c.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    /* rim light */
    ctx.strokeStyle = 'rgba(130,200,255,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 0.6, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(180,225,255,0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 2.2, 0, TAU);
    ctx.stroke();

    /* the Moon */
    const ma = time * 0.24 + 0.8;
    const mx = cx + Math.cos(ma) * R * 1.45;
    const my = cy + Math.sin(ma) * R * 0.62;
    const mR = R * 0.095;
    const behind = Math.sin(ma) < 0;
    ctx.globalAlpha = behind ? 0.55 : 1;
    const mg = ctx.createRadialGradient(mx - mR * 0.35, my - mR * 0.4, mR * 0.1, mx, my, mR);
    mg.addColorStop(0, '#e9edf2');
    mg.addColorStop(0.6, '#a9b2c0');
    mg.addColorStop(1, '#5c6472');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(mx, my, mR, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    /* labels */
    ctx.font = '600 11px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(170,205,255,0.55)';
    ctx.fillText('EARTH', cx - R, cy + R + 24);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(170,205,255,0.38)';
    ctx.fillText('12,742 km across', cx + R, cy + R + 24);
    ctx.textAlign = 'left';
  }

  /* ---------------- solar system ---------------- */

  let systemCache = null;
  function buildSystemData(seed) {
    const rnd = mulberry32(seed === undefined ? 99 : seed);
    const asteroids = [];
    for (let i = 0; i < 170; i++) {
      asteroids.push({
        r: 118 + rnd() * 22,
        theta: rnd() * TAU,
        size: 0.35 + rnd() * 0.8,
        alpha: 0.25 + rnd() * 0.5
      });
    }
    return { asteroids };
  }

  function drawSystem(ctx, w, h, s) {
    const planets = s.planets || [];
    const asteroids = s.asteroids || (systemCache || (systemCache = buildSystemData())).asteroids;
    const time = s.time || 0;
    const speed = s.speed === undefined ? 1 : s.speed;
    paintSpace(ctx, w, h, s.stars, time);

    const k = clamp(Math.min(w / 620, h / 540), 0.42, 1.25);
    const cx = w * 0.5;
    const cy = h * 0.52;
    const squash = 0.72;
    const sunR = Math.max(11, 20 * k);
    const positions = [];

    /* orbits */
    ctx.lineWidth = 1;
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const r = p.orbit * k;
      const selected = s.selected === p.id;
      ctx.strokeStyle = selected ? rgba(p.color, 0.55) : 'rgba(150,190,255,0.16)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * squash, 0, 0, TAU);
      ctx.stroke();
    }

    /* asteroid belt */
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      const r = a.r * k;
      const angle = a.theta + time * speed * 0.05;
      ctx.globalAlpha = a.alpha;
      ctx.fillStyle = '#c8bda6';
      ctx.fillRect(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * squash, a.size, a.size);
    }
    ctx.globalAlpha = 1;

    /* the Sun */
    const corona = ctx.createRadialGradient(cx, cy, sunR * 0.4, cx, cy, sunR * 5.5);
    corona.addColorStop(0, 'rgba(255,214,120,0.32)');
    corona.addColorStop(0.2, 'rgba(255,166,62,0.12)');
    corona.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * 5.5, 0, TAU);
    ctx.fill();
    const sun = ctx.createRadialGradient(cx - sunR * 0.3, cy - sunR * 0.3, sunR * 0.1, cx, cy, sunR);
    sun.addColorStop(0, '#fffbe8');
    sun.addColorStop(0.55, '#ffd873');
    sun.addColorStop(1, '#ff9b2f');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, TAU);
    ctx.fill();

    /* planets */
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const orbit = p.orbit * k;
      const omega = 0.55 / Math.pow(p.period, 0.45);
      const angle = p.phase + time * speed * omega;
      const px = cx + Math.cos(angle) * orbit;
      const py = cy + Math.sin(angle) * orbit * squash;
      const size = Math.max(2.4, p.size * k);
      const selected = s.selected === p.id;
      const hovered = s.hover === p.id;

      positions.push({ id: p.id, x: px, y: py, size });

      if (p.id === 'saturn') {
        ctx.strokeStyle = 'rgba(226,208,160,0.55)';
        ctx.lineWidth = Math.max(1.6, size * 0.5);
        ctx.beginPath();
        ctx.ellipse(px, py, size * 2.05, size * 0.7, -0.42, 0, TAU);
        ctx.stroke();
      }

      if (selected || hovered) {
        ctx.strokeStyle = rgba(p.color, selected ? 0.85 : 0.4);
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(px, py, size + 6, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const body = ctx.createRadialGradient(px - size * 0.35, py - size * 0.4, size * 0.15, px, py, size);
      body.addColorStop(0, '#ffffff');
      body.addColorStop(0.28, p.color);
      body.addColorStop(1, p.dark);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, TAU);
      ctx.fill();

      if (p.id === 'saturn') {
        ctx.strokeStyle = 'rgba(240,226,186,0.85)';
        ctx.lineWidth = Math.max(1.2, size * 0.32);
        ctx.beginPath();
        ctx.ellipse(px, py, size * 1.95, size * 0.62, -0.42, 0, TAU);
        ctx.stroke();
      }

      ctx.font = (selected ? '600 ' : '500 ') + Math.max(9, 10 * k) + 'px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillStyle = selected ? '#ffffff' : 'rgba(200,214,244,' + (hovered ? 0.85 : 0.5) + ')';
      const labelY = py + size + 13 + (i < 4 ? (i % 2) * 9 : 0);
      ctx.fillText(p.name.toUpperCase(), px, labelY);
    }
    ctx.textAlign = 'left';

    /* scale note */
    ctx.font = '500 10px ' + FONT;
    ctx.fillStyle = 'rgba(160,185,235,0.45)';
    ctx.textAlign = 'right';
    ctx.fillText('orbits compressed · speeds exaggerated', w - 14, h - 12);
    ctx.textAlign = 'left';
    return positions;
  }

  /* ---------------- milky way ---------------- */

  const SQUASH = 0.58;
  let galaxyCache = null;
  function buildGalaxyData(seed) {
    return { stars: M.makeGalaxy(1500, seed === undefined ? 2025 : seed, 4) };
  }

  function drawGalaxy(ctx, w, h, s) {
    const galaxy = s.galaxy || (galaxyCache || (galaxyCache = buildGalaxyData()));
    const time = s.time || 0;
    const zoom = s.zoom === undefined ? 1 : s.zoom;
    const rotation = time * (s.spinRate === undefined ? 0.05 : s.spinRate);
    paintSpace(ctx, w, h, s.stars, time);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const R = Math.min(w, h) * 0.455 * zoom;

    /* outer halo (scaled circle so the gradient never shows a hard edge) */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, SQUASH);
    const halo = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R * 1.25);
    halo.addColorStop(0, 'rgba(120,150,255,0.16)');
    halo.addColorStop(0.55, 'rgba(80,90,200,0.07)');
    halo.addColorStop(1, 'rgba(40,30,90,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.25, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, SQUASH);
    ctx.rotate(rotation);
    ctx.globalCompositeOperation = 'lighter';

    /* arms as a soft glow underneath the stars */
    const armStep = R < 220 ? 2 : 1;
    for (let arm = 0; arm < 4; arm++) {
      const base = arm * (TAU / 4);
      for (let j = 0; j < 26; j += armStep) {
        const t = j / 25;
        const r = 0.18 + t * 0.8;
        const theta = base + r * 3.9 + 0.14;
        const x = Math.cos(theta) * r * R;
        const y = Math.sin(theta) * r * R;
        const rad = (0.055 + t * 0.055) * R;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        const tint = t < 0.4 ? 'rgba(120,150,255,' : 'rgba(120,110,220,';
        g.addColorStop(0, tint + (0.075 + t * 0.045) + ')');
        g.addColorStop(1, 'rgba(20,20,60,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, TAU);
        ctx.fill();
      }
    }

    /* stars */
    const stars = galaxy.stars || [];
    const starStep = R < 220 ? 2 : 1;
    for (let i = 0; i < stars.length; i += starStep) {
      const st = stars[i];
      const theta = st.theta + rotation;
      const x = Math.cos(theta) * st.r * R;
      const y = Math.sin(theta) * st.r * R;
      const tw = 0.75 + 0.25 * Math.sin(time * 1.3 + st.phase);
      ctx.globalAlpha = st.alpha * tw;
      ctx.fillStyle = st.color;
      if (st.size > 1.8) {
        ctx.beginPath();
        ctx.arc(x, y, st.size, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(x - st.size / 2, y - st.size / 2, st.size, st.size);
      }
    }
    ctx.globalAlpha = 1;

    /* central bulge and bar */
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.3);
    core.addColorStop(0, 'rgba(255,248,220,0.95)');
    core.addColorStop(0.18, 'rgba(255,226,160,0.6)');
    core.addColorStop(0.5, 'rgba(255,180,90,0.2)');
    core.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.3, 0, TAU);
    ctx.fill();

    const bar = ctx.createLinearGradient(-R * 0.36, 0, R * 0.36, 0);
    bar.addColorStop(0, 'rgba(255,220,170,0)');
    bar.addColorStop(0.5, 'rgba(255,232,190,0.42)');
    bar.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.fillStyle = bar;
    ctx.save();
    ctx.rotate(0.32);
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 0.36, R * 0.1, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    /* dust lanes: thin dark strokes laid along the inner edge of each arm */
    ctx.globalCompositeOperation = 'source-over';
    for (let arm = 0; arm < 4; arm++) {
      const base = arm * (TAU / 4);
      ctx.beginPath();
      for (let j = 0; j <= 30; j++) {
        const t = j / 30;
        const r = 0.24 + t * 0.7;
        const theta = base + r * 3.9 + 0.42;
        const x = Math.cos(theta) * r * R;
        const y = Math.sin(theta) * r * R;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(6,6,16,' + (0.2 + arm * 0.02) + ')';
      ctx.lineWidth = R * 0.008;
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    /* the Sun's place in the disk */
    const sunR = 0.56 * R;
    const sunTheta = 2 * (TAU / 4) + 0.56 * 3.9 + 0.14;
    const sx = cx + Math.cos(sunTheta + rotation) * sunR;
    const sy = cy + Math.sin(sunTheta + rotation) * sunR * SQUASH;
    const pulse = 0.6 + 0.4 * Math.sin(time * 2);

    if (s.labels !== false) {
      ctx.strokeStyle = 'rgba(255,214,120,' + (0.4 + pulse * 0.3) + ')';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sx, sy, 9 + pulse * 2, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.4, 0, TAU);
      ctx.fill();

      const dir = sx > w * 0.55 ? -1 : 1;
      const labelX = sx + dir * 50;
      ctx.strokeStyle = 'rgba(255,230,180,0.45)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sx + dir * 10, sy - 12);
      ctx.lineTo(sx + dir * 44, sy - 46);
      ctx.lineTo(sx + dir * 160, sy - 46);
      ctx.stroke();
      ctx.textAlign = dir > 0 ? 'left' : 'right';
      ctx.font = '600 11px ' + FONT;
      ctx.fillStyle = 'rgba(255,236,190,0.9)';
      ctx.fillText('YOU ARE HERE', labelX, sy - 52);
      ctx.font = '400 10px ' + FONT;
      ctx.fillStyle = 'rgba(220,228,255,0.55)';
      ctx.fillText('26,000 light-years from the core', labelX, sy - 38);

      ctx.textAlign = 'center';
      ctx.font = '500 10px ' + FONT;
      ctx.fillStyle = 'rgba(255,240,210,0.6)';
      ctx.fillText('SAGITTARIUS A*', cx, cy + R * 0.3 * SQUASH + 16);
      ctx.strokeStyle = 'rgba(255,240,210,0.3)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 3);
      ctx.lineTo(cx, cy + R * 0.3 * SQUASH + 8);
      ctx.stroke();
    }

    /* scale bar */
    ctx.strokeStyle = 'rgba(190,210,255,0.4)';
    ctx.lineWidth = 1;
    const barLen = Math.min(150, w * 0.3);
    const bx = 18;
    const by = h - 20;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + barLen, by);
    ctx.moveTo(bx, by - 4);
    ctx.lineTo(bx, by + 4);
    ctx.moveTo(bx + barLen, by - 4);
    ctx.lineTo(bx + barLen, by + 4);
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.font = '500 10px ' + FONT;
    ctx.fillStyle = 'rgba(190,210,255,0.55)';
    ctx.fillText('100,000 light-years across', bx, by - 10);

    ctx.textAlign = 'left';
    return { sun: { x: sx, y: sy }, center: { x: cx, y: cy } };
  }

  return {
    drawEarth, drawSystem, drawGalaxy,
    buildEarthData, buildSystemData, buildGalaxyData,
    landAt, CONTINENTS, FONT
  };
});


