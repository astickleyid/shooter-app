# Copilot Instructions for VOID RIFT

> These instructions guide GitHub Copilot in understanding the project structure, coding conventions, and development workflows for VOID RIFT. They are optimized for the coding agent to provide relevant assistance.

## Quick Start

Before contributing, ensure you have:
- **Node.js**: 14.0.0+ installed
- **Python 3**: For local development server
- **Xcode 14+**: For iOS development (macOS only)

Setup steps:
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm test` to verify setup
4. Run `npm start` to start local development server

## Project Overview

VOID RIFT is a **mobile-first iOS twin-stick shooter** built with vanilla HTML, CSS, and JavaScript running in a native iOS WKWebView wrapper. The project prioritizes iOS/mobile optimization and performance, with the Vercel web deployment serving primarily as a development and testing platform.

### Platform Priority
1. **Primary Platform**: iOS mobile app (in `ios/` directory)
2. **Development/Testing**: Browser-based version via Vercel deployment
3. **Focus**: Mobile-first design, touch controls, performance optimization for mobile devices

## Technology Stack

### iOS App (Primary Platform)
- **Platform**: iOS 14.0+
- **Language**: Swift 5
- **UI**: WKWebView with native Swift overlays
- **Game Engine**: Vanilla HTML5, CSS3, JavaScript (ES2022)
- **Orientation**: Portrait and Landscape support
- **Features**: Interactive tutorial, custom icons, offline-capable

### Web/Development Platform
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES2022)
- **Backend API**: Vercel Serverless Functions (for testing)
- **Database**: Vercel KV (Redis)
- **Testing**: Jest 30.x with jsdom
- **Linting**: ESLint ^8.57.0
- **Node.js**: 14.0.0+
- **Python**: 3.x (for local development server)

## Key Commands

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Start local development server
npm start
```

## Project Structure

```
shooter-app/
├── ios/                          # 🎯 PRIMARY: iOS App Project
│   ├── VoidRift.xcodeproj/      # Xcode project
│   ├── VoidRift/
│   │   ├── Native/               # Swift native code
│   │   │   ├── GameViewController.swift   # Main controller
│   │   │   ├── GameBridge.swift          # JS-to-Swift bridge
│   │   │   ├── TutorialOverlay.swift     # Tutorial system
│   │   │   └── OrientationManager.swift  # Layout handler
│   │   ├── WebContent/           # Game files embedded in app
│   │   │   ├── index.html
│   │   │   ├── script.js
│   │   │   ├── style.css
│   │   │   └── assets/
│   │   ├── Assets.xcassets/      # iOS icons and assets
│   │   └── Supporting/           # Info.plist, etc.
│   └── README.md                 # iOS build instructions
├── src/                          # Modular game source code
│   ├── core/                     # Configuration and constants
│   ├── entities/                 # Game entity classes
│   ├── systems/                  # Game systems (Save, Auth, Input, etc.)
│   └── utils/                    # Utility functions
├── api/                          # Serverless API endpoints (Vercel - for testing)
├── docs/                         # Architecture documentation
├── index.html                    # Web version (synced to ios/VoidRift/WebContent/)
├── style.css                     # UI styling and layout
├── script.js                     # Main game logic
├── *.test.js                     # Jest test files
└── package.json                  # Project configuration
```

## Code Style Guidelines

### Mobile-First Principles
- **Touch-First**: Prioritize touch controls over mouse/keyboard
- **Performance**: Target 60 FPS on mobile devices (iPhone 8 and newer)
- **Responsive**: Test in both portrait and landscape orientations
- **Battery Efficient**: Minimize unnecessary computations and DOM operations
- **Offline-Capable**: Design features to work without network connectivity

### JavaScript Style
- Use `const` and `let` instead of `var`
- Use consistent indentation (2 spaces)
- Add JSDoc comments for complex functions
- Keep functions small and focused
- Use meaningful variable names
- Avoid `console.log` (use `console.warn` or `console.error` for errors)
- Follow the ESLint configuration in `.eslintrc.json`

Example:
```javascript
// Good: Clear naming, const/let, JSDoc
/**
 * Calculate distance between two points
 * @param {Object} p1 - First point with x, y properties
 * @param {Object} p2 - Second point with x, y properties
 * @returns {number} Distance between points
 */
function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Bad: var usage, poor naming, no documentation
function d(a, b) {
  var x = b.x - a.x;
  var y = b.y - a.y;
  return Math.sqrt(x * x + y * y);
}
```

### Swift Style (iOS Native Code)
- Follow Swift naming conventions (camelCase for properties/methods)
- Use proper access control (`private`, `internal`, `public`)
- Add comments for complex native bridge interactions
- Handle errors gracefully with proper error messages

## Testing

### iOS Testing (Priority)
- **Always test on actual iOS devices** (iPhone 8+, iPad)
- Test in both portrait and landscape orientations
- Verify touch controls work smoothly
- Check performance (60 FPS target)
- Test tutorial system on first launch
- Verify localStorage persistence
- Test app backgrounding/foregrounding
- Use Safari Web Inspector for debugging on device

