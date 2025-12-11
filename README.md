# VOID RIFT

VOID RIFT is a browser-based twin-stick shooter built entirely with vanilla HTML, CSS, and JavaScript. The repo contains everything you need to play locally or deploy to a static host (e.g., GitHub Pages, Netlify).

## Quick Start

### For Players

- Option 1 – double-click `index.html` to open it in your browser.
- Option 2 – run a lightweight static server (recommended for consistent audio/input):
  ```bash
  # Python 3
  python3 -m http.server 5173
  # or Node.js
  npx http-server -p 5173
  ```
  Then visit [http://localhost:5173](http://localhost:5173).

### For Developers

1. Install Node.js 14+ (for development tools)
2. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/astickleyid/shooter-app.git
   cd shooter-app
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Run linting:
   ```bash
   npm run lint
   ```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development guidelines.

## Deploying

### Game Files (Frontend)
- **GitHub Pages:** push the repo to a branch called `gh-pages` or enable Pages via the GitHub UI and point it to the root. No build step is required.
- **Any static host** will work: upload `index.html`, `script.js`, `style.css`, and `backend-api.js`.

### Global Leaderboard (Backend)
The game now supports a **global leaderboard** visible to all players! To enable it:

1. Deploy the serverless API to Vercel (free):
   ```bash
   ./deploy.sh
   ```
   Or manually: `vercel --prod`

2. Update the API URL in `backend-api.js` with your deployment URL

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed instructions.

**Note:** The leaderboard falls back to local-only mode if the backend is unavailable.

## Controls

- **Keyboard:** `WASD` / arrow keys to move, mouse to aim/shoot, `Space` to boost, `P` to pause.
- **Gamepad / Touch:** twin-stick controls and a dedicated boost button are enabled on mobile.
- **Secondary / Defense / Ultimates:** `Shift` or `E` (or right-click) launches bombs, `F` deploys your defense system, `R` fires the charged ultimate. Mobile has dedicated buttons next to the shoot stick.
- **Display Controls:** Press `G` to toggle FPS counter, `F` (when not in-game) to toggle fullscreen mode.

## Ship Customization

- Visit the `Ship Hangar` from the start screen (or via the in-game shop) to equip one of the starter hull templates—Vanguard Mk.I, Phantom-X, Bulwark-7, or Emberwing. Each frame alters visuals and core stats like speed, armor, magazine capacity, and fire cadence. Your choice is saved automatically in `localStorage`.

## Weapons & Abilities

- The hangar now includes an armory: unlock and equip primary weapons (rail lances, scatter coils, ion arrays), secondary ordnance, defense systems, and ultimates.
- Ultimate charge builds as you deal damage and collect supplies; watch the new meter in the HUD and unleash devastating attacks when full.
- Supply crates occasionally drop from enemies, restocking ammo, secondary charges, or accelerating shield cooldowns.

## Project Structure

The project has been refactored into a modular architecture for better maintainability:

```
shooter-app/
├── src/               # Modular source code
│   ├── core/          # Configuration and constants
│   ├── entities/      # Game entity classes
│   ├── systems/       # Game systems (Save, Auth, Input, etc.)
│   └── utils/         # Utility functions
├── docs/              # Architecture documentation
├── index.html         # Root HTML document
├── style.css          # UI styling and layout
├── script.js          # Main game logic
└── package.json       # Project configuration
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed documentation.

## Browser Persistence

Progress (credits, upgrades, best score) is saved in `localStorage` under the key `void_rift_v11`. Clearing browser storage resets progress.

## Testing

The project uses [Jest](https://jestjs.io/) for testing. To run tests:

```bash
npm install
npm test
```

Test suites include:
- **game-utils.test.js** – Tests for utility functions (clamp, rand, chance, distance, collision detection)
- **game-config.test.js** – Tests for game configuration and balance
- **save-system.test.js** – Tests for save/load functionality and data persistence

To run tests with coverage:
```bash
npm test -- --coverage
```
## Recent Features

Game features:
- **Fullscreen Mode**: Toggle with `F` key (outside of gameplay) or via the settings menu for an immersive experience
- **FPS Counter**: Monitor performance with `G` key toggle or settings menu - displays in real-time with color coding (green = 55+ fps, yellow = 30-54 fps, red = <30 fps)
- **Enhanced Robustness**: Improved error handling, save game validation, and automatic pause when tab loses focus
- **Performance Monitoring**: Built-in frame rate tracking for smooth gameplay optimization

Development improvements:
- **Modular Architecture**: Refactored into maintainable, reusable modules
- **Secure Authentication**: Password hashing using Web Crypto API (SHA-256)
- **Enhanced Validation**: Comprehensive input validation and data sanitization
- **Code Quality**: ESLint passing with zero errors, comprehensive JSDoc comments
- **Better Browser Support**: Enhanced meta tags for mobile and PWA compatibility
- **Development Documentation**: Architecture docs and contributing guidelines
- **iOS App & CI/CD**: Complete iOS app with automated builds via GitHub Actions

## iOS App

The game is available as a native iOS app with automated builds:

- **Location**: `ios/` directory
- **Features**: Portrait/landscape support, interactive tutorial, touch controls
- **Automated Builds**: GitHub Actions workflow builds iOS app on every push
- **Latest Content**: Auto-syncs with Vercel deployment
- **Quick Sync**: Run `./sync-ios-content.sh` to update iOS bundle locally

See [IOS_BUILD_GUIDE.md](IOS_BUILD_GUIDE.md) and [ios/README.md](ios/README.md) for details.

## Contributing / Next Steps

Open an issue or reach out with features you'd like to see. Some ideas:

- New enemy types, bosses, or wave modifiers.
- Additional environments or parallax layers.
- Expanded upgrade trees and weapon variants.
- Audio design pass (music / SFX toggle, volume sliders).
- Performance profiling and touch-control refinements.
