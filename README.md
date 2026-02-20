# Dreamlight

A Phaser 3 action survival game inspired by Vampire Survivors. Fight endless waves of enemies, collect XP gems, level up, and choose powerful upgrades to survive as long as possible.

## Gameplay

- You control a warrior who auto-attacks nearby enemies.
- Enemies spawn in waves with increasing difficulty.
- Defeating enemies drops XP gems — collect them to level up.
- Each level-up lets you choose from random power-ups:
  - **Swift Strike** — Faster attack speed
  - **Sharp Blade** — Increased damage
  - **Wind Walk** — Faster movement speed
  - **Iron Body** — More max HP
  - **Regeneration** — HP recovery over time
  - **Fire Aura** — Flames orbit around you and burn nearby enemies
  - **Chain Blast** — Enemies explode on death, damaging nearby foes
  - **Long Reach** — Bigger attack range
  - **XP Magnet** — Wider XP pickup radius
- Survive as long as you can. Gold earned carries across runs.

## Controls

| Input | Action |
|-------|--------|
| `W` / `↑` | Move up |
| `S` / `↓` | Move down |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `SPACE` | Restart (on game over) |

## Run Locally

### Option 1: Python (recommended)

```bash
cd Lightstream
python -m http.server 8080
```

Open `http://localhost:8080` in your browser.

### Option 2: Node.js

```bash
npx serve .
```

Open the URL shown in the terminal.

### Option 3: VS Code Live Server

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
2. Right-click `index.html` → **Open with Live Server**.

> **Note:** You must use a local server. Opening `index.html` directly as a file will not work due to browser CORS restrictions on ES modules.

## Tech Stack

- **Phaser 3.87.0** (loaded via CDN)
- Vanilla JavaScript (ES modules)
- No build tools required

## Project Structure

```
Dreamlight/
├── index.html              # Entry point
├── src/
│   ├── main.js             # Phaser config & scene registration
│   ├── assets.js           # Asset loading definitions
│   ├── animation.js        # Sprite animation definitions
│   ├── scenes/
│   │   ├── Boot.js         # Initial boot scene
│   │   ├── Preloader.js    # Asset preloader
│   │   ├── Game.js         # Main game scene
│   │   ├── GameOver.js     # Game over screen
│   │   └── LevelUp.js      # Level-up power-up selection
│   └── gameObjects/
│       ├── Player.js       # Player character
│       ├── Enemy.js        # Enemy base class
│       ├── DamageText.js   # Floating damage numbers
│       └── XPGem.js        # XP pickup items
├── assets                  # Sprites and images
└── README.md
```

## License

MIT