### Web/Jest Testing
- Test files use the pattern `*.test.js`
- Tests are written using Jest
- Run `npm test` before submitting changes
- Test in multiple browsers (Chrome, Firefox, Safari, Edge) for web version
- Web tests primarily verify game logic, not platform-specific features

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

Examples:
```
feat: Add particle explosion effect for asteroids
fix: Correct touch input dead zone on landscape mode
docs: Update iOS build guide with Xcode 15 requirements
test: Add tests for collision detection edge cases
perf: Optimize particle system for 60 FPS on iPhone 8
```

## Git Workflow

1. Create a new branch for your feature: `git checkout -b feature/your-feature-name`
2. Make changes and test thoroughly
3. Lint your code: `npm run lint:fix`
4. Commit with a clear message following conventional commits
5. Push your branch and create a pull request

## Common Development Tasks

### Adding a New Game Feature
1. Update game logic in `script.js` or create a module in `src/`
2. Add tests in a corresponding `.test.js` file
3. Update `style.css` if UI changes are needed
4. Test in browser with `npm start`
5. Sync to iOS with `./sync-ios-content.sh`
6. Test on actual iOS device

### Fixing a Bug
1. Write a failing test that reproduces the bug
2. Fix the bug in the appropriate file
3. Verify the test now passes with `npm test`
4. Run linter with `npm run lint:fix`
5. Test manually in both web and iOS (if applicable)

### Adding a New Test
1. Create or modify a `*.test.js` file
2. Follow existing test patterns in the codebase
3. Run the specific test: `npm test -- yourfile.test.js`
4. Run all tests to ensure no regressions: `npm test`

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

**Note**: The browser version primarily serves as a development/testing environment. Always prioritize iOS Safari/WKWebView compatibility.

## iOS Development (Primary Platform)

### Opening the iOS Project
```bash
cd ios
open VoidRift.xcodeproj
```

