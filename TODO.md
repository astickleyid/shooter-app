# TODO - Future Improvements for VOID RIFT

This document tracks potential improvements and enhancements for future development.

## High Priority

### Security Enhancements
- [ ] Implement server-side bcrypt/argon2 for password hashing
  - Current: PBKDF2 in browser (100K iterations)
  - Goal: Industry-standard backend hashing
  - Benefit: Better protection against rainbow tables
  - Effort: Medium (requires backend changes)

- [ ] Add CSRF protection for API endpoints
  - Current: Basic token authentication
  - Goal: CSRF tokens for state-changing operations
  - Benefit: Prevent cross-site request forgery
  - Effort: Low (add token generation/validation)

- [ ] Implement Content Security Policy (CSP)
  - Current: No CSP headers
  - Goal: Restrict content sources
  - Benefit: Additional XSS protection layer
  - Effort: Low (add meta tag/headers)

### Performance Optimizations
- [ ] Implement lazy loading for game assets
  - Current: All assets loaded upfront
  - Goal: Load on-demand
  - Benefit: Faster initial load
  - Effort: Medium

- [ ] Add WebWorkers for heavy computations
  - Current: All computation on main thread
  - Goal: Offload to workers
  - Benefit: Smoother gameplay on lower-end devices
  - Effort: High (requires refactoring)

- [ ] Optimize particle system
  - Current: Canvas-based particles
  - Goal: WebGL particle system
  - Benefit: 10x more particles without lag
  - Effort: High (rewrite particle system)

### Testing
- [ ] Add tests for main game logic (script.js)
  - Current: 0% coverage of main game
  - Goal: 50%+ coverage
  - Benefit: Catch gameplay bugs
  - Effort: Very High (monolithic file)

- [ ] Add tests for social features
  - Files: social-ui.js, social-hub.js, social-api.js
  - Current: Limited coverage
  - Goal: 80%+ coverage
  - Effort: Medium

- [ ] Add integration tests for API endpoints
  - Current: Basic security tests only
  - Goal: Full endpoint testing
  - Benefit: API reliability
  - Effort: Medium

- [ ] Add E2E tests with Playwright
  - Current: No E2E tests
  - Goal: Critical user flows covered
  - Benefit: Catch integration issues
  - Effort: High

## Medium Priority

### Code Quality
- [ ] Migrate to TypeScript
  - Current: Plain JavaScript
  - Goal: Full TypeScript coverage
  - Benefit: Type safety, better IDE support
  - Effort: Very High (gradual migration)

- [ ] Extract game logic from script.js into modules
  - Current: 430KB monolithic file
  - Goal: Modular structure
  - Benefit: Better maintainability
  - Effort: Very High (requires build system)

- [ ] Set up build pipeline (webpack/rollup)
  - Current: No build step
  - Goal: Bundled, minified output
  - Benefit: Smaller file sizes, tree shaking
  - Effort: Medium

- [ ] Add code minification for production
  - Current: Full source in production
  - Goal: Minified production build
  - Benefit: Faster load times
  - Effort: Low (with build system)

### Features
- [ ] Add progressive web app (PWA) support
  - Current: Standard web app
  - Goal: Installable, offline-capable
  - Benefit: Better mobile experience
  - Effort: Low (add manifest, service worker)

- [ ] Implement real-time multiplayer
  - Current: Single-player only
  - Goal: Co-op or competitive modes
  - Benefit: Social gameplay
  - Effort: Very High (requires server architecture)

- [ ] Add more ship customization options
  - Current: Basic ship types
  - Goal: Skins, colors, decals
  - Benefit: Player expression
  - Effort: Medium

- [ ] Implement achievement system
  - Current: Basic missions
  - Goal: Steam-like achievements
  - Benefit: Player engagement
  - Effort: Medium

### Mobile Experience
- [ ] Optimize touch controls for iOS
  - Current: Basic touch support
  - Goal: Refined dual-stick controls
  - Benefit: Better mobile gameplay
  - Effort: Medium

- [ ] Add haptic feedback for iOS
  - Current: No haptic feedback
  - Goal: Vibration on hits, shots
  - Benefit: Tactile feedback
  - Effort: Low (iOS native API)

- [ ] Optimize for lower-end mobile devices
  - Current: Targets iPhone 8+
  - Goal: Support older devices
  - Benefit: Wider audience
  - Effort: Medium (quality settings)

