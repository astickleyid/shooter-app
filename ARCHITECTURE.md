# VOID RIFT - Architecture Overview

## Table of Contents
1. [Project Structure](#project-structure)
2. [Module System](#module-system)
3. [Code Organization](#code-organization)
4. [Security Architecture](#security-architecture)
5. [Testing Strategy](#testing-strategy)
6. [Build & Deployment](#build--deployment)

## Project Structure

```
shooter-app/
├── src/                      # Modular source code (ES6 modules)
│   ├── core/                 # Game configuration and constants
│   ├── entities/             # Game entities (Bullet, Asteroid, etc.)
│   ├── systems/              # Game systems (Auth, Save, Missions, etc.)
│   └── utils/                # Utility functions (math, crypto, validation)
├── api/                      # Vercel serverless API endpoints
├── ios/                      # iOS app (WKWebView wrapper)
│   └── VoidRift/WebContent/  # Game files bundled in iOS app
├── assets/                   # Game assets (images, sounds, etc.)
├── *.js                      # Root-level game files (monolithic for browser)
├── *.test.js                 # Jest test files
└── docs/                     # Documentation
```

## Module System

### Dual Module Strategy

VOID RIFT uses a **dual module system** to support both browser and Node.js environments:

1. **Root Files (Browser-First)**: `script.js`, `game-utils.js`, etc.
   - Use **CommonJS** pattern (`module.exports`) with browser fallbacks
   - Self-contained, no build step required
   - Loaded directly in `index.html`
   - Optimized for browser execution

2. **`src/` Directory (Modern ES6)**: All files under `src/`
   - Use **ES6 modules** (`export`/`import`)
   - Better for testing and modular development
   - Synced to iOS app
   - Future-proof for build tools

3. **`api/` Directory (Node.js)**: Serverless functions
   - Use **CommonJS** (`require`/`module.exports`)
   - Run in Node.js environment on Vercel
   - Have access to Node.js APIs (fs, os, crypto)

### Why Two Module Systems?

- **Browser Compatibility**: Root files work without transpilation
- **Testing**: ES6 modules are easier to test with Jest
- **iOS**: Native app uses the same HTML/JS files
- **Backward Compatibility**: Gradual migration to ES6

## Code Organization

### Game Logic (`script.js`)

The main game logic is intentionally **monolithic** in `script.js` for:
- Single file download = faster initial load
- No build step required for development
- Self-contained browser execution
- Easier debugging (single source)

### Modular Systems (`src/`)

Modern systems are modularized under `src/`:
- **MissionSystem**: Daily missions and challenges
- **TechFragmentSystem**: Collectibles and rewards
- **AuthSystem**: User authentication
- **SaveSystem**: Local storage persistence
- **LeaderboardSystem**: Global leaderboards

### API Endpoints (`api/`)

Serverless functions for backend features:
- `leaderboard.js` - Global leaderboard with anti-cheat
- `users.js` - User registration and profiles
- `friends.js` - Social features
- `activity.js` - Activity feeds

## Security Architecture

### Password Security

**Current Implementation**:
- **PBKDF2** with 100,000 iterations (as of Phase 2)
- SHA-256 as the hash algorithm
- Username-based salt

**Upgrade Path**:
- Backend should use **bcrypt** or **argon2** (not available in browser)
- Client sends pre-hashed password to backend
- Backend re-hashes with stronger algorithm

### XSS Prevention

**Implemented Protections**:
1. `escapeHtml()` - Escapes all HTML special characters
2. `sanitizeHtml()` - Sanitizes while preserving newlines as `<br>`
3. Input validation for all user-provided data

**Usage**:
```javascript
import { escapeHtml, sanitizeHtml } from './src/utils/validation.js';

// For plain text
element.textContent = userInput; // Preferred

// For HTML with formatting
element.innerHTML = sanitizeHtml(userInput); // Safe
```

### Input Validation

**Rules**:
- Username: 3-20 chars, alphanumeric + underscore/dash
- Password: 8-100 chars (increased from 4 in Phase 2)
- Score: Positive number, ≤ MAX_SCORE
- Level: Integer, 1-10,000

### Rate Limiting

**Client-Side**:
- Prevents spam requests
- Local rate limit tracking

**Server-Side** (`api/leaderboard.js`):
- Authenticated: 5 submissions/minute
- Anonymous: 2 submissions/minute
- IP-based tracking with `rateLimitCache`

## Testing Strategy

### Test Coverage

**Current Coverage**: ~70% overall
- **Well-tested**: MissionSystem (95%), TechFragmentSystem (90%), validation (100%)
- **Needs tests**: script.js (main game), audio-manager.js, social-*.js

### Test Types

1. **Unit Tests**: Individual functions (math utils, validation)
2. **System Tests**: Game systems (missions, tech fragments)
3. **Integration Tests**: API endpoints (leaderboard security)

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- mission-system.test.js

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Patterns

**CommonJS for Tests**:
```javascript
const { validatePassword } = require('./src/utils/validation.js');

describe('Password Validation', () => {
  test('rejects short passwords', () => {
    expect(validatePassword('short').valid).toBe(false);
  });
});
```

**Mocking External Dependencies**:
```javascript
// Create __mocks__/@vercel/kv.js for module mocks
jest.mock('@vercel/kv');
```

## Build & Deployment

### iOS Build

**Sync Process**:
```bash
./sync-ios-content.sh  # Syncs web files to iOS bundle
```

**What Gets Synced**:
- `index.html`, `script.js`, `style.css`
- `src/` directory (all systems)
- `assets/` directory
- Supporting JS files

**iOS-Specific**:
- WKWebView loads via `file://` protocol
- No network required for core game
- Native Swift overlays for tutorial
- Touch controls are primary input

### Web Deployment

**Vercel**:
```bash
./deploy.sh  # Deploys to Vercel
```

**What Gets Deployed**:
- Static files (HTML, CSS, JS)
- API endpoints in `api/` directory
- Vercel KV for backend storage

**Environment**:
- Node.js 16+ (as of Phase 2)
- Serverless functions for API
- Redis-compatible KV store

## Code Duplication (Intentional)

### Why Duplicate Utilities?

**`script.js` vs `src/utils/math.js`**:
- `script.js`: Self-contained for browser
- `src/utils/math.js`: Modular for testing and iOS
- Both serve different purposes

**`game-utils.js`**:
- Extracted from `script.js` for testing
- Allows Jest to test utility functions
- Uses CommonJS for Node.js compatibility

### When to Deduplicate?

Only if:
1. Moving to a build system (webpack, rollup)
2. Eliminating `script.js` monolith
3. All browsers support ES6 modules natively

For now, duplication is **acceptable** for the benefits of:
- No build step
- Browser compatibility
- Testability

## File Organization Best Practices

### Current Layout

**Root Level** (40+ files):
- `script.js` - Main game (430KB, intentionally large)
- `index.html` - Entry point
- `*.test.js` - Test files
- `*.md` - Documentation
- Config files (`.eslintrc.json`, `jest.config.js`, etc.)

**Recommended Future Layout**:
```
src/
  core/
  entities/
  systems/
  utils/
  main.js
test/
  unit/
  integration/
docs/
  architecture/
  api/
  guides/
```

### Migration Path

**Phase 1** (Current): Dual system
**Phase 2** (Future): Build system + full ES6
**Phase 3** (Long-term): TypeScript migration

## Performance Optimizations

### Current Optimizations

1. **Object Pooling**: Bullets, particles, asteroids
2. **Canvas Optimization**: Minimize draw calls
3. **RAF**: RequestAnimationFrame for game loop

### Needed Optimizations

1. **Power Level Caching**: Cache calculations per frame
2. **Lazy Loading**: Defer non-critical resources
3. **WebWorkers**: Offload heavy calculations

## Common Issues & Solutions

### Issue: Tests can't find ES6 modules
**Solution**: Tests use CommonJS, modules support both via conditional exports

### Issue: iOS files out of sync
**Solution**: Run `./sync-ios-content.sh` after changes

### Issue: @vercel/kv not found
**Solution**: Manual mock in `__mocks__/@vercel/kv.js`

### Issue: ESLint errors in API files
**Solution**: `.eslintrc.json` has overrides for `api/**` with Node.js env

## Contributing Guidelines

See `CONTRIBUTING.md` for:
- Code style
- Commit message format
- PR process
- Testing requirements

---

**Last Updated**: 2026-02-14 (Phase 2 Complete)
**Version**: 1.0.0
**Maintainer**: VOID RIFT Team
