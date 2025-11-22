# Contributing to VOID RIFT

Thank you for your interest in contributing to VOID RIFT! This document provides guidelines and instructions for developers.

## Development Setup

### Prerequisites

- Node.js 14+ (for development tools)
- Python 3 (for local testing server)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/astickleyid/shooter-app.git
cd shooter-app
```

2. Install development dependencies:
```bash
npm install
```

3. Start the local development server:
```bash
npm start
```
This will start a server at http://localhost:5173

4. Open your browser and navigate to http://localhost:5173

## Code Quality

### Linting

We use ESLint to maintain code quality. Run the linter before committing:

```bash
npm run lint
```

To automatically fix issues:

```bash
npm run lint:fix
```

### Code Style Guidelines

- Use `const` and `let` instead of `var`
- Use consistent indentation (2 spaces)
- Add JSDoc comments for complex functions
- Keep functions small and focused
- Use meaningful variable names
- Avoid console.log (use console.warn or console.error for errors)

## Project Structure

```
shooter-app/
├── index.html          # Main HTML file
├── style.css           # All styling
├── script.js           # All game logic (to be modularized)
├── package.json        # Node.js project configuration
├── .eslintrc.json      # ESLint configuration
├── .gitignore          # Git ignore patterns
└── README.md           # Project documentation
```

## Making Changes

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and test thoroughly

3. Lint your code:
```bash
npm run lint:fix
```

4. Commit your changes with a clear message:
```bash
git commit -m "feat: add new enemy type"
```

5. Push your branch and create a pull request

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

## Testing

Before submitting a pull request:

1. Test in multiple browsers (Chrome, Firefox, Safari)
2. Test on mobile devices or emulators
3. Verify all game features work correctly
4. Check for console errors
5. Test save/load functionality
6. Verify authentication flows

## Security

- Never store passwords in plaintext
- Sanitize user inputs
- Use Web Crypto API for cryptographic operations
- Report security issues privately to the maintainers

## Areas for Contribution

Check the GitHub issues for:
- Bug fixes
- Feature requests
- Performance improvements
- Documentation updates
- Code refactoring

## Questions?

Open an issue on GitHub or contact the maintainers.

Thank you for contributing! 🚀
