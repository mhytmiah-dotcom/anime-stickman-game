:root {
  --bg-deep: #030d1d;
  --bg-mid: #061c30;
  --panel: rgba(10, 22, 35, 0.9);
  --panel-strong: rgba(12, 26, 40, 0.96);
  --line: rgba(140, 175, 255, 0.18);
  --text: #edf4ff;
  --muted: #b2c4dd;
  --blue: #7fc8ff;
  --blue-strong: #64b4ff;
  --purple: #8a7dff;
  --green: #69e6a3;
  --shadow: rgba(0, 0, 0, 0.45);
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  min-height: 100%;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: radial-gradient(circle at top, #122848 0%, #08192f 22%, var(--bg-deep) 100%);
  color: var(--text);
}

body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  position: relative;
}

.stars {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(2px 2px at 10% 20%, rgba(255,255,255,0.9) 0, transparent 100%),
    radial-gradient(2px 2px at 30% 50%, rgba(255,255,255,0.8) 0, transparent 100%),
    radial-gradient(2px 2px at 55% 30%, rgba(255,255,255,0.9) 0, transparent 100%),
    radial-gradient(1.5px 1.5px at 70% 70%, rgba(255,255,255,0.8) 0, transparent 100%),
    radial-gradient(1.5px 1.5px at 80% 40%, rgba(255,255,255,0.8) 0, transparent 100%);
  opacity: 0.8;
}

.app-shell {
  position: relative;
  z-index: 1;
  width: min(1100px, 92vw);
  min-height: 760px;
  background: rgba(5, 14, 24, 0.82);
  border: 1px solid var(--line);
  border-radius: 28px;
  box-shadow: 0 30px 60px var(--shadow);
  overflow: hidden;
  padding: 24px 28px 18px;
}

.topbar {
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(7, 18, 32, 0.8);
  padding: 20px 22px 18px;
  margin-bottom: 22px;
}

.eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  color: var(--blue);
  font-weight: 700;
  margin-bottom: 10px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}

h1 {
  margin: 0;
  font-size: clamp(2.2rem, 3.2vw, 3.1rem);
  letter-spacing: -0.05em;
}

.online-pill {
  background: rgba(72, 188, 123, 0.08);
  border: 1px solid rgba(105, 230, 163, 0.4);
  padding: 10px 18px;
  border-radius: 999px;
  color: var(--green);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;
  justify-content: center;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 14px var(--green);
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(15, 26, 43, 0.85);
  border: 1px solid var(--line);
  border-radius: 18px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 18px 20px;
}

.stat-card h3 {
  margin: 0 0 10px;
  color: var(--blue);
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  font-weight: 800;
}

.stat-card p {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text);
  line-height: 1.5;
}

.chat {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 0;
  margin-bottom: 18px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.message.user {
  justify-content: flex-end;
}

.message.user .bubble {
  background: rgba(132, 147, 176, 0.12);
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 18px 18px 12px 18px;
  max-width: 520px;
  padding: 14px 18px;
  font-size: 1.08rem;
  font-weight: 600;
  text-align: left;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(124,200,255,0.32), rgba(138,125,255,0.22));
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}

.message.user .avatar {
  display: none;
}

.bot-content {
  background: rgba(15, 26, 43, 0.85);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 18px 18px 20px;
  width: min(100%, 860px);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
}

.bot-content h2 {
  margin: 0 0 16px;
  font-size: clamp(2rem, 3vw, 2.8rem);
  letter-spacing: -0.05em;
}

.hero-image {
  width: 100%;
  height: 250px;
  border-radius: 16px;
  background-size: cover;
  background-position: center;
  border: 1px solid var(--line);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25);
  margin-bottom: 16px;
}

.bot-content p {
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.7;
  color: var(--text);
}

.fact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.fact-box {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(17, 31, 48, 0.9);
  padding: 16px 14px;
  min-height: 110px;
}

.fact-box h4 {
  margin: 0 0 8px;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  color: var(--blue);
  font-weight: 800;
}

.fact-box p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
  font-size: 1rem;
}

.composer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  margin-top: 8px;
}

#question {
  flex: 1;
  height: 62px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: rgba(14, 25, 38, 0.9);
  color: var(--text);
  padding: 0 18px;
  font-size: 1.03rem;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

#question::placeholder {
  color: rgba(178, 196, 221, 0.7);
}

#question:focus {
  border-color: rgba(127, 200, 255, 0.7);
  box-shadow: 0 0 0 4px rgba(127, 200, 255, 0.08);
}

.composer button {
  width: 130px;
  height: 62px;
  border: none;
  border-radius: 18px;
  font-size: 1.05rem;
  font-weight: 800;
  color: #071a2b;
  background: linear-gradient(135deg, var(--blue), #bfdcff);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.composer button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(127, 200, 255, 0.35);
}

@media (max-width: 840px) {
  body {
    overflow: auto;
  }

  .app-shell {
    min-height: auto;
    padding: 16px 16px 18px;
    margin: 18px 12px;
  }

  .title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-cards,
  .fact-grid {
    grid-template-columns: 1fr;
  }

  .composer {
    flex-direction: column;
    align-items: stretch;
  }

  .composer button {
    width: 100%;
  }
}
