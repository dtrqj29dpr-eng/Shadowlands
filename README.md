# Shadowlands

## Running the game

### Browser (development)
```bash
npm install
npm run dev        # starts Vite dev server → open http://localhost:5173
```

### Browser (production build)
```bash
npm run build      # outputs to dist/
npm run preview    # preview the built app
```

### Desktop — development
```bash
npm run desktop:dev
```
Compiles the Electron main process, then starts the Vite dev server and launches the
desktop window side-by-side. Changes to game code hot-reload via Vite automatically.

### Desktop — production build (Windows installer)
```bash
npm run desktop:build
```
Builds the web bundle, compiles the Electron main process, then packages a Windows NSIS
installer into the `release/` directory.

---

## Game Font

All UI text uses the font family `"ShadowlandsUI"`, defined in two places:

| File | Purpose |
|------|---------|
| `index.html` — `@font-face` block | Declares the font to the browser / Electron renderer |
| `src/game/config/FontConfig.ts` — `GAME_FONT_FAMILY` | Single constant used by every Phaser text style |

The font file lives at:
```
public/assets/fonts/JetBrainsMono-Regular.woff2
```

**To replace the font:**
1. Drop your `.woff2` file into `public/assets/fonts/`
2. Update the `src: url(...)` line in the `@font-face` block in `index.html`
3. Done — `GAME_FONT_FAMILY` stays the same; all text picks up the new font automatically.

Current font: **JetBrains Mono Regular** (SIL Open Font License 1.1).

---

## Project structure

```
electron/          Electron main process (compiled to dist-electron/)
src/               Phaser 3 game (bundled by Vite to dist/)
public/assets/     Static assets served as-is
dist/              Web build output
dist-electron/     Compiled Electron main process
release/           Desktop installer output (desktop:build only)
```
