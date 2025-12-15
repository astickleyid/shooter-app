# Copilot Instructions for VOID RIFT

## Project Overview

VOID RIFT is a browser-based twin-stick shooter built with vanilla HTML, CSS, and JavaScript. The game runs entirely in the browser with no build step required for the frontend.

## Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES2022)
- **Backend API**: Vercel Serverless Functions
- **Database**: Vercel KV (Redis)
- **Testing**: Jest 30.x with jsdom
- **Linting**: ESLint ^8.57.0
- **Node.js**: 14.0.0+
- **Python**: 3.x (for development server)

## Key Commands

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Run tests
npx jest

# Run tests with coverage
npx jest --coverage

# Start local development server
npm start
```

## Project Structure

```
shooter-app/
├── src/               # Modular source code
│   ├── core/          # Configuration and constants
│   ├── entities/      # Game entity classes
│   ├── systems/       # Game systems (Save, Auth, Input, etc.)
│   └── utils/         # Utility functions
├── api/               # Serverless API endpoints (Vercel)
├── docs/              # Architecture documentation
├── index.html         # Main HTML document
├── style.css          # UI styling and layout
├── script.js          # Main game logic
├── *.test.js          # Jest test files
└── package.json       # Project configuration
```

## Code Style Guidelines

- Use `const` and `let` instead of `var`
- Use consistent indentation (2 spaces)
- Add JSDoc comments for complex functions
- Keep functions small and focused
- Use meaningful variable names
- Avoid `console.log` (use `console.warn` or `console.error` for errors)
- Follow the ESLint configuration in `.eslintrc.json`

## Testing

- Test files use the pattern `*.test.js`
- Tests are written using Jest
- Run `npx jest` before submitting changes
- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices or emulators for touch controls

## Commit Message Guidelines

Follow conventional commits format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Git Workflow

1. Create a new branch for your feature: `git checkout -b feature/your-feature-name`
2. Make changes and test thoroughly
3. Lint your code: `npm run lint:fix`
4. Commit with a clear message following conventional commits
5. Push your branch and create a pull request

## Files to Avoid Modifying

- `package-lock.json` (auto-generated)
- Files in `node_modules/` (dependencies)
- `.git/` directory
- `vercel.json` (deployment configuration)
- Files in `api/` directory (unless specifically working on backend)

## Security Considerations

- Never store passwords in plaintext
- Sanitize user inputs
- Use Web Crypto API for cryptographic operations
- Do not commit secrets or API keys
- Use SHA-256 for password hashing via `src/utils/crypto.js`

## Browser Compatibility

The game targets modern browsers (Chrome, Firefox, Safari, Edge). Ensure changes maintain compatibility with ES2022 features as configured in `.eslintrc.json`.

## API and Backend Structure

The backend uses Vercel Serverless Functions located in the `api/` directory:

- **api/leaderboard.js** - Global leaderboard endpoints (GET/POST scores)
- **api/users.js** - User authentication and profile management
- **api/friends.js** - Social features and friend management
- **api/activity.js** - Activity feed and game events
- **api/redis-client.js** - Shared Redis/Vercel KV client

### Backend Guidelines

- All API endpoints use Vercel KV (Redis) for data storage
- CORS is configured in `vercel.json` to allow cross-origin requests
- Password hashing uses SHA-256 via `src/utils/crypto.js`
- Always validate inputs server-side in API endpoints
- Keep API functions stateless and idempotent when possible

## Deployment Workflow

### Frontend Deployment
- The game can be deployed to any static host (GitHub Pages, Netlify, Vercel)
- No build step required - HTML, CSS, and JS files are used directly
- Simply copy `index.html`, `script.js`, `style.css`, and related assets

### Backend Deployment
- Uses Vercel for serverless functions
- Deploy with: `./deploy.sh` or `vercel --prod`
- After deployment, update `API_URL` in `backend-api.js` with your Vercel deployment URL
- Environment variables (if needed) go in Vercel dashboard or `.env.local`

## Module-Specific Guidance

### Core Modules (`src/core/`)
- **config.js** - Game constants, difficulty settings, ship configs, armory items
- Modify for balance changes, new weapons, or ship types
- All numeric values should be well-documented

### Entity Modules (`src/entities/`)
- **Bullet.js** - Bullet projectile behavior
- **Asteroid.js** - Asteroid obstacle behavior
- Follow existing class patterns when adding new entities
- Implement `update()` and `render()` methods consistently

### System Modules (`src/systems/`)
- **SaveSystem.js** - localStorage save/load (key: `void_rift_v11`)
- **AuthSystem.js** - User authentication flows
- **LeaderboardSystem.js** - Score tracking and leaderboard
- **InputManager.js** - Unified keyboard/gamepad/touch input
- **ParticleSystem.js** - Visual effects and particles
- **GameState.js** - Runtime state management

### Utility Modules (`src/utils/`)
- **math.js** - Math helpers (clamp, distance, collision detection)
- **crypto.js** - Password hashing using Web Crypto API
- **validation.js** - Input validation and sanitization

## Common Pitfalls and Troubleshooting

### localStorage Issues
- The save system uses key `void_rift_v11` in localStorage
- Clearing browser data will reset all progress
- Always validate saved data structure before using it
- Handle missing or corrupted save data gracefully

### Browser-Specific Issues
- Safari has stricter autoplay policies for audio
- Firefox requires explicit user gesture for fullscreen
- Mobile browsers may have different touch event handling
- Test gamepad support across different browsers

### Performance Considerations
- The game targets 60 FPS
- Monitor particle counts to avoid performance degradation
- Use object pooling for frequently created/destroyed objects
- Minimize DOM operations during game loop

### Input Handling
- Touch controls are active on mobile devices
- Gamepad support auto-detects connected controllers
- Mouse and keyboard are primary on desktop
- All input goes through `InputManager.js` for consistency

## Testing Workflow

### Running Tests
```bash
# Run all tests
npx jest

# Run specific test file
npx jest game-utils.test.js

# Run tests in watch mode
npx jest --watch

# Run with coverage report
npx jest --coverage
```

### Test Files
- **game-utils.test.js** - Utility function tests (math, collision, etc.)
- **game-config.test.js** - Configuration validation tests
- **save-system.test.js** - Save/load functionality tests

### Writing Tests
- Use Jest with jsdom environment (configured in `jest.config.js`)
- Mock localStorage for save system tests
- Test edge cases and error conditions
- Keep tests focused and independent
- Follow existing test patterns in the codebase

## Development Server

Start the local development server:
```bash
npm start
# or
python3 -m http.server 5173
```

The game will be available at `http://localhost:5173`

## Environment and Browser Specifics

### Local Development
- Requires a local server (file:// protocol has limitations)
- Use `npm start` or Python's http.server
- Hot reload not available - refresh browser after changes

### Browser Features Used
- Canvas API for rendering
- Web Audio API for sound
- localStorage for persistence
- Gamepad API for controller support
- Touch Events API for mobile
- Fullscreen API for immersive mode
- Web Crypto API for password hashing

### Browser Console
- Avoid `console.log` in production code
- Use `console.warn` for warnings
- Use `console.error` for errors
- ESLint will flag improper console usage
