# VOID RIFT

VOID RIFT is a browser-based twin-stick shooter built entirely with vanilla HTML, CSS, and JavaScript. The repo contains everything you need to play locally or deploy to a static host (e.g., GitHub Pages, Netlify).

**Current Version: 2.0**

## What's New in Version 2.0

### 🔐 Optional Account Sign-In
- Create an account or sign in to save your progress to the cloud
- All data syncs automatically across devices
- Continue as guest to play offline with local storage only

### 🏆 Global Leaderboard
- Compete with players worldwide on the all-time leaderboard
- Real-time rank updates as you play
- Top 10 scores displayed on the start screen

### 📊 System Status Indicator
- Live system status showing online/offline mode
- Version badge displaying current game version
- Visual indicators for cloud connectivity

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
- Any static host will work: upload `index.html`, `script.js`, and `style.css`.

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

**With Account Sign-In (New in v2.0):**
- Data is automatically synced to Firebase Cloud Firestore
- Access your progress from any device
- Compete on the global leaderboard
- Automatic backup of all game data

**Without Account (Guest Mode):**
- Progress saved locally in browser storage only
- No cloud sync or leaderboard access
- Works completely offline

## Firebase Setup (Optional for Cloud Features)

To enable cloud features, you'll need to set up Firebase:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Enable Cloud Firestore
4. Update the Firebase config in `script.js` with your project credentials:
   ```javascript
   const FIREBASE_CONFIG = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... other config
   };
   ```

The game works perfectly without Firebase - all cloud features gracefully degrade to offline mode.

## Contributing / Next Steps

Open an issue or reach out with features you'd like to see. Some ideas:

- New enemy types, bosses, or wave modifiers.
- Additional environments or parallax layers.
- Expanded upgrade trees and weapon variants.
- Audio design pass (music / SFX toggle, volume sliders).
- Performance profiling and touch-control refinements.
