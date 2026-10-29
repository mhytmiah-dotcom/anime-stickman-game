/* Headless test for cosmos/: a tiny DOM + canvas stub runs the real
   app.js end to end, then the model, data and scenes are checked.
   Usage: node test/cosmos.js
*/
const fs = require('fs');
const vm = require('vm');
const path = require('path');

/* ---------------- tiny DOM ---------------- */
class Element {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this._classes = new Set();
    this.dataset = {};
    this.attributes = {};
    this._listeners = {};
    this._text = '';
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.checked = false;
    this.width = 0;
    this.height = 0;
    this.style = { setProperty(k, v) { this[k] = v; } };
    this.classList = {
      add: (...n) => n.forEach(x => this._classes.add(x)),
      remove: (...n) => n.forEach(x => this._classes.delete(x)),
      contains: n => this._classes.has(n),
      toggle: (n, force) => {
        const on = force === undefined ? !this._classes.has(n) : !!force;
        if (on) this._classes.add(n); else this._classes.delete(n);
        return on;
      }
    };
  }

  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._classes].join(' '); }

  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() {
    if (this.children.length) return this.children.map(c => c.textContent).join(' ');
    return this._text;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
    if (k === 'id' && this.ownerDocument) this.ownerDocument._ids[String(v)] = this;
  }
  getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; }
  removeAttribute(k) { delete this.attributes[k]; }

  addEventListener(type, fn) {
    (this._listeners[type] || (this._listeners[type] = [])).push(fn);
  }
  dispatch(type, event) {
    (this._listeners[type] || []).forEach(fn => fn(Object.assign({
      target: this, preventDefault() {}, stopPropagation() {}
    }, event)));
  }

  getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; }
  focus() {}

  matches(sel) {
    if (sel.startsWith('.')) return this._classes.has(sel.slice(1));
    if (sel.startsWith('#')) return this.attributes.id === sel.slice(1);
    return this.tagName === sel.toUpperCase();
  }
  querySelector(sel) {
    const parts = sel.trim().split(/\s+/);
    const walk = (node, i) => {
      for (const child of node.children) {
        if (child.matches(parts[i])) {
          if (i === parts.length - 1) return child;
          const found = walk(child, i + 1);
          if (found) return found;
        }
        const deep = walk(child, i);
        if (deep) return deep;
      }
      return null;
    };
    return walk(this, 0);
  }
}

function makeCtx() {
  const grad = { addColorStop() {} };
  const target = {
    canvas: { width: 800, height: 600 },
    measureText: () => ({ width: 42 }),
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createPattern: () => null,
    calls: 0
  };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === 'symbol') return undefined;
      return (...args) => { t.calls++; if (k === 'createLinearGradient' || k === 'createRadialGradient') return grad; };
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}

const rafQueue = [];
const historyCalls = [];
const listeners = {};

function makeDocument() {
  const doc = {
    readyState: 'complete',
    hidden: false,
    _ids: {},
    getElementById(id) { return doc._ids[id] || null; },
    createElement(tag) {
      const el = new Element(tag);
      el.ownerDocument = doc;
      if (tag === 'canvas') {
        el.getContext = () => makeCtx();
        el.width = 800;
        el.height = 600;
      }
      return el;
    },
    addEventListener() {}
  };
  for (const [tag, id] of [['main', 'chapters'], ['nav', 'chapter-nav'], ['ul', 'sources'], ['footer', 'site-foot']]) {
    const el = new Element(tag);
    el.ownerDocument = doc;
    doc._ids[id] = el;
  }
  return doc;
}

const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, Map, Set, Error,
  Float32Array, Uint8ClampedArray, isFinite, parseInt, parseFloat, Promise,
  document: makeDocument(),
  devicePixelRatio: 2,
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  requestAnimationFrame(cb) { rafQueue.push(cb); return rafQueue.length; },
  history: { replaceState(a, b, url) { historyCalls.push(url); } },
  location: { hash: '' },
  scrollTo() {},
  addEventListener(type, fn) { (listeners[type] || (listeners[type] = [])).push(fn); }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;

const context = vm.createContext(sandbox);
const load = name => vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'cosmos', name), 'utf8'),
  context, { filename: name }
);
load('model.js');
load('data.js');
load('scenes.js');
load('app.js');

