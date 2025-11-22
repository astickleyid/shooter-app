# VOID RIFT Architecture Documentation

## Overview

VOID RIFT has been refactored from a single monolithic JavaScript file (~4300 lines) into a modular, maintainable architecture suitable for continued development and potential iOS mobile integration.

## Directory Structure

```
shooter-app/
├── src/
│   ├── core/           # Core game configuration
│   │   └── config.js   # Constants, difficulty, ships, armory
│   ├── entities/       # Game entity classes
│   │   ├── Bullet.js   # Bullet projectiles
│   │   └── Asteroid.js # Asteroid obstacles
│   ├── systems/        # Game systems
│   │   ├── SaveSystem.js        # Save/load to localStorage
│   │   ├── AuthSystem.js        # User authentication
│   │   ├── LeaderboardSystem.js # High score management
│   │   ├── InputManager.js      # Unified input handling
│   │   ├── ParticleSystem.js    # Visual effects
│   │   └── GameState.js         # Runtime state management
│   └── utils/          # Utility functions
│       ├── math.js      # Math utilities
│       ├── crypto.js    # Password hashing
│       └── validation.js # Input validation
├── docs/               # Documentation
├── index.html          # Main HTML
├── style.css           # Styling
├── script.js           # Main game logic
└── package.json        # Dependencies
```

## Key Benefits

### Modularity & Maintainability
- Clear separation of concerns
- Easy code location
- Smaller, focused files
- Better version control

### Robustness
- Comprehensive validation
- Error handling
- Data sanitization
- Type safety via JSDoc

### Security
- SHA-256 password hashing
- Input validation
- No plaintext passwords
- XSS prevention

### iOS Ready
- Clean APIs
- ES6 modules
- Touch optimized
- Offline capable
- Performance focused

## Next Steps

1. Extract remaining entities (Player, Enemy, Coin, etc.)
2. Create RenderingEngine module
3. Create AudioSystem module
4. Add unit tests
5. Add module bundler
6. iOS app wrapper preparation

## Getting Started

1. Review JSDoc comments in modules
2. Read CONTRIBUTING.md
3. Make changes to specific modules
4. Run `npm run lint` before committing

See inline documentation for detailed API information.
