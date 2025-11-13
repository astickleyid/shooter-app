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

### GitHub Pages (Automated)

This repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages:

1. **Enable GitHub Pages in your repository settings:**
   - Go to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
2. **Push to the `main` branch** to trigger automatic deployment
3. **Access your game** at `https://<username>.github.io/<repository-name>/`

The workflow runs automatically on every push to `main` and can also be triggered manually from the Actions tab.

### Other Static Hosts

Any static host will work: upload `index.html`, `script.js`, and `style.css` to services like Netlify, Vercel, or Cloudflare Pages.

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

- `index.html` – root HTML document and UI skeleton.
- `style.css` – UI styling and layout.
- `script.js` – game logic, rendering, UI interactions, and persistence.

## Browser Persistence

Progress (credits, upgrades, best score) is saved in `localStorage` under the key `void_rift_v11`. Clearing browser storage resets progress.

## Contributing / Next Steps

Open an issue or reach out with features you'd like to see. Some ideas:

- New enemy types, bosses, or wave modifiers.
- Additional environments or parallax layers.
- Expanded upgrade trees and weapon variants.
- Audio design pass (music / SFX toggle, volume sliders).
- Performance profiling and touch-control refinements.
