# Earth &amp; Galaxy

An interactive field guide to the world and the galaxy it spins in. Four short
chapters, three hand-drawn canvas scenes and a ten-question quiz.

Open `index.html` in any modern browser. No build step, no dependencies, no
trackers.

## What is inside

| Chapter | Scene | You can |
|---|---|---|
| 01 · Home world | Rotating Earth with day/night terminator, city lights and the Moon | Drag the globe, pause the spin |
| 02 · The neighbourhood | The Sun, eight planets, asteroid belt and Saturn's rings | Click or arrow-key through the planets, change orbit speed |
| 03 · Our galaxy | Barred spiral Milky Way with the Sun's position marked | Zoom, hide labels, pause the spin |
| 04 · Beyond | Galaxy shapes, deep-space objects and a cosmic-address ladder | Read and compare |
| 05 · Quiz | Ten multiple-choice questions with explanations | Answer by button or number keys |

Each chapter has a **Listen** button that reads the text with the browser's
speech synthesis (where supported), plus a "did you know" fact and four key
numbers.

## Controls

* **Navigation:** the chapter pills, the hero buttons, or the URL hash
  (`#earth`, `#system`, `#galaxy`, `#beyond`, `#quiz`). Back/forward work.
* **Earth:** drag left/right to spin.
* **Solar System:** click a planet (or focus the canvas and use ← / →) to update
  the planet card. The speed slider runs from paused to 3×.
* **Galaxy:** zoom slider, labels checkbox, pause button.
* **Quiz:** click an option or press **1–4**, then **Enter** for the next
  question. A full review and score appear at the end.

## Files

```
cosmos/
  index.html   the shell (header, footer, noscript fallback)
  style.css    dark editorial layout, responsive to 390 px
  data.js      chapters, planets, galaxy types, deep-space cards, quiz, sources
  model.js     pure math: projection, seeded galaxy/starfield, scoring
  scenes.js    drawEarth / drawSystem / drawGalaxy
  app.js       DOM building, scene loop, narration, quiz, routing
```

`model.js`, `data.js` and `scenes.js` are plain UMD modules so the browser and
the Node tests load the same code. `app.js` runs against a tiny DOM stub in the
tests, exercising routing, scene drawing, drag/click input and the whole quiz.

## Notes on the science

Figures are rounded estimates from NASA, ESA and IAU public material, current as
of 2025. Distances and sizes in the Solar System scene are compressed so all
eight planets fit on one screen, and the orbital speeds are exaggerated — the
caption says so. The globe uses simplified coastlines and a fixed light
direction; city lights are procedural and illustrative, not a real night-lights
map. The Milky Way is an artist's impression, not a photograph.

Each chapter and the footer link to the relevant NASA/ESA pages for deeper
reading.

## Tests

```
node test/cosmos.js
```

Checks:

* every chapter, planet, card and quiz question has valid, complete data;
* projection / galaxy / scoring math including edge cases;
* all three scenes draw at 320×240, 800×600 and 1280×800 without NaNs or
  off-canvas planets;
* the app builds six panels and four scenes, routes, spins the globe on drag,
  selects planets by click and keyboard, and completes the quiz (including the
  Enter-on-button double-advance guard).

Optional stills (requires the dev-only `canvas` package):

```
npm i canvas --no-save
node test/shots-cosmos.js   # -> shots/cosmos-*.png
```
