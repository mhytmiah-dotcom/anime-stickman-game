const { run, renderFrame } = require('./render');
const setup = `startMatch('asta','blaze'); G.intro = 0; G.p1.x = 470; G.p2.x = 800;`;
run(setup); run('shotSteps(2)');
// walk cycle frames
run(`keys['d'] = true;`);
for (const n of [4, 10, 16]) { run(`shotSteps(${n})`); }
renderFrame('30-walk');
run(`keys['d'] = false;`);
// jump rise
run(`pressed['w'] = true; keys['w'] = true; shotSteps(1); keys['w'] = false;`);
run('shotSteps(8)'); renderFrame('31-jump-rise');
run('shotSteps(14)'); renderFrame('32-jump-fall');
run('shotSteps(30)'); renderFrame('33-land');
// combo punch 2
run(`G.p1.startAttack('punch'); shotSteps(9);`);
renderFrame('34-punch');
run(`G.p1.startAttack('punch', true); shotSteps(9);`);
renderFrame('35-punch2');
// dash + ghosts
run(`G.p1.startDash(1); shotSteps(5);`);
renderFrame('36-dash');
run('shotSteps(30)');
// air kick
run(`G.p1.vy = 15; G.p1.airY = 0.1; shotSteps(9); G.p1.startAttack('kick'); shotSteps(10);`);
renderFrame('37-airkick');
