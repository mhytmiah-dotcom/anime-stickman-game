const { run, renderFrame } = require('./render');
run(`startMatch('blaze','ronin'); G.intro = 0; G.p1.x = 470; G.p2.x = 560; G.p2.hp = 4;`);
run(`G.p1.startAttack('kick');`);
run('shotSteps(120)'); renderFrame('13-ko');
run(`startMatch('frost','titan'); G.intro=0; G.p1.x=430; G.p2.x=700; G.p1.meter=100; G.p1.locked=false; G.p1.tryUlt('r');`);
run('shotSteps(88)'); renderFrame('14-frost-freeze');
