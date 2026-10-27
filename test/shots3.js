const { run, renderFrame } = require('./render');
// intro countdown
run(`startMatch('asta','yuno'); G.p1.x = 430; G.p2.x = 830;`);
run('shotSteps(30)'); renderFrame('07-countdown');
// mid fight action: asta demon mode + yuno wind
run(`G.intro = 0; G.p1.meter = 100; G.p1.locked = false; G.p1.tryUlt('r');`);
run('shotSteps(78)'); renderFrame('08-asta-demon');
// KO
run(`G.p2.hp = 4; G.p1.x = 800; G.p2.x = 860; G.p1.face = 1; G.p1.startAttack('kick');`);
run('shotSteps(90)'); renderFrame('09-ko');
// frost ice spikes
run(`startMatch('frost','ronin'); G.intro=0; G.p1.x=430; G.p2.x=760; G.p1.meter=100; G.p1.locked=false; G.p1.tryUlt('e');`);
run('shotSteps(24)'); renderFrame('10-frost-e');
// shadow clone
run(`startMatch('shadow','volt'); G.intro=0; G.p1.x=520; G.p2.x=740; G.p1.meter=100; G.p1.locked=false; G.p1.tryUlt('e');`);
run('shotSteps(22)'); renderFrame('11-shadow-e');
