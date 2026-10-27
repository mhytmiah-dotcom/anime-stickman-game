const { run, realCanvas, outDir } = require('./render');
const { createCanvas, loadImage } = require('/workspace/node_modules/canvas');
const fs = require('fs');
const path = require('path');

async function strip(name, frames, crop) {
  const imgs = [];
  for (const i of frames) { run(`shotSteps(${i})`); run('render()'); imgs.push(await loadImage(realCanvas.toBuffer('image/png'))); }
  const cw = 320, ch = 240, cols = 3, rows = Math.ceil(imgs.length / cols);
  const c = createCanvas(cw * cols, ch * rows);
  const x = c.getContext('2d');
  imgs.forEach((img, i) => {
    x.drawImage(img, crop.x, crop.y, crop.w, crop.h, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch);
    x.strokeStyle = '#335'; x.strokeRect((i % cols) * cw, Math.floor(i / cols) * ch, cw, ch);
  });
  fs.writeFileSync(path.join(outDir, name + '.jpg'), c.toBuffer('image/jpeg', { quality: .85 }));
  console.log('wrote', name);
}

(async () => {
  const crop = { x: 330, y: 300, w: 640, h: 400 };
  run(`startMatch('asta','blaze'); G.intro=0; G.p1.x=470; G.p2.x=640; G.p1.face=1; G.p2.face=-1;`);
  run(`shotSteps(20); G.p1.startAttack('punch');`);
  run('shotSteps(0)');
  await strip('60-punch-seq', [3, 3, 3, 3, 3, 3], crop);
  run(`shotSteps(20); G.p1.startAttack('kick');`);
  await strip('61-kick-seq', [4, 4, 4, 4, 4, 4], crop);
  run(`startMatch('ronin','frost'); G.intro=0; G.p1.x=440; G.p2.x=700; G.p1.face=1; G.p2.face=-1;`);
  run(`shotSteps(10); keys['d']=true;`);
  await strip('62-walk-seq', [4, 4, 4, 4, 4, 4], crop);
  run(`keys['d']=false; shotSteps(6); G.p1.startDash(1);`);
  await strip('63-dash-seq', [2, 2, 2, 2, 2, 2], crop);
})();
