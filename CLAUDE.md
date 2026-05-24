# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn test           # watch mode (Vitest)
yarn test:ci        # CI mode with coverage (also runs in pre-commit hook)
yarn typecheck      # tsc --noEmit on the TypeScript source
yarn build          # build CJS + ES + .d.ts to dist/ (Vite library mode + vite-plugin-dts)
yarn dev            # dev server at http://localhost:10001/ (separate dev/ package)
yarn prettier       # format all JS / TS / TSX files and stage tracked changes
```

Run a single test file:
```bash
yarn vitest src/hooks/__tests__/useVocal.test.ts
```

Build outputs defined in `vite.config.ts`:
- `cjs` → `dist/index.cjs`
- `es` → `dist/index.es.js`
- TypeScript declarations → `dist/index.d.ts` (entry) + `dist/{hooks,components}/*.d.ts` (re-exported types)

## Architecture

React library wrapping the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) via `@untemps/vocal` 2.x (functional API: `createVocal`, `isSupported`, `on`/`off`). Source is **TypeScript**; the public API surface is fully typed.

### Public API (`src/index.ts`)

- **`Vocal`** (default export) — the component, typed via `VocalProps`
- **`useVocal`** — named export, returns `UseVocalReturn`
- **`isSupported`** — function re-exported from `@untemps/vocal` (call it: `isSupported()`)
- **Types**: `VocalProps`, `OnResultCallback`, `UseVocalActions`, `UseVocalReturn`, `CommandCallback`, `CommandsMap`, `TriggerCommand`

### Hook layer (`src/hooks/`)

| Hook | Role |
|------|------|
| `useVocal` | Creates/manages a vocal instance (`createVocal()` from `@untemps/vocal`) in a ref. Returns `[ref, { start, stop, abort, subscribe, unsubscribe, clean, isRecording }]`. Instance is re-created when `lang` or `grammars` change. `subscribe`/`unsubscribe` delegate to the instance's `on`/`off`. |
| `useCommands` | Fuzzy-matches a speech result string against a `commands` map using **fuse.js** (default score threshold `0.4` — lower = stricter). Keys are lowercased. |
| `useTimeout` | Manages the recognition timeout: starts on `start` event, pauses on `speechstart`, restarts on `speechend`, fires `_onEnd` on expiry. |

### Component (`src/components/Vocal.tsx`)

Composes the three hooks above. Three render modes depending on `children`:
- **function** `(start, stop, isStarted) => element` — full control
- **React element** — receives `onClick` injected via `cloneElement`
- **no children** — renders the default `<Icon>` button

All props have default values in the function signature (React 19: `defaultProps` no longer applied to function components). Prop shapes are enforced via the `VocalProps` interface.

The `__rsInstance` prop (typed as `VocalInstance | null`, documented as internal/testing) injects a custom vocal instance, used exclusively in tests.

### Testing

`vitest.setup.ts` globally mocks `SpeechRecognition`, `Permissions`, `MediaDevices`, and `SpeechGrammarList`. The mock keeps the minimal SR surface needed by tests that don't inject a `__rsInstance` (start/stop/abort + listener registration). Tests that need to drive speech events instead inject a `createMockVocal()` instance (see `src/components/__tests__/createMockVocal.ts`) — it implements the `VocalInstance` contract and exposes test-only helpers `.say`, `.error`, `.end`, `.fire`.

Vitest globals are enabled (`globals: true`) — `describe`, `it`, `expect`, `vi` available without imports in test files.

## Commit convention

Angular Conventional Commits (`feat`, `fix`, `chore`, `docs`, etc.). Enforced by commitlint on `commit-msg` hook.
