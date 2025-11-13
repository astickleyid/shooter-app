# VOID RIFT

VOID RIFT is a browser-based twin-stick shooter built entirely with vanilla HTML, CSS, and JavaScript. The repo contains everything you need to play locally or deploy to a static host (e.g., GitHub Pages, Netlify).

## Quick Start

- Option 1 – double-click `index.html` to open it in your browser.
- Option 2 – run a lightweight static server (recommended for consistent audio/input):
  ```bash
  # Python 3
  python3 -m http.server 5173
  # or Node.js
  npx http-server -p 5173
  ```
  Then visit [http://localhost:5173](http://localhost:5173).

## Deploying

- GitHub Pages: push the repo to a branch called `gh-pages` or enable Pages via the GitHub UI and point it to the root. No build step is required.
- Any static host will work: upload `index.html`, `script.js`, `style.css`, and the entire `src/` directory with all module files.

## Controls

- **Keyboard:** `WASD` / arrow keys to move, mouse to aim/shoot, `Space` to boost, `P` to pause.
- **Gamepad / Touch:** twin-stick controls and a dedicated boost button are enabled on mobile.
- **Secondary / Defense / Ultimates:** `Shift` or `E` (or right-click) launches bombs, `F` deploys your defense system, `R` fires the charged ultimate. Mobile has dedicated buttons next to the shoot stick.

## Ship Customization

- Visit the `Ship Hangar` from the start screen (or via the in-game shop) to equip one of the starter hull templates—Vanguard Mk.I, Phantom-X, Bulwark-7, or Emberwing. Each frame alters visuals and core stats like speed, armor, magazine capacity, and fire cadence. Your choice is saved automatically in `localStorage`.

## Weapons & Abilities

- The hangar now includes an armory: unlock and equip primary weapons (rail lances, scatter coils, ion arrays), secondary ordnance, defense systems, and ultimates.
- Ultimate charge builds as you deal damage and collect supplies; watch the new meter in the HUD and unleash devastating attacks when full.
- Supply crates occasionally drop from enemies, restocking ammo, secondary charges, or accelerating shield cooldowns.

## Project Structure

The game uses a modular architecture for better maintainability:

- `index.html` – root HTML document and UI skeleton.
- `style.css` – UI styling and layout.
- `script.js` – main game orchestration, UI management, and persistence.
- `src/` – modular game components:
  - `player.js` – PlayerEntity class, ship rendering, controls, and abilities.
  - `enemy.js` – Enemy class, spawner system, and AI pathfinding.
  - `projectile.js` – Bullet management and projectile physics.
  - `obstacles.js` – Obstacle generation and asteroid rendering.
  - `collectibles.js` – Coin system, supply drops, and pickup mechanics.

## Browser Persistence

Progress (credits, upgrades, best score) is saved in `localStorage` under the key `void_rift_v11`. Clearing browser storage resets progress.

## Contributing / Next Steps

Open an issue or reach out with features you'd like to see. Some ideas:

- New enemy types, bosses, or wave modifiers.
- Additional environments or parallax layers.
- Expanded upgrade trees and weapon variants.
- Audio design pass (music / SFX toggle, volume sliders).
- Performance profiling and touch-control refinements.
