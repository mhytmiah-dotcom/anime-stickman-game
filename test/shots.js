const { run, renderFrame } = require('./render');

// loading
run('G.loading = 62; render()'); renderFrame('01-loading');
// select
run('G.state = "select"; G.loading = 100; G.time = 40; render()'); renderFrame('02-select');
// fight idle
run(`startMatch('titan','blaze'); G.intro = 0; G.p1.x = 430; G.p2.x = 840;`);
run('shotSteps(30)'); renderFrame('03-fight-idle');
// walk
run(`keys['d'] = true;`); run('shotSteps(18)'); renderFrame('04-walk');
run(`keys['d'] = false;`);
// punch
run(`G.p1.startAttack('punch');`); run('shotSteps(9)'); renderFrame('05-punch');
run('shotSteps(40)');
// kick
run(`G.p1.startAttack('kick');`); run('shotSteps(12)'); renderFrame('06-kick');
