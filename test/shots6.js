const { run, renderFrame } = require('./render');

// select screen in 1P vs CPU mode (P1 highlighted, CPU roulette pick)
run(`
  AI_GAME.vsCPU = true; AI_GAME.level = 2;
  G.state = 'select'; G.loading = 100; G.time = 40;
  SEL.t = 48; SEL.c = [0, 3]; SEL.locked = [false, false];
  render();
`);
renderFrame('14-select-cpu');

// CPU (right) pressuring the player
run(`
  AI_GAME.vsCPU = true; AI_GAME.level = 2;
  startMatch('titan', 'ronin'); G.intro = 0;
  G.p1.x = 500; G.p2.x = 742; G.p1.face = 1; G.p2.face = -1;
`);
run('shotSteps(84)');
renderFrame('15-cpu-fight');

// CPU ultimate
run(`
  AI_GAME.vsCPU = true; AI_GAME.level = 2;
  startMatch('frost', 'volt'); G.intro = 0;
  G.p1.x = 470; G.p2.x = 810; G.p2.meter = 100; G.p2.locked = false;
`);
run('shotSteps(40)');
run(`G.p2.ai.ultCd = 0; G.p2.meter = 100; G.p2.locked = false; G.p2.tryUlt('r');`);
run('shotSteps(46)');
renderFrame('16-cpu-ult');
