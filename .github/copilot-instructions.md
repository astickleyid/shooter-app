# Copilot Instructions for VOID RIFT

## Project Overview

VOID RIFT is a browser-based twin-stick shooter built with vanilla HTML, CSS, and JavaScript. The game runs entirely in the browser with no build step required for the frontend.

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

## Files to Avoid Modifying

- `package-lock.json` (auto-generated)
- Files in `node_modules/` (dependencies)
- `.git/` directory

## Security Considerations

- Never store passwords in plaintext
- Sanitize user inputs
- Use Web Crypto API for cryptographic operations
- Do not commit secrets or API keys

## Browser Compatibility

The game targets modern browsers (Chrome, Firefox, Safari, Edge). Ensure changes maintain compatibility with ES2022 features as configured in `.eslintrc.json`.
