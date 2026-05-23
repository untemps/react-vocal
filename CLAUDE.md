# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn test           # watch mode (Vitest)
yarn test:ci        # CI mode with coverage (also runs in pre-commit hook)
yarn build          # build CJS + ES + UMD to dist/ (Vite library mode)
yarn dev            # dev server at http://localhost:10001/ (separate dev/ package)
yarn prettier       # format all JS files and stage tracked changes
```

Run a single test file:
```bash
yarn vitest src/hooks/__tests__/useVocal.test.js
```

Build formats defined in `vite.config.js` `build.lib`: `cjs` → `dist/index.js`, `es` → `dist/index.es.js`, `umd` → `dist/index.umd.js`.

## Architecture

React library wrapping the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) via `@untemps/vocal` 2.x (functional API: `createVocal`, `isSupported`, `on`/`off`).

### Public API (`src/index.js`)

- **`Vocal`** (default export) — the component
- **`useVocal`** — named export, the hook
- **`isSupported`** — function re-exported from `@untemps/vocal` (call it: `isSupported()`)

### Hook layer (`src/hooks/`)

| Hook | Role |
|------|------|
| `useVocal` | Creates/manages a vocal instance (`createVocal()` from `@untemps/vocal`) in a ref. Returns `[ref, { start, stop, abort, subscribe, unsubscribe, clean }]`. Instance is re-created when `lang` or `grammars` change. `subscribe`/`unsubscribe` delegate to the instance's `on`/`off`. |
| `useCommands` | Fuzzy-matches a speech result string against a `commands` map using **fuse.js** (default score threshold `0.4` — lower = stricter). Keys are lowercased. |
| `useTimeout` | Manages the recognition timeout: starts on `start` event, pauses on `speechstart`, restarts on `speechend`, fires `_onEnd` on expiry. |

### Component (`src/components/Vocal.jsx`)

Composes the three hooks above. Three render modes depending on `children`:
- **function** `(start, stop, isStarted) => element` — full control
- **React element** — receives `onClick` injected via `cloneElement`
- **no children** — renders the default `<Icon>` button

All props have default values in the function signature (React 19: `defaultProps` no longer applied to function components). No `propTypes` — removed as deprecated in React 19.

The `__rsInstance` prop (undocumented) injects a custom vocal instance, used exclusively in tests.

### Testing

`vitest.setup.js` globally mocks `SpeechRecognition`, `Permissions`, `MediaDevices`, and `SpeechGrammarList`. The mock exposes a custom `say(sentence)` method that fires the full `speechstart → result/nomatch → speechend` event sequence synchronously — use it to simulate recognition in tests. The last `SpeechRecognition` instance created by the mock is reachable via `globalThis.__getSpeechRecognition()` (the wrapper's `.instance` getter was removed in vocal 2.x).

Vitest globals are enabled (`globals: true`) — `describe`, `it`, `expect`, `vi` available without imports in test files.

## Commit convention

Angular Conventional Commits (`feat`, `fix`, `chore`, `docs`, etc.). Enforced by commitlint on `commit-msg` hook.
