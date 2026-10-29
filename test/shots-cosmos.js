/* Render the Cosmos scenes to PNGs for eyeballing the artwork.
   Dev only: npm i canvas --no-save
   Usage: node test/shots-cosmos.js   -> shots/cosmos-*.png
*/
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const M = require('../cosmos/model.js');
const S = require('../cosmos/scenes.js');
const D = require('../cosmos/data.js');

const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const W = 900;
const H = 640;
const stars = M.makeStarfield(220, 23);
const galaxy = S.buildGalaxyData();

function shot(name, draw) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  draw(ctx);
  const file = path.join(OUT, 'cosmos-' + name + '.png');
  fs.writeFileSync(file, canvas.toBuffer('image/png'));
  console.log('wrote', path.relative(process.cwd(), file));
}

shot('earth', ctx => S.drawEarth(ctx, W, H, { time: 2, spin: 45, stars }));
shot('earth-pacific', ctx => S.drawEarth(ctx, W, H, { time: 9, spin: 210, stars }));
shot('system', ctx => S.drawSystem(ctx, W, H, {
  time: 5, speed: 1, planets: D.planets, stars, selected: 'earth'
}));
shot('system-jupiter', ctx => S.drawSystem(ctx, W, H, {
  time: 12, speed: 1, planets: D.planets, stars, selected: 'jupiter'
}));
shot('galaxy', ctx => S.drawGalaxy(ctx, W, H, { time: 3, zoom: 1, labels: true, stars, galaxy }));
shot('galaxy-zoom', ctx => S.drawGalaxy(ctx, W, H, { time: 8, zoom: 1.4, labels: false, stars, galaxy }));
