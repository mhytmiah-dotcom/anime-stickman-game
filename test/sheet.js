const { run, realCanvas, outDir } = require('./render');
const fs = require('fs');
const path = require('path');
const save = (name) => { fs.writeFileSync(path.join(outDir, name + '.png'), realCanvas.toBuffer('image/png')); console.log('wrote', name); };
run(`
  globalThis.SHEET = {
    walk(id) {
      const f = new Fighter(id, 0, 1, 0);
      f.scale = 1.15; f.walking = true; f.animT = 10;
      bgCanvas = null; buildBackground(); drawFightScene === 0;
      ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(bgCanvas, 0, 0);
      for (let i = 0; i < 6; i++) {
        f.walkPhase = i * Math.PI / 3;
        drawFighter(f, 130 + i * 190, GROUND);
      }
      return 'ok';
    },
    jump(id) {
      const f = new Fighter(id, 0, 1, 0);
      f.scale = 1.15; f.animT = 10;
      bgCanvas = null; buildBackground();
      ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(bgCanvas, 0, 0);
      const frames = [[0, 13], [3, 9], [10, 2], [20, -2], [28, -11], [40, -14]];
      frames.forEach(([jt, v], i) => {
        f.jumpT = jt; f.vy = v; f.airY = 70;
        drawFighter(f, 130 + i * 190, GROUND - 40);
      });
      return 'ok';
    },
    punch(id) {
      const f = new Fighter(id, 0, 1, 0);
      f.scale = 1.15; f.animT = 10;
      bgCanvas = null; buildBackground();
      ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(bgCanvas, 0, 0);
      for (let i = 0; i < 5; i++) {
        f.atk = 'punch'; f.atkDur = 22; f.atkT = 3 + i * 4;
        drawFighter(f, 130 + i * 190, GROUND);
      }
      return 'ok';
    }
  };
`);
for (const [name, fn, id] of [['walk', 'walk', 'asta'], ['jump', 'jump', 'blaze'], ['punch', 'punch', 'titan'], ['walk2', 'walk', 'ronin'], ['punch2', 'punch', 'asta']]) {
  run(`SHEET.${fn}('${id}')`);
  save('50-' + name);
}
