# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn test           # watch mode
yarn test:ci        # CI mode with coverage (also runs in pre-commit hook)
yarn build          # build CJS + ES + UMD to dist/
yarn dev            # dev server at http://localhost:10001/ (separate dev/ package)
yarn prettier       # format all JS files and stage changes
```

Run a single test file:
```bash
yarn jest src/hooks/__tests__/useVocal.test.js
```

Build formats are driven by `BABEL_ENV`: `cjs` → `dist/index.js`, `es` → `dist/index.es.js`, `umd` → `dist/index.umd.js`.

## Architecture

This is a React library wrapping the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) via `@untemps/vocal` (the `SpeechRecognitionWrapper` class).

### Public API (`src/index.js`)

- **`Vocal`** (default export) — the component
- **`useVocal`** — named export, the hook
- **`isSupported`** — boolean re-exported from `@untemps/vocal`

### Hook layer (`src/hooks/`)

| Hook | Role |
|------|------|
| `useVocal` | Creates/manages a `SpeechRecognitionWrapper` instance in a ref. Returns `[ref, { start, stop, abort, subscribe, unsubscribe, clean }]`. Instance is re-created when `lang` or `grammars` change. |
| `useCommands` | Fuzzy-matches a speech result string against a `commands` map using **fuse.js** (default score threshold `0.4` — lower = stricter). Keys are lowercased. |
| `useTimeout` | Manages the recognition timeout: starts on `start` event, pauses on `speechstart`, restarts on `speechend`, fires `_onEnd` on expiry. |

### Component (`src/components/Vocal.js`)

Composes the three hooks above. Three render modes depending on `children`:
- **function** `(start, stop, isStarted) => element` — full control
- **React element** — receives `onClick` injected via `cloneElement`
- **no children** — renders the default `<Icon>` button

The `__rsInstance` prop (undocumented) injects a custom `SpeechRecognitionWrapper` instance, used exclusively in tests.

### Testing

`jest/jest.setup.js` globally mocks `SpeechRecognition`, `Permissions`, `MediaDevices`, and `SpeechGrammarList`. The mock exposes a custom `say(sentence)` method that fires the full `speechstart → result/nomatch → speechend` event sequence synchronously — use it to simulate recognition in tests.

## Commit convention

Angular Conventional Commits (`feat`, `fix`, `chore`, `docs`, etc.). Enforced by commitlint on `commit-msg` hook.