const app = sandbox.CosmosApp;
const data = sandbox.CosmosData;
const model = sandbox.CosmosModel;
const scenes = sandbox.CosmosScenes;

let failures = 0;
function check(label, fn) {
  try {
    const value = fn();
    console.log('PASS', label, value === undefined ? '' : JSON.stringify(value));
  } catch (e) {
    failures++;
    process.exitCode = 1;
    console.log('FAIL', label, e && e.message);
    console.log((e.stack || '').split('\n').slice(0, 4).join('\n'));
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

function frames(count, start) {
  let now = start === undefined ? 16 : start;
  for (let i = 0; i < count; i++) {
    now += 16;
    const queue = rafQueue.splice(0, rafQueue.length);
    queue.forEach(cb => cb(now));
  }
  return now;
}

/* ---------------- data ---------------- */
check('data: four chapters with unique ids and complete copy', () => {
  assert(data.chapters.length === 4, 'expected 4 chapters');
  const ids = new Set(data.chapters.map(c => c.id));
  assert(ids.size === 4, 'chapter ids must be unique');
  data.chapters.forEach(c => {
    ['num', 'kicker', 'title', 'lede'].forEach(k => assert(typeof c[k] === 'string' && c[k].length >= 2, c.id + ' missing ' + k));
    assert(Array.isArray(c.narration) && c.narration.length >= 3, c.id + ' narration too short');
    assert(c.narration.every(t => typeof t === 'string' && t.length > 80), c.id + ' narration paragraph too short');
    assert(Array.isArray(c.stats) && c.stats.length === 4, c.id + ' needs 4 stats');
    assert(c.stats.every(s => s.value && s.label), c.id + ' stat missing value/label');
    assert(typeof c.fact === 'string' && c.fact.length > 30, c.id + ' missing fact');
  });
  assert(data.chapters.filter(c => c.scene).length === 3, 'three chapters should have scenes');
  return data.chapters.map(c => c.id).join(',');
});

check('data: eight planets ordered outward with valid numbers', () => {
  assert(data.planets.length === 8, 'expected 8 planets');
  const seen = new Set();
  let lastOrbit = 0;
  data.planets.forEach(p => {
    assert(!seen.has(p.id), 'duplicate planet ' + p.id);
    seen.add(p.id);
    assert(p.orbit > lastOrbit, p.name + ' orbit out of order');
    lastOrbit = p.orbit;
    assert(p.period > 0 && p.size > 0, p.name + ' bad period/size');
    assert(/^#[0-9a-f]{6}$/i.test(p.color) && /^#[0-9a-f]{6}$/i.test(p.dark), p.name + ' bad colour');
    assert(p.stats.length === 3 && p.blurb.length > 40, p.name + ' incomplete card');
  });
  return data.planets.map(p => p.name).join(',');
});

check('data: cards, address and quiz invariants', () => {
  assert(data.galaxyTypes.length >= 5 && data.deepSpace.length >= 5, 'card collections too small');
  const icons = new Set(data.galaxyTypes.map(g => g.icon));
  assert(icons.size === data.galaxyTypes.length, 'galaxy icons should be unique');
  assert(data.cosmicAddress.length >= 6, 'cosmic address too short');
  assert(data.quiz.length === 10, 'expected 10 quiz questions');
  data.quiz.forEach((q, i) => {
    assert(q.q && q.why, 'question ' + i + ' missing text');
    assert(q.options.length === 4, 'question ' + i + ' needs 4 options');
    assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, 'question ' + i + ' has bad answer index');
    assert(new Set(q.options).size === 4, 'question ' + i + ' has duplicate options');
  });
  data.links.forEach(l => assert(/^https:\/\//.test(l.url), 'source link must be https'));
  return data.quiz.length + ' questions, ' + data.galaxyTypes.length + ' galaxy types';
});

/* ---------------- model ---------------- */
check('model: spherical projection is unit length and spins', () => {
  const center = model.projectSpherical(0, 0, 0);
  assert(Math.abs(center.z - 1) < 1e-9 && center.visible, 'centre should face the viewer');
  const back = model.projectSpherical(0, 0, 180);
  assert(back.z < 0 && !back.visible, 'back of the globe should be hidden');
  for (const [lon, lat, spin] of [[0, 0, 0], [45, 30, 90], [-120, -60, 200], [179, 89, 359]]) {
    const p = model.projectSpherical(lon, lat, spin);
    const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    assert(Math.abs(len - 1) < 1e-9, 'not unit length');
    assert(p.x === p.x && p.y === p.y && p.z === p.z, 'NaN projection');
  }
  const limb = model.projectToScreen(0, 0, 180, 100, 100, 50);
  assert(Math.hypot(limb.x - 100, limb.y - 100) <= 50.001, 'hidden point should clamp to the limb');
  return 'unit sphere';
});

check('model: galaxy and starfield generators are seeded and bounded', () => {
  const a = model.makeGalaxy(300, 42, 4);
  const b = model.makeGalaxy(300, 42, 4);
  const c = model.makeGalaxy(300, 43, 4);
  assert(a.length === 300 && b.length === 300, 'wrong star count');
  assert(a[0].theta === b[0].theta && a[0].r === b[0].r, 'seed should be deterministic');
  assert(a[0].theta !== c[0].theta, 'different seeds should differ');
  assert(a.every(s => s.r >= 0 && s.r <= 1 && isFinite(s.theta) && s.size > 0), 'star out of bounds');
  const arms = new Set(a.filter(s => s.kind === 'arm').map(s => s.arm));
  assert(arms.size === 4, 'all four arms should have stars');
  const field = model.makeStarfield(120, 3);
  assert(field.length === 120 && field.every(s => s.x >= 0 && s.x <= 1 && s.y >= 0 && s.y <= 1), 'starfield out of bounds');
  return a.length + ' galaxy stars / ' + field.length + ' backdrop stars';
});

check('model: scoring, ranks and formatting', () => {
  const q = data.quiz[0];
  assert(model.scoreAnswer(q, q.answer) === true, 'correct answer not scored');
  assert(model.scoreAnswer(q, (q.answer + 1) % 4) === false, 'wrong answer scored');
  assert(model.scoreAnswer(q, -1) === false && model.scoreAnswer(null, 0) === false, 'invalid input should be false');
  const perfect = model.quizSummary(data.quiz, data.quiz.map(x => x.answer));
  assert(perfect.correct === 10 && perfect.pct === 100 && perfect.rank === 'Cosmic cartographer', 'perfect score wrong');
  const zero = model.quizSummary(data.quiz, data.quiz.map(x => (x.answer + 1) % 4));
  assert(zero.correct === 0 && zero.pct === 0 && zero.rank === 'Fresh from the atmosphere', 'zero score wrong');
  const key = [2, 1, 1, 2, 1, 2, 2, 1, 1, 1];
  assert(model.quizSummary(data.quiz, key).correct === 10, 'known answer key should be perfect');
  assert(model.formatNumber(1234567) === '1,234,567', 'formatNumber failed');
  return perfect.rank;
});


/* ---------------- scenes ---------------- */
check('scenes: Earth data puts every city on land', () => {
  const earth = scenes.buildEarthData(7);
  assert(earth.cities.length === 190, 'expected 190 city lights, got ' + earth.cities.length);
  earth.cities.forEach(c => {
    assert(Math.abs(c.lat) <= 72.01, 'city beyond polar limit');
    assert(scenes.landAt(c.lon, c.lat), 'city at ' + c.lon.toFixed(1) + ',' + c.lat.toFixed(1) + ' is in the ocean');
    assert(c.size > 0 && isFinite(c.phase), 'city light has bad size/phase');
  });
  assert(scenes.landAt(2.35, 48.86), 'Paris should be land');
  assert(!scenes.landAt(-140, 0), 'mid-Pacific should be ocean');
  assert(scenes.CONTINENTS.length >= 10, 'not enough continents');
  return earth.cities.length + ' city lights';
});

check('scenes: every scene draws at three canvas sizes', () => {
  const sizes = [[320, 240], [800, 600], [1280, 800]];
  const backdrop = model.makeStarfield(80, 5);
  const galaxy = scenes.buildGalaxyData(3);
  let calls = 0;
  sizes.forEach(([w, h]) => {
    const ctx = makeCtx();
    scenes.drawEarth(ctx, w, h, { time: 2, spin: 130, stars: backdrop });
    const positions = scenes.drawSystem(ctx, w, h, {
      time: 4, speed: 1, planets: data.planets, stars: backdrop, selected: 'earth', hover: 'mars'
    });
    assert(positions.length === 8, 'system should return 8 positions');
    positions.forEach(p => {
      assert(isFinite(p.x) && isFinite(p.y) && p.size > 0, 'bad planet position');
      assert(p.x > -10 && p.x < w + 10 && p.y > -10 && p.y < h + 10, 'planet off canvas at ' + w + 'x' + h);
    });
    const info = scenes.drawGalaxy(ctx, w, h, { time: 3, zoom: 1.2, labels: true, stars: backdrop, galaxy });
    assert(isFinite(info.sun.x) && isFinite(info.sun.y), 'galaxy sun position not finite');
    assert(info.center.x === w / 2 && info.center.y === h / 2, 'galaxy should be centred');
    calls += ctx.calls;
  });
  assert(calls > 400, 'expected plenty of canvas calls, got ' + calls);
  return calls + ' draw calls';
});

check('scenes: deterministic builds and odd clocks stay finite', () => {
  const a = scenes.buildSystemData(4).asteroids;
  const b = scenes.buildSystemData(4).asteroids;
  assert(a.length === 170 && a[0].r === b[0].r && a[0].theta === b[0].theta, 'asteroid belt should be seeded');
  const ctx = makeCtx();
  const stars = model.makeStarfield(40, 1);
  const galaxy = scenes.buildGalaxyData(9);
  [-4, 0, 0.5, 12, 1e6].forEach(time => {
    scenes.drawEarth(ctx, 400, 300, { time, spin: time * 30, stars });
    scenes.drawSystem(ctx, 400, 300, { time, speed: 3, planets: data.planets, stars });
    scenes.drawGalaxy(ctx, 400, 300, { time, zoom: 0.65, labels: false, stars, galaxy });
  });
  return 'five odd clocks';
});


/* ---------------- app ---------------- */
check('app: navigation, panels and four scenes are built', () => {
  const nav = sandbox.document.getElementById('chapter-nav');
  assert(nav.children.length === 6, 'expected 6 nav links, got ' + nav.children.length);
  assert(app.state.nav.length === 6, 'nav state not tracked');
  const keys = Object.keys(app.state.panels).sort().join(',');
  assert(keys === 'beyond,earth,galaxy,overview,quiz,system', 'panels wrong: ' + keys);
  assert(app.state.scenes.length === 4, 'expected 4 scenes, got ' + app.state.scenes.length);
  const kinds = app.state.scenes.map(s => s.kind).sort().join(',');
  assert(kinds === 'earth,galaxy,galaxy,system', 'scene kinds wrong: ' + kinds);
  const sources = sandbox.document.getElementById('sources');
  assert(sources.children.length === data.links.length, 'sources not rendered');
  assert(nav.children[0].getAttribute('aria-current') === 'page', 'overview should be the initial page');
  assert(app.state.active === 'overview', 'should start on overview');
  return keys;
});

check('app: overview renders and the hero galaxy animates', () => {
  frames(4, 16);
  const hero = app.state.scenes.find(s => s.host === 'overview');
  assert(hero && hero.kind === 'galaxy', 'hero scene missing');
  assert(hero.visible === true, 'hero should be visible on overview');
  assert(hero.clock > 0, 'hero clock did not advance');
  assert(hero.ctx.calls > 50, 'hero did not draw (' + hero.ctx.calls + ' calls)');
  const overview = app.state.panels.overview;
  assert(overview.hidden === false, 'overview should be visible');
  assert(overview.querySelector('.hero-title').textContent.length > 10, 'hero title missing');
  const teasers = overview.querySelector('.teaser-grid');
  assert(teasers && teasers.children.length === 4, 'teaser cards missing');
  return hero.clock.toFixed(2) + 's of rotation';
});

check('app: navigating to Earth lights the globe and drag spins it', () => {
  app.goTo('earth');
  assert(app.state.active === 'earth', 'active chapter not set');
  assert(app.state.panels.earth.hidden === false && app.state.panels.overview.hidden === true, 'panel visibility wrong');
  assert(historyCalls[historyCalls.length - 1] === '#earth', 'hash not updated: ' + historyCalls.join(','));
  frames(3, 100);
  const earth = app.state.scenes.find(s => s.kind === 'earth');
  assert(earth.visible === true && earth.clock > 0, 'earth scene should run');
  assert(earth.ctx.calls > 30, 'earth did not draw');
  const spinBefore = earth.spin;
  earth.canvas.dispatch('pointerdown', { clientX: 100, pointerId: 1 });
  earth.canvas.dispatch('pointermove', { clientX: 160, pointerId: 1 });
  earth.canvas.dispatch('pointerup', { clientX: 160, pointerId: 1 });
  assert(Math.abs(earth.spin - spinBefore) > 10, 'drag did not spin the globe');
  const narrate = app.state.panels.earth.querySelector('.narrate');
  assert(narrate.hidden === true, 'narration button should hide without speechSynthesis');
  return 'spin ' + earth.spin.toFixed(1) + '°';
});

check('app: clicking a planet updates its card and arrow keys cycle', () => {
  app.goTo('system');
  frames(3, 200);
  const system = app.state.scenes.find(s => s.kind === 'system');
  assert(system.visible && system.positions.length === 8, 'system did not draw eight planets');
  const jupiter = system.positions.find(p => p.id === 'jupiter');
  system.canvas.dispatch('click', { clientX: jupiter.x, clientY: jupiter.y });
  assert(system.selected === 'jupiter', 'click did not select Jupiter');
  assert(system.planetCard.children[0].children[1].textContent === 'Jupiter', 'planet card name not updated');
  system.canvas.dispatch('keydown', { key: 'ArrowRight' });
  assert(system.selected === 'saturn', 'arrow key did not move to Saturn');
  system.canvas.dispatch('keydown', { key: 'ArrowLeft' });
  assert(system.selected === 'jupiter', 'arrow key did not move back');
  return system.selected;
});

check('app: galaxy zoom, labels and pause controls work', () => {
  app.goTo('galaxy');
  frames(3, 300);
  const galaxy = app.state.scenes.find(s => s.host === 'galaxy');
  assert(galaxy.visible, 'chapter galaxy should be visible');
  assert(galaxy.galaxyInfo && isFinite(galaxy.galaxyInfo.sun.x), 'galaxy sun marker missing');
  galaxy.zoom = 1.45;
  galaxy.labels = false;
  frames(2, 400);
  assert(galaxy.ctx.calls > 100, 'galaxy did not draw');
  galaxy.paused = true;
  const clock = galaxy.clock;
  frames(2, 500);
  assert(galaxy.clock === clock, 'paused galaxy clock should not advance');
  galaxy.paused = false;
  return 'zoom 1.45, labels off';
});


check('app: quiz completes with a perfect score and review list', () => {
  app.goTo('quiz');
  app.resetQuiz();
  data.quiz.forEach((item, i) => {
    app.pickAnswer(item.answer);
    assert(app.state.quiz.picked === item.answer, 'pick did not stick at question ' + i);
    app.nextQuestion();
  });
  const q = app.state.quiz;
  assert(q.done === true, 'quiz should be done');
  assert(q.answers.length === data.quiz.length, 'answers not recorded');
  const text = app.state.quizCard.textContent;
  assert(text.indexOf('100%') !== -1, 'score should be 100%');
  assert(text.indexOf('Cosmic cartographer') !== -1, 'rank missing');
  const review = app.state.quizCard.querySelector('.quiz-review');
  assert(review && review.children.length === 10, 'review list should have 10 rows');
  return '10/10 · Cosmic cartographer';
});

check('app: quiz keyboard, feedback and a lower score', () => {
  app.resetQuiz();
  const fire = key => (listeners.keydown || []).forEach(fn => fn({
    key, target: { tagName: 'BODY' }, preventDefault() {}
  }));
  fire('1');
  assert(app.state.quiz.picked === 0, 'number key did not pick the first option');
  assert(app.state.quizCard.textContent.indexOf('Not quite.') !== -1, 'wrong-answer feedback missing');
  fire('Enter');
  assert(app.state.quiz.index === 1, 'Enter did not advance the quiz');
  app.pickAnswer((data.quiz[1].answer + 1) % 4);
  (listeners.keydown || []).forEach(fn => fn({
    key: 'Enter', target: { tagName: 'BUTTON' }, preventDefault() {}
  }));
  assert(app.state.quiz.index === 1, 'Enter on a focused button must not advance twice');
  while (!app.state.quiz.done) {
    const item = data.quiz[app.state.quiz.index];
    app.pickAnswer((item.answer + 1) % 4);
    app.nextQuestion();
  }
  const result = model.quizSummary(data.quiz, app.state.quiz.answers);
  assert(result.correct < 10, 'deliberately wrong answers should not score 10');
  assert(app.state.quizCard.textContent.indexOf('Try again') !== -1, 'restart button missing');
  app.resetQuiz();
  assert(app.state.quiz.index === 0 && app.state.quiz.done === false, 'reset failed');
  return result.correct + '/10 after wrong answers';
});

check('app: beyond chapter renders cards and unknown routes fall back', () => {
  app.goTo('beyond');
  assert(app.state.active === 'beyond', 'beyond should be active');
  const extras = app.state.panels.beyond.querySelector('.extras');
  assert(extras && extras.children.length === 3, 'expected galaxy types, objects and address blocks');
  const types = extras.children[0].children[2];
  assert(types.children.length === data.galaxyTypes.length, 'galaxy type cards missing');
  const address = extras.children[2].children[2];
  assert(address.children.length === data.cosmicAddress.length, 'cosmic address rows missing');
  const heading = app.state.panels.beyond.children[0].children[1].textContent;
  assert(heading.length > 5, 'chapter heading missing');

  app.goTo('not-a-chapter');
  assert(app.state.active === 'overview', 'unknown route should fall back to overview');
  assert(historyCalls[historyCalls.length - 1] === '#overview', 'fallback hash not written');
  return heading;
});

check('app: accessibility wiring on generated markup', () => {
  const main = sandbox.document.getElementById('chapters');
  const buttons = [];
  const canvases = [];
  const ids = new Set();
  const labels = [];
  const walk = node => {
    if (node.attributes) {
      if (node.attributes.id) ids.add(node.attributes.id);
      if (node.attributes['aria-labelledby']) labels.push(node.attributes['aria-labelledby']);
    }
    if (node.tagName === 'BUTTON') buttons.push(node);
    if (node.tagName === 'CANVAS') canvases.push(node);
    (node.children || []).forEach(walk);
  };
  walk(main);
  walk(sandbox.document.getElementById('chapter-nav'));

  assert(buttons.length > 20, 'expected many buttons, got ' + buttons.length);
  buttons.forEach(b => assert(b.getAttribute('type') === 'button', 'button without type=button'));
  assert(canvases.length === 4, 'expected four canvases');
  canvases.forEach(c => assert((c.getAttribute('aria-label') || '').length > 15, 'canvas missing aria-label'));
  labels.forEach(id => assert(ids.has(id), 'aria-labelledby points at missing id ' + id));

  app.goTo('system');
  const current = app.state.nav.filter(b => b.getAttribute('aria-current') === 'page');
  assert(current.length === 1 && current[0].dataset.target === 'system', 'exactly one nav item should be current');
  app.goTo('quiz');
  assert(app.state.panels.quiz.querySelector('.quiz-question'), 'quiz question missing');
  assert(app.state.panels.quiz.querySelector('.quiz-options').children.length === 4, 'quiz needs four options');
  app.goTo('overview');
  return buttons.length + ' buttons, ' + canvases.length + ' labelled canvases';
});

check('static: html, css and scripts are wired and balanced', () => {
  const dir = path.join(__dirname, '..', 'cosmos');
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  ['style.css', 'model.js', 'data.js', 'scenes.js', 'app.js'].forEach(file => {
    assert(html.indexOf(file) !== -1, 'index.html does not reference ' + file);
    assert(fs.existsSync(path.join(dir, file)), 'missing file ' + file);
  });
  assert(/<html lang="en">/.test(html), 'html lang missing');
  assert(/<noscript>/.test(html), 'noscript fallback missing');
  assert(/name="viewport"/.test(html), 'viewport meta missing');
  const css = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
  let depth = 0;
  for (const ch of css) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    assert(depth >= 0, 'css closes a block before opening one');
  }
  assert(depth === 0, 'css braces unbalanced: ' + depth);
  assert(/prefers-reduced-motion/.test(css), 'reduced-motion support missing');
  assert(/@media \(max-width: 760px\)/.test(css), 'mobile breakpoint missing');
  return 'html + ' + css.length + ' chars of css';
});

console.log(failures === 0 ? '\nALL COSMOS TESTS PASSED' : '\n' + failures + ' FAILURE(S)');