### iOS Project Structure
- **VoidRift/Native/** - Swift native code (UI, bridges, managers)
- **VoidRift/WebContent/** - Game files embedded in the app (synced from root)
- **VoidRift/Assets.xcassets/** - App icons and image assets
- **VoidRift/Supporting/** - Info.plist and configuration

### Key iOS Components

#### GameViewController.swift
- Main view controller hosting the WKWebView
- Handles orientation changes and safe area insets
- Manages tutorial overlay presentation

#### GameBridge.swift
- JavaScript-to-Swift message bridge
- Handles communication between web game and native iOS features
- Implement new native features here (haptics, notifications, etc.)

#### TutorialOverlay.swift
- Native tutorial system shown on first launch
- Pauses gameplay to explain controls
- Skippable and tracks completion state

#### OrientationManager.swift
- Handles portrait and landscape layout adjustments
- Manages UI element repositioning on rotation
- Ensures no overlapping elements

### iOS Development Workflow

1. Make changes to game files in root directory (`index.html`, `script.js`, `style.css`)
2. Sync changes to `ios/VoidRift/WebContent/` (copy modified files)
3. Test in Xcode simulator or device
4. For native features, modify Swift files in `ios/VoidRift/Native/`
5. Build and test on actual iOS device for performance validation

### iOS Build Requirements
- **Xcode**: 14.0 or later
- **iOS Deployment Target**: 14.0+
- **Signing**: Configure team in Xcode project settings
- **Testing**: Always test on actual devices (not just simulator)

### Mobile Optimization Guidelines

#### Performance
- Target 60 FPS on iPhone 8 and newer
- Use object pooling for bullets, particles, asteroids
- Minimize canvas operations per frame
- Avoid memory leaks from event listeners
- Profile with Safari Web Inspector on actual device

#### Touch Controls
- Primary input method (keyboard/mouse for web testing only)
- Large touch targets (minimum 44x44 points)
- Support portrait and landscape layouts
- Implement visual feedback for touch interactions
- Test dual-stick controls thoroughly

#### Battery Life
- Pause game when app enters background
- Reduce particle effects on lower-end devices
- Optimize animation frame requests
- Minimize network calls

#### Screen Sizes & Orientations
- Test on various iOS devices (iPhone 8, iPhone 14, iPhone 14 Pro Max, iPad)
- Support portrait and landscape
- Handle safe area insets (notch, home indicator)
- Responsive canvas sizing

### WKWebView Specifics
- Limited to ~1.5GB memory (less than Safari)
- No JIT compilation in some contexts
- Audio autoplay requires user gesture
- localStorage available and persisted
- JavaScript bridge for native features

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

### iOS App Deployment (Primary)

#### Development Build
1. Open `ios/VoidRift.xcodeproj` in Xcode
2. Select your development team in Signing & Capabilities
3. Choose target device or simulator
4. Build and run (⌘R)

#### TestFlight / App Store
1. Sync latest game files to `ios/VoidRift/WebContent/`
2. Update version/build number in Xcode
3. Archive the app (Product > Archive)
4. Upload to App Store Connect
5. Submit for TestFlight or App Store review

**Important**: Always sync web game files from root to `ios/VoidRift/WebContent/` before building iOS app.

### Web Deployment (Development/Testing)

#### Frontend Deployment
- The game can be deployed to any static host (GitHub Pages, Netlify, Vercel)
- No build step required - HTML, CSS, and JS files are used directly
- Primary purpose: Quick testing and development iteration
- Simply copy `index.html`, `script.js`, `style.css`, and related assets

#### Backend Deployment (Optional - for testing)
- Uses Vercel for serverless functions
- Deploy with: `./deploy.sh` or `vercel --prod`
- After deployment, update `API_URL` in `backend-api.js` with your Vercel deployment URL
- Environment variables (if needed) go in Vercel dashboard or `.env.local`
- **Note**: Backend primarily for development testing; iOS app may work offline

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

### iOS-Specific Issues (Priority)

#### WKWebView Memory Limits
- WKWebView has stricter memory limits than Safari (~1.5GB)
- Monitor memory usage with Instruments
- Implement object pooling for frequently created objects
- Clean up references properly to avoid memory leaks

#### Touch Events
- Touch events may not fire exactly like mouse events
- Test all touch interactions on actual devices
- Implement proper touch target sizes (44x44pt minimum)
- Handle simultaneous touches for dual-stick controls

#### Audio on iOS
- Audio requires user gesture to start (autoplay restricted)
- Implement "unmute" or "start" button for first interaction
- Test audio in both background and foreground states
- Consider reducing audio file sizes for mobile

#### Orientation Changes
- Listen for orientation change events
- Reposition UI elements appropriately
- Test all game states during rotation (menu, gameplay, pause, game over)
- Handle safe area insets (notch areas)

#### Performance on Older Devices
- iPhone 8 is minimum target - test on older hardware
- Reduce particle counts on lower-end devices
- Implement quality settings if needed
- Profile with Instruments to find bottlenecks

#### File Sync Issues
- Always sync changes from root to `ios/VoidRift/WebContent/`
- Xcode caches aggressively - clean build folder if changes don't appear
- Verify file timestamps after copying
- Consider automation script for syncing

### localStorage Issues
- The save system uses key `void_rift_v11` in localStorage
- Clearing browser data will reset all progress
- Always validate saved data structure before using it
- Handle missing or corrupted save data gracefully

### Browser-Specific Issues (Web Testing)
- Safari has stricter autoplay policies for audio
- Firefox requires explicit user gesture for fullscreen
- Mobile browsers may have different touch event handling
- Test gamepad support across different browsers
- **Note**: These mainly apply to web version; iOS app is primary focus

### Performance Considerations
- **Primary Target**: 60 FPS on iOS devices (iPhone 8+)
- Monitor particle counts to avoid performance degradation on mobile
- Use object pooling for bullets, asteroids, particles (critical for mobile)
- Minimize DOM operations during game loop
- Profile on actual iOS devices, not just simulator
- Consider device-specific quality settings

### Input Handling
- **Touch controls are PRIMARY** input method (mobile-first)
- Gamepad support available in web version
- Mouse and keyboard for web testing only
- All input goes through `InputManager.js` for consistency
- Test dual-stick touch controls thoroughly on iOS
- Ensure touch targets are minimum 44x44 points

## Testing Workflow

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- game-utils.test.js

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
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

## Development Server (Web Testing)

Start the local development server for quick web-based testing:
```bash
npm start
# or
python3 -m http.server 5173
```

The game will be available at `http://localhost:5173`

**Note**: This is primarily for rapid development iteration. Always test final changes in the iOS app on actual devices.

## Environment and Platform Specifics

### iOS Environment (Primary)
- **Platform**: WKWebView in native iOS app
- **Memory**: Limited to ~1.5GB (less than Safari)
- **JIT**: Limited JavaScript JIT compilation
- **Debugging**: Use Safari Web Inspector connected to device
- **Testing**: Always test on actual devices, not just simulator
- **Build**: Requires Xcode 14+ and macOS
- **Deployment**: TestFlight or App Store Connect

### iOS Features Used
- WKWebView for rendering game
- JavaScript-to-Swift message bridge (GameBridge.swift)
- Native tutorial overlay (UIKit)
- Orientation management (portrait + landscape)
- localStorage for persistence (sandboxed per app)
- Canvas API for rendering
- Web Audio API for sound
- Touch Events API (primary input)

### Web Development Environment (Testing)
- Requires a local server (file:// protocol has limitations)
- Use `npm start` or Python's http.server
- Hot reload not available - refresh browser after changes
- Primarily for rapid iteration before iOS testing

### Browser Features Used (Web Version)
- Canvas API for rendering
- Web Audio API for sound
- localStorage for persistence
- Gamepad API for controller support (web only)
- Touch Events API for mobile
- Fullscreen API for immersive mode
- Web Crypto API for password hashing

### Browser Console
- Avoid `console.log` in production code
- Use `console.warn` for warnings
- Use `console.error` for errors
- ESLint will flag improper console usage
- On iOS, view console via Safari Web Inspector > Develop menu