### Backend
- [ ] Migrate from Vercel KV to dedicated database
  - Current: Redis-compatible KV
  - Goal: PostgreSQL or MongoDB
  - Benefit: Better query capabilities
  - Effort: High

- [ ] Add proper user authentication with OAuth
  - Current: Custom username/password
  - Goal: OAuth2 (Google, Apple)
  - Benefit: Easier sign-up
  - Effort: Medium

- [ ] Implement proper session management
  - Current: Basic token system
  - Goal: Refresh tokens, session persistence
  - Benefit: Better security
  - Effort: Medium

## Low Priority

### Documentation
- [ ] Add JSDoc comments to all functions
  - Current: Partial coverage
  - Goal: 100% JSDoc coverage
  - Benefit: Better IDE support
  - Effort: High (manual work)

- [ ] Create video tutorials
  - Current: Text documentation only
  - Goal: YouTube tutorial series
  - Benefit: Easier onboarding
  - Effort: High (video production)

- [ ] Add architecture diagrams
  - Current: Text documentation
  - Goal: Visual diagrams (mermaid)
  - Benefit: Easier to understand
  - Effort: Low

### Developer Experience
- [ ] Add pre-commit hooks (husky)
  - Current: Manual linting
  - Goal: Auto-lint on commit
  - Benefit: Enforce code quality
  - Effort: Low

- [ ] Set up CI/CD pipeline
  - Current: Manual deployment
  - Goal: Automated tests + deploy
  - Benefit: Faster iteration
  - Effort: Medium (GitHub Actions)

- [ ] Add hot reload for development
  - Current: Manual refresh
  - Goal: Auto-reload on save
  - Benefit: Faster development
  - Effort: Low (with dev server)

### Game Design
- [ ] Add difficulty curve balancing
  - Current: Linear difficulty
  - Goal: Adaptive difficulty
  - Benefit: Better player retention
  - Effort: High (requires playtesting)

- [ ] Implement procedural level generation
  - Current: Wave-based spawning
  - Goal: Procedural levels
  - Benefit: Infinite variety
  - Effort: Very High

- [ ] Add boss battles
  - Current: Elite enemies only
  - Goal: Unique boss fights
  - Benefit: More exciting gameplay
  - Effort: High

### Polish
- [ ] Add particle effects for all actions
  - Current: Basic particles
  - Goal: Juicy effects everywhere
  - Benefit: Better game feel
  - Effort: Medium

- [ ] Improve UI/UX design
  - Current: Functional but basic
  - Goal: Modern, polished UI
  - Benefit: Professional appearance
  - Effort: High (requires designer)

- [ ] Add sound effects library
  - Current: Basic audio
  - Goal: Rich sound design
  - Benefit: Better immersion
  - Effort: Medium

## Completed ✅

### Phase 1 (2026-02-14)
- [x] Sync iOS missing files (MissionSystem, TechFragmentSystem)
- [x] Fix test failures (leaderboard-api.test.js)
- [x] Fix ESLint configuration
- [x] Fix all ESLint warnings
- [x] Fix code structure bugs

### Phase 2 (2026-02-14)
- [x] Upgrade password hashing to PBKDF2
- [x] Add HTML sanitization functions
- [x] Strengthen password validation (8 char minimum)
- [x] Add validation & crypto tests
- [x] Update Node version requirement to 16+

### Phase 3 (2026-02-14)
- [x] Fix hardcoded /tmp paths
- [x] Create ARCHITECTURE.md
- [x] Create API_DOCUMENTATION.md
- [x] Document dual module system
- [x] Create CHANGELOG.md
- [x] Create this TODO.md

## Tracking

### Priority Legend
- **High**: Should be done in next release
- **Medium**: Nice to have in near future
- **Low**: Can be deferred indefinitely

### Effort Legend
- **Low**: < 4 hours
- **Medium**: 4-16 hours
- **High**: 16-40 hours
- **Very High**: 40+ hours

### Status
- **Total Items**: 48
- **Completed**: 11 ✅
- **Remaining**: 37
- **High Priority**: 11
- **Medium Priority**: 15
- **Low Priority**: 11

---

**Last Updated**: 2026-02-14
**Next Review**: When starting new feature work

## Contributing

See `CONTRIBUTING.md` for guidelines on:
- How to pick a TODO item
- How to mark items as complete
- How to add new items

## Questions?

- Architecture questions: See `ARCHITECTURE.md`
- API questions: See `API_DOCUMENTATION.md`
- General questions: Open a GitHub issue
