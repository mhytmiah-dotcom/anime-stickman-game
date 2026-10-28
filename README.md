# STICK LEGENDS — Ult Fighters

A 2-player stickman fighting game for one keyboard. 8 fighters, each with two
ultimates (E / R), hand-animated skeletons, cloth physics and a lot of VFX.

Open `index.html` in any modern browser — no build step, no dependencies.

**Look:** fighters default to **classic stickmen** (hollow circle head, single-line body and limbs,
no hair/capes/accessories), drawn with tapered ink strokes, rounded joints, a top-lit body
gradient, a hollow ring head with rim light + blinking eye, soft contact shadows and a faint
colour halo. Press **T** on the character-select screen to switch to the stylised look
(hair, capes, masks, grimoire) and back.

## Controls

| | Move | Jump | Punch | Kick | Ult I (E) | Ult II (R) |
|---|---|---|---|---|---|---|
| **P1** | A / D | W | F | G | E | R |
| **P2** | ← / → | ↑ | K | L | O | P |

* **Select screen:** P1 moves with A/D/W/S, locks with **F**, backs out with **G**.
  P2 moves with the arrow keys, locks with **K**, backs out with **L**. **Enter** locks both.
* **After a K.O.:** **Enter** returns to character select, **R** is a rematch.

### Movement tech

* **Double-tap** left/right to **dash** — invincible for a few frames, leaves speed ghosts.
* **Punch in the air** for a **dive kick** (`airkick`), with a longer lunging hitbox.
* Tap **punch repeatedly** for a **3-hit chain**: jab → jab → heavy finisher (more damage, bigger hitstop).
* Attacks **lunge** forward, so you can convert a read into a hit from just outside range.

### Motion system

* **More joints:** hip → spine (curved) → shoulders → elbow → wrist → hand, and hip → knee → ankle → toe.
* **Smooth blending:** every fighter keeps a *current* pose that eases toward the target pose each
  frame (fast ease on the strike frame, soft ease for idle/walk), so nothing pops between states.
* **Overlapping action:** wrists flick, feet roll through the toe, the spine bows, and cloth/hair
  keep their own lag — limbs no longer move as one rigid block.
* **Motion smears:** each fast-moving hand/foot leaves a tapered light ribbon (strongest on strikes,
  dashes and ultimates), plus the dash speed-ghosts.

### Hit detection

Fighters are hit with **body boxes** (head to feet), not a single point, so low kicks,
overhead fireballs and tall slashes all connect where they look like they should.
Projectiles use **swept collision** (previous position → current position) so fast
fireballs, wind blades and the thrown axe cannot tunnel through you.

## The ult meter

E and R are **both** ultimates:

* **E** costs 50% meter, **R** costs the full 100%.
* Using either one **empties the meter and locks both ults** for that fighter.
  You get them back only when the meter refills to 100% (shown as `ULT READY!`).
* The meter fills from damage you deal (more) and damage you take (less), plus a
  very slow passive trickle so a stalemate never lasts forever.

## Roster

| Fighter | Look | E — Special | R — Ultimate |
|---|---|---|---|
| **TITAN** | horns, torn cape, huge battle axe | **Axe Throw** – the axe flies out, hits, and returns | **Earthsplitter** – leap + axe slam, shockwave and a ground crack |
| **BLAZE** | living flame hair, fire gauntlet | **Fireball Barrage** – three spread fireballs | **Phoenix Dive** – becomes a phoenix and dives through you |
| **VOLT** | lightning hair, storm boots | **Lightning Dash** – teleporting strike | **Thunder Judgement** – telegraphed sky bolts + a final pillar |
| **ASTA** | spiky hair, headband, anti-magic greatsword | **Demon-Slayer Slash** – dash + black/red cross slash | **Demon-Dweller Mode** – demon aura, damage/speed buff and a giant anti-magic crescent |
| **YUNO** | green mantle, grimoire | **Wind Blades** – three homing-ish wind crescents | **Spirit Dive** – spectral spirit holds you in a wind vortex, then bursts |
| **SHADOW** | scarf, mask, kunai | **Shadow Clone Strike** – clones slash from both sides | **Void Assassination** – vanishes and cuts from every angle |
| **FROST** | ice crown, long hair, crystal staff, cape | **Ice Spikes** – spikes erupt along the ground and can freeze | **Absolute Zero** – blizzard, freeze, then a shatter |
| **RONIN** | ponytail, sash, katana | **Iai — Quick Draw** – blink + single cut | **Moon Thousand Cuts** – moon rises, flurry of slashes, moonbeam finisher |

## Technical notes

* `js/core.js` — canvas, input, math, particles, effect objects, projectiles.
* `js/characters.js` — roster data, looks, and each ult as a frame-by-frame script.
* `js/poses.js` — procedural skeleton (walk cycle, jump, punch/kick, ult poses),
  hair, capes, scarves, mantles, weapons and the phoenix/spirit renders.
* `js/game.js` — fighter physics/combat, stage, HUD, loading, select, main loop.
* Runs on a fixed 60 Hz step with hitstop and screen shake.

### Tests

Headless tests render with `node-canvas` (dev only):

```
npm i canvas --no-save
node test/smoke.js     # loading -> select -> fight
node test/ults.js      # every character, every ult, KO + meter rules
node test/shots.js     # writes PNG frames to shots/
node test/shots2.js    # ult frames
```
