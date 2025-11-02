# VOID RIFT

A minimal HTML5 canvas shooter prototype (VOID RIFT) — includes basic player, enemies, upgrades and shop.

Files:
- index.html — front-end + UI
- style.css — styles
- script.js — game logic
- README.md — this file
- .gitignore — typical ignores
- package.json — convenience scripts
- LICENSE — MIT license

Running locally:
1. Clone the repository.
2. Open index.html in a browser, or run a simple static server:
   - With Node: `npx live-server` or `npx http-server`
   - Or use your editor's live preview.

Development notes:
- Uses localStorage to save credits and upgrades (key: `void_rift_v11`).
- Mobile touch controls included (joysticks).
- The shop and save system are implemented — use the shop to upgrade between levels.

License: MIT
