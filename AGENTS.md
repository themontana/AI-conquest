# AI Conquest

Browser-based strategy game where the player embodies an AI trying to achieve global dominance.

## Cursor Cloud specific instructions

### Architecture
- Vanilla JavaScript frontend (ES modules) with HTML5 Canvas rendering
- Node.js static file server (`server.js`) using only built-in `http`/`fs`/`path` modules (port 8000)
- All game state stored in browser `localStorage` — no database or backend logic

### Running the dev server
- `npm run dev` starts nodemon with auto-reload on port 8000
- Open `http://localhost:8000` in Chrome to play the game

### Lint / Test / Build
- **No linter** is configured in this project
- **No test framework** — `npm test` exits with an error by design (`echo "Error: no test specified" && exit 1`)
- `npm run build` copies sound assets (`sounds/` → `public/sounds/`); may fail if `sounds/` directory doesn't exist — this is not blocking for development

### Gotchas
- `express`, `compression`, and `helmet` are listed in `package.json` dependencies but are **not used** by `server.js`; the server uses only Node built-in modules
- There is no `.gitignore` — be careful not to commit `node_modules/`
