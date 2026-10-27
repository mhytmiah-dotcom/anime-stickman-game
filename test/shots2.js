const { run, renderFrame } = require('./render');
const moments = [
  ['titan', 'r', 58], ['titan', 'e', 26],
  ['blaze', 'r', 36], ['volt', 'r', 60],
  ['asta', 'r', 60], ['yuno', 'r', 48],
  ['shadow', 'r', 42], ['frost', 'r', 88],
  ['ronin', 'r', 76], ['asta', 'e', 22]
];
for (const [id, key, frame] of moments) {
  run(`startMatch('${id}', 'shadow'); G.intro = 0; G.p1.x = 440; G.p2.x = 700;
       G.p1.meter = 100; G.p1.locked = false; G.p1.tryUlt('${key}');`);
  run(`shotSteps(${frame})`);
  renderFrame(`ult-${id}-${key}`);
}
