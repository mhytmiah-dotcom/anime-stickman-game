<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anime Stickman Showdown</title>
    <style>
        body {
            margin: 0;
            background: #111;
            color: #fff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
            user-select: none;
        }
        #game-container {
            position: relative;
            box-shadow: 0 0 30px rgba(0,0,0,0.7);
        }
        canvas {
            background: #222;
            display: block;
            border-radius: 4px;
        }
        .ui-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 800px;
            height: 500px;
            pointer-events: none;
            box-sizing: border-box;
            padding: 20px;
        }
        .hud {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .player-panel {
            width: 35%;
        }
        .p2-panel {
            text-align: right;
        }
        .name {
            font-size: 20px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            margin-bottom: 5px;
        }
        .bar-container {
            background: rgba(0,0,0,0.5);
            border: 2px solid #555;
            height: 16px;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
        }
        .health-bar {
            width: 100%;
            height: 100%;
            background: #ff3333;
            transition: width 0.1s ease-out;
        }
        .energy-bar {
            width: 0%;
            height: 6px;
            background: #33ccff;
            margin-top: 4px;
            border-radius: 3px;
            transition: width 0.1s ease-out;
        }
        .rounds {
            display: flex;
            gap: 5px;
            margin-top: 5px;
        }
        .p2-panel .rounds {
            justify-content: flex-end;
        }
        .dot {
            width: 12px;
            height: 12px;
            background: rgba(255,255,255,0.2);
            border: 2px solid #fff;
            border-radius: 50%;
        }
        .dot.won {
            background: #ffcc00;
            box-shadow: 0 0 8px #ffcc00;
        }
        .screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 10, 15, 0.95);
            pointer-events: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .hidden {
            display: none !important;
        }
        h1 {
            font-size: 36px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #ff3366;
            text-shadow: 0 0 10px rgba(255,51,102,0.5);
        }
        h2 {
            font-size: 18px;
            color: #aaa;
            margin-bottom: 15px;
        }
        .grid {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: #252530;
            border: 3px solid #444;
            padding: 15px 25px;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.2s;
            min-width: 100px;
        }
        .card:hover, .card.selected {
            border-color: #ff3366;
            background: #353545;
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(255,51,102,0.3);
        }
        button.start-btn {
            background: #ff3366;
            color: white;
            border: none;
            padding: 12px 40px;
            font-size: 20px;
            font-weight: bold;
            border-radius: 25px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(255,51,102,0.4);
        }
        button.start-btn:hover {
            background: #ff5588;
            box-shadow: 0 4px 25px rgba(255,51,102,0.6);
        }
        .msg-text {
            font-size: 40px;
            font-weight: bold;
            color: #fff;
            text-transform: uppercase;
            text-shadow: 0 0 20px rgba(255,255,255,0.5);
            text-align: center;
        }
        .controls-hint {
            margin-top: 15px;
            font-size: 13px;
            color: #777;
            text-align: center;
            line-height: 1.5;
        }
    </style>
</head>
<body>

    <div id="game-container">
        <canvas id="gameCanvas" width="800" height="500"></canvas>
        
        <div class="ui-layer">
            <div class="hud">
                <div class="player-panel p1-panel">
                    <div class="name" id="p1-name">Gojo</div>
                    <div class="bar-container"><div class="health-bar" id="p1-health"></div></div>
                    <div class="energy-bar" id="p1-energy"></div>
                    <div class="rounds" id="p1-rounds">
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>
                
                <div class="player-panel p2-panel">
                    <div class="name" id="p2-name">AI Yuno</div>
                    <div class="bar-container"><div class="health-bar" id="p2-health"></div></div>
                    <div class="energy-bar" id="p2-energy"></div>
                    <div class="rounds" id="p2-rounds">
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="screen" id="setup-screen">
            <h1>Character Select</h1>
            <div class="grid" id="char-grid">
                <div class="card selected" data-char="gojo">GOJO</div>
                <div class="card" data-char="asta">ASTA</div>
                <div class="card" data-char="yuno">YUNO</div>
            </div>

            <h2>Select Arena</h2>
            <div class="grid" id="stage-grid">
                <div class="card selected" data-stage="dojo">DOJO</div>
                <div class="card" data-stage="cyber">CYBERPUNK</div>
                <div class="card" data-stage="ruins">RUINS</div>
            </div>

            <button class="start-btn" id="start-btn">Battle</button>
            <div class="controls-hint">
                Controls: A/D = Move | J = Light Strike | K = Heavy Knockback | L = Special Ability (Requires 100% Energy)
            </div>
        </div>

        <div class="screen hidden" id="round-screen">
            <div class="msg-text" id="round-msg">Round 1 Won!</div>
        </div>
    </div>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        let selectedChar = 'gojo';
        let selectedStage = 'dojo';
        let gameState = 'setup'; 
        
        let p1Score = 0;
        let p2Score = 0;
        let screenShake = 0;

        const keys = { a: false, d: false, j: false, k: false, l: false };
        let particles = [];
        let projectiles = [];

        // Interactive Menu Selection Handler Engine
        function setupGridSelectors(gridId, selectionCallback) {
            const grid = document.getElementById(gridId);
            grid.addEventListener('click', (e) => {
                if (e.target.classList.contains('card')) {
                    Array.from(grid.children).forEach(card => card.classList.remove('selected'));
                    e.target.classList.add('selected');
                    selectionCallback(e.target.dataset.char || e.target.dataset.stage);
                }
            });
        }

        setupGridSelectors('char-grid', (val) => { selectedChar = val; });
        setupGridSelectors('stage-grid', (val) => { selectedStage = val; });

        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('setup-screen').classList.add('hidden');
            initGame();
        });

        // Key Listeners
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'a') keys.a = true;
            if (e.key.toLowerCase() === 'd') keys.d = true;
            if (e.key.toLowerCase() === 'j') handleP1Attack('light');
            if (e.key.toLowerCase() === 'k') handleP1Attack('heavy');
            if (e.key.toLowerCase() === 'l') handleP1Attack('special');
        });

        window.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === 'a') keys.a = false;
            if (e.key.toLowerCase() === 'd') keys.d = false;
        });

        class Fighter {
            constructor(x, y, color, name, isAI, type) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.name = name;
                this.isAI = isAI;
                this.type = type;
                
                this.width = 40;
                this.height = 90;
                this.vx = 0;
                this.health = 100;
                this.energy = 0;
                this.facing = isAI ? -1 : 1;
                this.state = 'idle'; // idle, attacking, hit
                this.stateTimer = 0;
                this.walkCycle = 0;
            }

            update() {
                this.x += this.vx;
