/* ============================================================
   app.js — builds the interface, runs the three canvas scenes,
   reads chapters aloud and plays the quiz.
   ============================================================ */
(function (root) {
  'use strict';

  const D = root.CosmosData;
  const M = root.CosmosModel;
  const S = root.CosmosScenes;
  if (!D || !M || !S) throw new Error('Cosmos app needs data.js, model.js and scenes.js');

  const chapters = D.chapters;
  const reduceMotion = typeof root.matchMedia === 'function' &&
    root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {
    active: 'overview',
    scenes: [],
    nav: [],
    panels: {},
    quiz: { index: 0, answers: [], picked: null, done: false },
    speakingChapter: null
  };

  /* ---------------- tiny DOM helpers ---------------- */
  function h(tag, opts, children) {
    const node = document.createElement(tag);
    opts = opts || {};
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    if (opts.attrs) {
      for (const k in opts.attrs) node.setAttribute(k, opts.attrs[k]);
    }
    if (opts.dataset) {
      for (const k in opts.dataset) node.dataset[k] = opts.dataset[k];
    }
    if (opts.on) {
      for (const k in opts.on) node.addEventListener(k, opts.on[k]);
    }
    (children || []).forEach(child => { if (child) node.appendChild(child); });
    return node;
  }

  function p(text, className) { return h('p', { className: className || null, text }); }
  function span(text, className) { return h('span', { className: className || null, text }); }

  function statList(stats, className) {
    const dl = h('dl', { className: className || 'stats' });
    stats.forEach(s => {
      dl.appendChild(h('div', { className: 'stat' }, [
        h('dt', { text: s.value }),
        h('dd', { text: s.label })
      ]));
    });
    return dl;
  }

  /* ---------------- overview ---------------- */
  function buildOverview() {
    const section = h('section', {
      className: 'chapter overview',
      dataset: { chapterPanel: 'overview' },
      attrs: { 'aria-labelledby': 'overview-title' }
    });

    const hero = h('div', { className: 'hero' });
    const copy = h('div', { className: 'hero-copy' }, [
      h('p', { className: 'eyebrow', text: 'An interactive field guide' }),
      h('h1', { className: 'hero-title', text: 'The world, and the galaxy it spins in.', attrs: { id: 'overview-title' } }),
      p('Four short chapters about the planet under your feet and the 100,000-light-year city of stars around it. Spin the globe, fly the orbits, then test yourself.', 'hero-lede'),
      h('div', { className: 'hero-actions' }, [
        h('button', {
          className: 'btn primary', text: 'Start the tour',
          attrs: { type: 'button' }, on: { click: () => goTo('earth') }
        }),
        h('button', {
          className: 'btn ghost', text: 'Jump to the quiz',
          attrs: { type: 'button' }, on: { click: () => goTo('quiz') }
        })
      ]),
      h('dl', { className: 'hero-meta' }, [
        h('div', {}, [h('dt', { text: '4' }), h('dd', { text: 'chapters' })]),
        h('div', {}, [h('dt', { text: '3' }), h('dd', { text: 'animated scenes' })]),
        h('div', {}, [h('dt', { text: '10' }), h('dd', { text: 'quiz questions' })])
      ])
    ]);

    const visual = h('div', { className: 'hero-visual' }, [
      h('div', { className: 'hero-canvas-wrap' }, [
        h('canvas', {
          className: 'scene-canvas hero-canvas',
          attrs: {
            'aria-label': 'An artist\u2019s impression of the Milky Way, a barred spiral galaxy seen from above',
            role: 'img'
          }
        }),
        h('span', { className: 'hero-badge', text: 'MILKY WAY · ARTIST\u2019S IMPRESSION' })
      ]),
      p('You are here: 26,000 light-years from the centre, on one arm of a barred spiral.', 'hero-caption')
    ]);
    hero.appendChild(copy);
    hero.appendChild(visual);
    section.appendChild(hero);

    const teasers = h('div', { className: 'teaser-grid' });
    chapters.forEach(ch => {
      teasers.appendChild(h('button', {
        className: 'teaser',
        attrs: { type: 'button' },
        dataset: { go: ch.id },
        on: { click: () => goTo(ch.id) }
      }, [
        h('span', { className: 'teaser-num', text: ch.num }),
        h('span', { className: 'teaser-title', text: ch.title }),
        h('span', { className: 'teaser-kicker', text: ch.kicker })
      ]));
    });
    section.appendChild(teasers);

    section.appendChild(h('div', { className: 'fact-strip' }, [
      h('span', { className: 'fact-strip-label', text: 'One more thing' }),
      p('Light from the Sun takes 8 minutes 20 seconds to reach you. The light you see from Andromeda left 2.5 million years ago — before humans existed.', 'fact-strip-text')
    ]));

    state.panels.overview = section;
    return section;
  }

  /* ---------------- chapter sections ---------------- */
  function buildReadColumn(ch) {
    const read = h('div', { className: 'read' });

    const speakButton = h('button', {
      className: 'btn narrate',
      attrs: { type: 'button', 'aria-pressed': 'false' },
      text: 'Listen to this chapter',
      on: { click: () => toggleSpeech(ch, speakButton) }
    });
    if (!('speechSynthesis' in root)) speakButton.hidden = true;
    read.appendChild(speakButton);

    const narration = h('div', { className: 'narration' });
    ch.narration.forEach(paragraph => narration.appendChild(p(paragraph)));
    read.appendChild(narration);

    read.appendChild(statList(ch.stats));

    read.appendChild(h('aside', { className: 'fact' }, [
      h('span', { className: 'fact-label', text: 'Did you know' }),
      p(ch.fact)
    ]));

    return read;
  }

  function buildStageControls(ch, entry) {
    const tools = h('div', { className: 'stage-tools' });
    function chip(label, input) {
      return h('label', { className: 'chip' }, [span(label, 'chip-label'), input]);
    }

    if (ch.scene === 'earth') {
      const pause = h('button', {
        className: 'chip chip-button', text: 'Pause spin', attrs: { type: 'button', 'aria-pressed': 'false' },
        on: {
          click: () => {
            entry.paused = !entry.paused;
            pause.textContent = entry.paused ? 'Resume spin' : 'Pause spin';
            pause.setAttribute('aria-pressed', String(entry.paused));
          }
        }
      });
      tools.appendChild(pause);
      tools.appendChild(span('Drag the globe', 'hint'));
      if (entry.paused) {
        pause.textContent = 'Resume spin';
        pause.setAttribute('aria-pressed', 'true');
      }
    } else if (ch.scene === 'system') {
      const speed = h('input', {
        attrs: { type: 'range', min: '0', max: '3', step: '0.05', 'aria-label': 'Orbit speed' }
      });
      speed.value = String(reduceMotion ? 0 : 1);
      speed.addEventListener('input', () => { entry.speed = parseFloat(speed.value); });
      entry.speed = parseFloat(speed.value);
      tools.appendChild(chip('Speed', speed));
      tools.appendChild(span('Click a planet', 'hint'));
    } else if (ch.scene === 'galaxy') {
      const zoom = h('input', {
        attrs: { type: 'range', min: '0.65', max: '1.5', step: '0.01', 'aria-label': 'Zoom the galaxy' }
      });
      zoom.value = '1';
      zoom.addEventListener('input', () => { entry.zoom = parseFloat(zoom.value); });
      entry.zoom = 1;
      const labels = h('input', { attrs: { type: 'checkbox' } });
      labels.checked = true;
      labels.addEventListener('change', () => { entry.labels = labels.checked; });
      entry.labels = true;
      const pause = h('button', {
        className: 'chip chip-button', text: 'Pause spin', attrs: { type: 'button', 'aria-pressed': 'false' },
        on: {
          click: () => {
            entry.paused = !entry.paused;
            pause.textContent = entry.paused ? 'Resume spin' : 'Pause spin';
            pause.setAttribute('aria-pressed', String(entry.paused));
          }
        }
      });
      tools.appendChild(chip('Zoom', zoom));
      tools.appendChild(h('label', { className: 'chip' }, [span('Labels', 'chip-label'), labels]));
      tools.appendChild(pause);
      if (entry.paused) {
        pause.textContent = 'Resume spin';
        pause.setAttribute('aria-pressed', 'true');
      }
    }
    return tools;
  }


  function buildPlanetCard() {
    const card = h('div', { className: 'planet-card', attrs: { 'aria-live': 'polite' } });
    const dot = h('span', { className: 'planet-dot' });
    const name = h('h3', { className: 'planet-name' });
    const type = h('span', { className: 'planet-type' });
    const head = h('div', { className: 'planet-card-head' }, [dot, name, type]);
    const blurb = p('', 'planet-blurb');
    const stats = h('dl', { className: 'planet-stats' });
    card.appendChild(head);
    card.appendChild(blurb);
    card.appendChild(stats);

    card.setData = planet => {
      dot.style.background = planet.color;
      name.textContent = planet.name;
      type.textContent = planet.type;
      blurb.textContent = planet.blurb;
      stats.textContent = '';
      planet.stats.forEach(s => {
        stats.appendChild(h('div', { className: 'planet-stat' }, [
          h('dt', { text: s.value }),
          h('dd', { text: s.label })
        ]));
      });
    };
    card.setData(D.planets[2]);
    return card;
  }

  function buildChapterSection(ch) {
    const section = h('section', {
      className: 'chapter',
      dataset: { chapterPanel: ch.id },
      attrs: { 'aria-labelledby': 'title-' + ch.id }
    });
    section.hidden = true;

    const head = h('header', { className: 'chapter-head' }, [
      h('p', { className: 'kicker', text: 'Chapter ' + ch.num + ' · ' + ch.kicker }),
      h('h2', { className: 'chapter-title', text: ch.title, attrs: { id: 'title-' + ch.id } }),
      p(ch.lede, 'lede')
    ]);
    section.appendChild(head);

    const grid = h('div', { className: ch.scene ? 'chapter-grid' : 'chapter-grid wide' });

    if (ch.scene) {
      const canvas = h('canvas', {
        className: 'scene-canvas',
        attrs: {
          role: ch.id === 'system' ? 'group' : 'img',
          'aria-label': ch.id === 'earth'
            ? 'A rotating stylised globe of Earth with day and night sides, city lights and the Moon'
            : ch.id === 'system'
              ? 'The Sun and eight planets orbiting on compressed orbits'
              : 'A slowly rotating barred spiral galaxy with the Sun\u2019s position marked'
        }
      });
      const entry = {
        canvas, ctx: canvas.getContext('2d'), kind: ch.scene, host: ch.id,
        clock: 0, paused: reduceMotion && ch.scene !== 'system', visible: false,
        w: 0, h: 0, dpr: 1, speed: 1, zoom: 1, labels: true, selected: 'earth', hover: null,
        spin: 40, dragX: null, positions: [],
        stars: M.makeStarfield(ch.scene === 'earth' ? 190 : 220, ch.scene === 'earth' ? 11 : 23)
      };
      if (ch.scene === 'earth') entry.data = S.buildEarthData();
      if (ch.scene === 'system') entry.asteroids = S.buildSystemData().asteroids;
      if (ch.scene === 'galaxy') entry.galaxy = S.buildGalaxyData();

      const frame = h('div', { className: 'stage-frame' }, [canvas]);
      const tools = buildStageControls(ch, entry);
      frame.appendChild(tools);
      const fig = h('figure', { className: 'stage' }, [
        frame,
        h('figcaption', { className: 'stage-caption', text: ch.caption || '' })
      ]);

      if (ch.scene === 'system') {
        entry.planetCard = buildPlanetCard();
        fig.appendChild(entry.planetCard);
      }
      grid.appendChild(fig);
      state.scenes.push(entry);
      wireScene(entry);
      registerResize(entry);
    }

    grid.appendChild(buildReadColumn(ch));

    if (ch.id === 'beyond') {
      grid.appendChild(buildBeyondExtras());
    }

    section.appendChild(grid);
    state.panels[ch.id] = section;
    return section;
  }

  function buildBeyondExtras() {
    const wrap = h('div', { className: 'extras' });

    const types = h('div', { className: 'section-block' }, [
      h('h3', { text: 'The zoo of galaxies' }),
      p('Shape tells us about a galaxy\u2019s history: how much gas it kept, and how many mergers it survived.', 'section-lede')
    ]);
    const typeGrid = h('div', { className: 'card-grid' });
    D.galaxyTypes.forEach(g => {
      typeGrid.appendChild(h('article', { className: 'card' }, [
        h('span', { className: 'gal-icon', attrs: { 'aria-hidden': 'true', 'data-icon': g.icon } }),
        h('h4', { text: g.name }),
        p(g.blurb)
      ]));
    });
    types.appendChild(typeGrid);
    wrap.appendChild(types);

    const objects = h('div', { className: 'section-block' }, [
      h('h3', { text: 'Things in the dark' }),
      p('Most of what the universe is made of never shines. These are some of the objects we can detect.', 'section-lede')
    ]);
    const objGrid = h('div', { className: 'card-grid tight' });
    D.deepSpace.forEach(o => {
      objGrid.appendChild(h('article', { className: 'card' }, [
        h('h4', { text: o.name }),
        p(o.blurb)
      ]));
    });
    objects.appendChild(objGrid);
    wrap.appendChild(objects);

    const address = h('div', { className: 'section-block' }, [
      h('h3', { text: 'Your cosmic address' }),
      p('From the ground up. Each step is a bigger circle of belonging.', 'section-lede')
    ]);
    const ol = h('ol', { className: 'address' });
    D.cosmicAddress.forEach((a, i) => {
      ol.appendChild(h('li', {}, [
        h('span', { className: 'address-step', text: String(i + 1).padStart(2, '0') }),
        h('span', { className: 'address-name', text: a.name }),
        span(a.note, 'address-note')
      ]));
    });
    address.appendChild(ol);
    wrap.appendChild(address);

    return wrap;
  }


  /* ---------------- quiz ---------------- */
  function buildQuizSection() {
    const section = h('section', {
      className: 'chapter quiz-chapter',
      dataset: { chapterPanel: 'quiz' },
      attrs: { 'aria-labelledby': 'title-quiz' }
    });
    section.hidden = true;

    section.appendChild(h('header', { className: 'chapter-head' }, [
      h('p', { className: 'kicker', text: 'Chapter 05 · Check yourself' }),
      h('h2', { className: 'chapter-title', text: 'How far can you see?', attrs: { id: 'title-quiz' } }),
      p('Ten questions drawn from the four chapters. Answer with the buttons or the number keys.', 'lede')
    ]));

    const card = h('div', { className: 'quiz-card' });
    section.appendChild(card);
    state.quizCard = card;
    state.panels.quiz = section;
    return section;
  }

  function renderQuiz() {
    const q = state.quiz;
    const card = state.quizCard;
    if (!card) return;
    card.textContent = '';

    if (q.done) {
      const summary = M.quizSummary(D.quiz, q.answers);
      const ring = h('div', { className: 'score-ring' }, [
        h('span', { className: 'score-number', text: summary.pct + '%' }),
        span('score', 'score-label')
      ]);
      ring.style.setProperty('--score', summary.pct + '%');
      card.appendChild(h('div', { className: 'quiz-summary' }, [
        ring,
        h('div', { className: 'summary-copy' }, [
          h('h3', { text: summary.rank }),
          p('You got ' + summary.correct + ' of ' + summary.total + ' right.', 'summary-line'),
          p(summary.pct >= 80
            ? 'You could navigate by the stars. Try explaining the difference between a solar system and a galaxy to someone else — that is the real test.'
            : 'Worth another pass through the chapters: the numbers are easier to remember once you have seen the scenes.', 'summary-line')
        ])
      ]));

      const review = h('ol', { className: 'quiz-review' });
      D.quiz.forEach((item, i) => {
        const correct = M.scoreAnswer(item, q.answers[i]);
        review.appendChild(h('li', {
          className: correct ? 'review-row ok' : 'review-row bad'
        }, [
          h('span', { className: 'review-mark', attrs: { 'aria-hidden': 'true' } }),
          h('span', { className: 'sr-only', text: correct ? 'Correct: ' : 'Incorrect: ' }),
          h('span', { text: item.q }),
          h('span', { className: 'review-answer', text: item.options[item.answer] })
        ]));
      });
      card.appendChild(review);

      card.appendChild(h('div', { className: 'quiz-actions' }, [
        h('button', {
          className: 'btn primary', text: 'Try again', attrs: { type: 'button' },
          on: { click: () => resetQuiz() }
        }),
        h('button', {
          className: 'btn ghost', text: 'Back to the galaxy', attrs: { type: 'button' },
          on: { click: () => goTo('galaxy') }
        })
      ]));
      return;
    }

    const item = D.quiz[q.index];
    const answered = q.picked !== null;
    const correct = answered && M.scoreAnswer(item, q.picked);

    const fill = h('span', { className: 'quiz-progress-fill' });
    fill.style.width = ((q.index + (answered ? 1 : 0)) / D.quiz.length * 100) + '%';
    const progress = h('div', {
      className: 'quiz-progress',
      attrs: {
        role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(D.quiz.length),
        'aria-valuenow': String(q.index + (answered ? 1 : 0)),
        'aria-label': 'Quiz progress'
      }
    }, [fill]);

    card.appendChild(h('div', { className: 'quiz-top' }, [
      progress,
      span('Question ' + (q.index + 1) + ' of ' + D.quiz.length, 'quiz-count')
    ]));
    card.appendChild(h('h3', { className: 'quiz-question', text: item.q }));

    const options = h('div', { className: 'quiz-options', attrs: { role: 'group', 'aria-label': 'Answer choices' } });
    item.options.forEach((option, i) => {
      let cls = 'quiz-option';
      if (answered) {
        if (i === item.answer) cls += ' correct';
        else if (i === q.picked) cls += ' wrong';
        else cls += ' muted';
      }
      const btn = h('button', {
        className: cls,
        attrs: { type: 'button', 'aria-pressed': String(q.picked === i) },
        on: { click: () => pickAnswer(i) }
      }, [
        h('span', { className: 'option-key', text: String(i + 1) }),
        span(option, 'option-text')
      ]);
      if (answered) btn.disabled = true;
      options.appendChild(btn);
    });
    card.appendChild(options);

    if (answered) {
      card.appendChild(h('div', {
        className: 'quiz-feedback ' + (correct ? 'ok' : 'bad'),
        attrs: { role: 'status', 'aria-live': 'polite' }
      }, [
        h('strong', { text: correct ? 'Correct. ' : 'Not quite. ' }),
        span(item.why)
      ]));
    }

    const nextBtn = h('button', {
      className: 'btn primary',
      text: q.index === D.quiz.length - 1 ? 'See results' : 'Next question',
      attrs: { type: 'button' },
      on: { click: nextQuestion }
    });
    nextBtn.disabled = !answered;

    card.appendChild(h('div', { className: 'quiz-actions' }, [
      nextBtn,
      span(answered ? '' : 'Pick an answer to continue', 'quiz-hint')
    ]));
  }

  function pickAnswer(i) {
    const q = state.quiz;
    if (q.picked !== null || q.done) return;
    q.picked = i;
    q.answers[q.index] = i;
    renderQuiz();
  }

  function nextQuestion() {
    const q = state.quiz;
    if (q.picked === null) return;
    if (q.index >= D.quiz.length - 1) {
      q.done = true;
    } else {
      q.index++;
      q.picked = null;
    }
    renderQuiz();
  }

  function resetQuiz() {
    state.quiz = { index: 0, answers: [], picked: null, done: false };
    renderQuiz();
  }



  /* ---------------- scenes ---------------- */
  function registerResize(entry) {
    fitScene(entry);
    if (typeof root.ResizeObserver === 'function') {
      const ro = new root.ResizeObserver(() => fitScene(entry));
      ro.observe(entry.canvas);
      entry.ro = ro;
    }
  }

  function fitScene(entry) {
    const rect = entry.canvas.getBoundingClientRect ? entry.canvas.getBoundingClientRect() : null;
    const cssW = rect && rect.width ? rect.width : 640;
    const cssH = rect && rect.height ? rect.height : 480;
    const dpr = Math.min(root.devicePixelRatio || 1, 2);
    entry.w = Math.max(220, Math.round(cssW));
    entry.h = Math.max(180, Math.round(cssH));
    const pw = Math.round(entry.w * dpr);
    const ph = Math.round(entry.h * dpr);
    if (entry.canvas.width !== pw) entry.canvas.width = pw;
    if (entry.canvas.height !== ph) entry.canvas.height = ph;
    entry.dpr = dpr;
  }

  function drawScene(entry) {
    const ctx = entry.ctx;
    if (!ctx) return;
    ctx.setTransform(entry.dpr, 0, 0, entry.dpr, 0, 0);
    ctx.clearRect(0, 0, entry.w, entry.h);
    if (entry.kind === 'earth') {
      S.drawEarth(ctx, entry.w, entry.h, {
        time: entry.clock, spin: entry.spin, stars: entry.stars, data: entry.data
      });
    } else if (entry.kind === 'system') {
      entry.positions = S.drawSystem(ctx, entry.w, entry.h, {
        time: entry.clock, speed: entry.speed, planets: D.planets, stars: entry.stars,
        asteroids: entry.asteroids, selected: entry.selected, hover: entry.hover
      });
    } else {
      entry.galaxyInfo = S.drawGalaxy(ctx, entry.w, entry.h, {
        time: entry.clock, zoom: entry.zoom, labels: entry.labels,
        stars: entry.stars, galaxy: entry.galaxy, spinRate: entry.spinRate
      });
    }
  }

  function nearestPlanet(entry, x, y) {
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < entry.positions.length; i++) {
      const p = entry.positions[i];
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist < Math.max(14, p.size + 9) && dist < bestDist) {
        best = p;
        bestDist = dist;
      }
    }
    return best;
  }

  function selectPlanet(entry, id) {
    const planet = D.planets.find(pl => pl.id === id);
    if (!planet) return;
    entry.selected = id;
    if (entry.planetCard) entry.planetCard.setData(planet);
  }

  function wireScene(entry) {
    const canvas = entry.canvas;
    canvas.style.touchAction = 'pan-y';

    if (entry.kind === 'earth') {
      const startDrag = e => {
        entry.dragX = e.clientX;
        if (canvas.setPointerCapture && e.pointerId !== undefined) {
          try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
      };
      const moveDrag = e => {
        if (entry.dragX === null) return;
        const dx = e.clientX - entry.dragX;
        entry.dragX = e.clientX;
        entry.spin = (entry.spin + dx * 0.5) % 360;
      };
      const endDrag = () => { entry.dragX = null; };
      canvas.addEventListener('pointerdown', startDrag);
      canvas.addEventListener('pointermove', moveDrag);
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);
      canvas.addEventListener('pointerleave', endDrag);
    }

    if (entry.kind === 'system') {
      canvas.setAttribute('tabindex', '0');
      canvas.addEventListener('pointermove', e => {
        const rect = canvas.getBoundingClientRect();
        const hit = nearestPlanet(entry, e.clientX - rect.left, e.clientY - rect.top);
        entry.hover = hit ? hit.id : null;
        canvas.style.cursor = hit ? 'pointer' : 'default';
      });
      canvas.addEventListener('pointerleave', () => { entry.hover = null; });
      canvas.addEventListener('click', e => {
        const rect = canvas.getBoundingClientRect();
        const hit = nearestPlanet(entry, e.clientX - rect.left, e.clientY - rect.top);
        if (hit) selectPlanet(entry, hit.id);
      });
      canvas.addEventListener('keydown', e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const i = D.planets.findIndex(pl => pl.id === entry.selected);
        const step = e.key === 'ArrowRight' ? 1 : -1;
        const next = D.planets[(i + step + D.planets.length) % D.planets.length];
        selectPlanet(entry, next.id);
      });
      canvas.setAttribute('aria-label', canvas.getAttribute('aria-label') +
        '. Use the left and right arrow keys to cycle through the planets.');
    }
  }

  function addScene(canvas, config) {
    const entry = Object.assign({
      canvas, ctx: canvas.getContext('2d'), clock: 0, paused: false, visible: false,
      w: 0, h: 0, dpr: 1, speed: 1, zoom: 1, labels: true, spin: 40, dragX: null,
      positions: [], stars: M.makeStarfield(220, 23)
    }, config);
    if (entry.kind === 'system' && !entry.asteroids) entry.asteroids = S.buildSystemData().asteroids;
    if (entry.kind === 'galaxy' && !entry.galaxy) entry.galaxy = S.buildGalaxyData();
    if (entry.kind === 'earth' && !entry.data) entry.data = S.buildEarthData();
    state.scenes.push(entry);
    wireScene(entry);
    registerResize(entry);
    return entry;
  }

  let lastFrame = 0;
  function frame(now) {
    const dt = Math.min(0.06, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    for (let i = 0; i < state.scenes.length; i++) {
      const entry = state.scenes[i];
      entry.visible = !document.hidden && entry.host === state.active;
      if (!entry.visible) continue;
      if (!entry.paused) {
        entry.clock += dt;
        if (entry.kind === 'earth') entry.spin = (entry.spin + dt * 4.5) % 360;
      }
      if (!entry.w) fitScene(entry);
      drawScene(entry);
    }
    root.requestAnimationFrame(frame);
  }

  /* ---------------- navigation ---------------- */
  function buildNav() {
    const nav = document.getElementById('chapter-nav');
    if (!nav) return;
    const items = [{ id: 'overview', num: '00', label: 'Overview' }].concat(
      chapters.map(c => ({ id: c.id, num: c.num, label: c.kicker })),
      [{ id: 'quiz', num: '05', label: 'Quiz' }]
    );
    items.forEach(item => {
      const btn = h('button', {
        className: 'nav-link',
        attrs: { type: 'button' },
        dataset: { target: item.id },
        on: { click: () => goTo(item.id) }
      }, [
        span(item.num, 'nav-num'),
        span(item.label, 'nav-label')
      ]);
      nav.appendChild(btn);
      state.nav.push(btn);
    });
  }

  function goTo(id, opts) {
    if (!state.panels[id]) id = 'overview';
    state.active = id;
    for (const key in state.panels) state.panels[key].hidden = key !== id;
    state.nav.forEach(btn => {
      const on = btn.dataset.target === id;
      btn.classList.toggle('active', on);
      if (on) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    state.scenes.forEach(entry => {
      if (entry.host === id) fitScene(entry);
    });
    if (state.speakingChapter && state.speakingChapter !== id) stopSpeech();
    if (id === 'quiz' && !state.quiz.done) renderQuiz();
    if (root.history && root.history.replaceState) {
      try { root.history.replaceState(null, '', '#' + id); } catch (err) { /* file:// can refuse */ }
    }
    if (!opts || !opts.noScroll) {
      if (root.scrollTo) root.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* ---------------- narration ---------------- */
  function setSpeechButton(btn, on) {
    if (!btn) return;
    btn.textContent = on ? 'Stop reading' : 'Listen to this chapter';
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('speaking', on);
  }

  function stopSpeech() {
    if (root.speechSynthesis) root.speechSynthesis.cancel();
    if (state.speechButton) setSpeechButton(state.speechButton, false);
    state.speakingChapter = null;
    state.speechButton = null;
  }

  function toggleSpeech(ch, btn) {
    const synth = root.speechSynthesis;
    if (!synth || typeof root.SpeechSynthesisUtterance !== 'function') return;
    if (state.speakingChapter === ch.id) { stopSpeech(); return; }
    stopSpeech();
    const text = ch.title + '. ' + ch.narration.join(' ');
    const utter = new root.SpeechSynthesisUtterance(text);
    utter.lang = 'en-GB';
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.onend = () => { if (state.speakingChapter === ch.id) stopSpeech(); };
    utter.onerror = utter.onend;
    state.speakingChapter = ch.id;
    state.speechButton = btn;
    setSpeechButton(btn, true);
    try {
      synth.speak(utter);
    } catch (err) {
      stopSpeech();
    }
  }

  /* ---------------- boot ---------------- */
  function init() {
    const main = document.getElementById('chapters');
    if (!main) return;
    buildNav();

    const sources = document.getElementById('sources');
    if (sources) {
      D.links.forEach(link => {
        sources.appendChild(h('li', {}, [
          h('a', {
            text: link.label,
            attrs: { href: link.url, target: '_blank', rel: 'noopener noreferrer' }
          })
        ]));
      });
    }
    main.appendChild(buildOverview());
    chapters.forEach(ch => main.appendChild(buildChapterSection(ch)));
    main.appendChild(buildQuizSection());

    const heroCanvas = state.panels.overview.querySelector('.hero-canvas');
    if (heroCanvas) {
      addScene(heroCanvas, {
        kind: 'galaxy', host: 'overview', labels: false, zoom: 0.94,
        paused: reduceMotion, spinRate: 0.028,
        stars: M.makeStarfield(260, 5)
      });
    }

    renderQuiz();

    root.addEventListener('resize', () => {
      state.scenes.forEach(fitScene);
    });

    root.addEventListener('hashchange', () => {
      const id = (root.location.hash || '').replace('#', '');
      goTo(id || 'overview', { noScroll: true });
    });

    root.addEventListener('keydown', e => {
      if (state.active !== 'quiz' || state.quiz.done) return;
      const target = e.target;
      if (target && /^(input|textarea|select)$/i.test(target.tagName || '')) return;
      if (/^[1-4]$/.test(e.key)) {
        e.preventDefault();
        pickAnswer(parseInt(e.key, 10) - 1);
      } else if (e.key === 'Enter' && state.quiz.picked !== null) {
        if (target && target.tagName === 'BUTTON') return;
        e.preventDefault();
        nextQuestion();
      }
    });

    const hash = ((root.location && root.location.hash) || '').replace('#', '');
    goTo(state.panels[hash] ? hash : 'overview', { noScroll: true });

    lastFrame = 0;
    root.requestAnimationFrame(now => { lastFrame = now; root.requestAnimationFrame(frame); });
  }

  root.CosmosApp = {
    init, goTo, pickAnswer, nextQuestion, resetQuiz, renderQuiz, state, chapters
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);

