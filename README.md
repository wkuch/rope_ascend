## Rope Ascend

A minimalist 2D physics platformer inspired by Worms Armageddon's iconic Ninja Rope, built around the pure joy of a grappling rope. Swing, shorten/lengthen the rope, and chain momentum to climb an endless, procedurally generated chasm while a hazard rises from below. Aim to reach your personal best height.

### Demo/Quick Start
- Open `index.html` in a modern desktop browser; no build step required.
- If your browser blocks local file access for assets, serve the folder with a static server:
  - Python: `python3 -m http.server 8000` then visit `http://localhost:8000`
  - Node (serve): `npx serve -p 8000` then visit `http://localhost:8000`

### Controls
- **LMB (hold)**: Fire and hold rope; release to detach
- **W**: Shorten rope
- **S**: Lengthen rope
- **A / D**: Apply swing force (clockwise / counterclockwise)
- **Menu**: SPACE or ENTER to start
- **Game Over**: R or SPACE to restart; M or ESC to return to menu
- **Logging**: Press **L** during play to download a recent gameplay log (`rope_log_*.json`)

### Features
- **Focused core loop**: Shoot, latch, swing, release, repeat
- **Matter.js physics** with rope constraint and swing forces
- **Procedural infinite chasm** with sparse, strategic platforms and optional ceilings
- **Rising hazard** that constantly pressures upward movement
- **Score and high score** stored locally via `localStorage`
- **Pixel-art rendering** with simple sprites and procedural textures on platforms
- **In-game debug overlay** with state, rope, streaming, and hazard info

### Tech Stack
- **Language**: Vanilla JavaScript (ES5/ES6)
- **Rendering**: HTML5 Canvas
- **Physics**: `matter-js@0.19.0` (via CDN)
- **No build tooling**: Single `index.html` entrypoint with `<script>` tags

### Project Structure
```
assets/        # Sprites (player, kunai, obstacle tiles)
css/           # Styles for centered layout and canvas
docu/Readme.md # Game design document (concept and mechanics)
js/            # Game modules (input, physics, rope, world, etc.)
index.html     # Entry point (loads matter.js and game modules)
```

Key modules:
- `js/main.js` — Game loop, state orchestration, module wiring
- `js/input.js` — Mouse/keyboard input manager
- `js/physics.js` — Matter.Engine setup and world helpers
- `js/player.js` — Player body and state
- `js/rope.js` — Rope attach/detach, length control (W/S), swing forces (A/D), pivot handling
- `js/world.js` — Procedural world generation, chunk streaming, platforms/ceilings/walls
- `js/hazard.js` — Rising hazard logic and visuals
- `js/scoring.js` — Height-based scoring, high score persistence
- `js/camera.js` — Upward-following camera with threshold
- `js/renderer.js` — All draw calls, sprites, rope rendering, UI and debug overlay
- `js/logger.js` — Rolling gameplay log and JSON download on `L`

### How to Play
1. Click the canvas once to ensure it has focus
2. Press SPACE/ENTER to start
3. Aim with the mouse and hold LMB to fire/hold the rope
4. Use A/D to pump the swing; use W/S to shorten/lengthen the rope
5. Release LMB at the apex to launch; reattach quickly to chain swings
6. Avoid the rising hazard and climb as high as you can

### Tuning and Configuration (for tinkerers)
- Rope max range: `maxRange` in `js/rope.js`
- Rope length change rate: `lengthChangeRate` in `js/rope.js`
- Swing force: `swingForce` in `js/rope.js`
- Hazard speed: `riseSpeed` in `js/hazard.js` (or call `setRiseSpeed()` at runtime)
- World generation density/spacing: see `generatePlatforms` and related helpers in `js/world.js`
- Chunk size: `chunkWidth`, `chunkHeight` in `js/world.js`

### Troubleshooting
- Nothing happens on keypress: click the canvas to focus it
- Sprites not visible: ensure `assets/` is present and served; check browser console for 404s
- CDN blocked/offline: replace the Matter.js CDN in `index.html` with a local copy
- High score not saving: confirm `localStorage` is enabled in your browser/profile

### Development Notes
- The design document lives in `docu/Readme.md` and outlines the vision, loop, and controls
- Logs: press `L` in-game to download a recent rolling log of inputs, rope state, and nearby geometry
- The renderer uses cached procedural textures for platforms/ceilings to reduce draw overhead

### Contributing
Issues and pull requests are welcome. For larger changes, please open an issue first to discuss scope.

### Acknowledgements
- Inspired by the Ninja Rope from Worms Armageddon
- Physics powered by Matter.js

