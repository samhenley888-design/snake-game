# Snake

A polished single-player browser Snake mini game. Classic gameplay with a clean modern UI — no build step required.

## Play locally

**Option A — open the file**

1. Clone or download this repo.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).

**Option B — local static server**

```bash
cd snake-game
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## How to play

- **Move:** Arrow keys or **WASD**
- **Eat** the glowing yellow orbs to grow and raise your score
- **Avoid** walls and your own body — hitting either ends the game
- **Restart:** press **Space** or **R**, or click the on-screen button

Your best score is saved in the browser (`localStorage`).

## Files

- `index.html` — page structure
- `style.css` — modern layout, typography, and glow effects
- `game.js` — game loop, controls, collision, and rendering
