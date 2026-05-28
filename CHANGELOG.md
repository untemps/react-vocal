# [2.0.0-beta.26](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.25...v2.0.0-beta.26) (2026-05-28)

# [2.0.0-beta.25](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.24...v2.0.0-beta.25) (2026-05-27)


### Bug Fixes

* Memoize useCommands triggerCommand to stabilize hook identity ([#178](https://github.com/untemps/react-vocal/issues/178)) ([b69a2e9](https://github.com/untemps/react-vocal/commit/b69a2e9b5c555ed497400886e4339bfedbdbb329))

# [2.0.0-beta.24](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.23...v2.0.0-beta.24) (2026-05-27)


### Bug Fixes

* Keep continuous session alive on nomatch ([#177](https://github.com/untemps/react-vocal/issues/177)) ([64a1d64](https://github.com/untemps/react-vocal/commit/64a1d647bdc6054835f25511fc1ffc3dab65c8b9))

# [2.0.0-beta.23](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.22...v2.0.0-beta.23) (2026-05-27)

# [2.0.0-beta.22](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.21...v2.0.0-beta.22) (2026-05-27)


### Code Refactoring

* Switch to named-only exports ([#175](https://github.com/untemps/react-vocal/issues/175)) ([8fda310](https://github.com/untemps/react-vocal/commit/8fda310172a7e27f198b0724c808350e1b876eb1))


### BREAKING CHANGES

* `Vocal` is no longer the default export of `@untemps/react-vocal`. Replace `import Vocal from '@untemps/react-vocal'` with `import { Vocal } from '@untemps/react-vocal'`. CJS consumers using `const { default: Vocal } = require('@untemps/react-vocal')` must switch to `const { Vocal } = require('@untemps/react-vocal')`.

# [2.0.0-beta.21](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.20...v2.0.0-beta.21) (2026-05-26)

# [2.0.0-beta.20](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.19...v2.0.0-beta.20) (2026-05-26)


### Bug Fixes

* Reset isRecording when start() rejects or silently aborts ([#172](https://github.com/untemps/react-vocal/issues/172)) ([c3dbf59](https://github.com/untemps/react-vocal/commit/c3dbf5996a0ff49628205db39959bf32a1662a3b))


### BREAKING CHANGES

* useVocal().start() now always returns Promise<void> instead of Promise<void> | undefined. The unsupported branch (isSupported() === false) previously returned undefined synchronously and now returns a resolved Promise<undefined>. Callers using `await` or `.catch()` are unaffected; callers that compared the return value to undefined synchronously must be updated.
* Synchronous throws from the underlying vocal.start() now surface as a rejected Promise rather than a synchronous exception, because the wrapper is now an async function. Callers wrapping start() in a synchronous try/catch must migrate to .catch() or await + try/catch.

# [2.0.0-beta.19](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.18...v2.0.0-beta.19) (2026-05-25)

# [2.0.0-beta.18](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.17...v2.0.0-beta.18) (2026-05-25)


* feat!: Remove __rsInstance injection prop in favor of module-level mock ([#160](https://github.com/untemps/react-vocal/issues/160)) ([3f0e17c](https://github.com/untemps/react-vocal/commit/3f0e17c92b60ff7cca9dd073fb8b6b81789f816e))


### BREAKING CHANGES

* `<Vocal __rsInstance={...}>` and the 5th argument of `useVocal(lang, grammars, maxAlternatives, continuous, __rsInstance)` are removed.
Migration:
- Component-prop injection was undocumented and labeled internal/testing only; no production migration expected.
- Test suites that injected a custom VocalInstance via these channels must switch to a module-level mock of `createVocal`:
   // before
   <Vocal __rsInstance={myMockInstance} />
   // or
   useVocal('en-US', null, 1, false, myMockInstance)
   // after
   import { createVocal } from '@untemps/vocal'
   vi.mock('@untemps/vocal', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@untemps/vocal')>()
         return { ...actual, createVocal: vi.fn(actual.createVocal) }
      })
      
      it('...', () => {
         vi.mocked(createVocal).mockReturnValue(myMockInstance)
            render(<Vocal ... />)
         })
- See the new "Testing" section of the README for a complete `buildMockVocal` factory.

# [2.0.0-beta.17](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.16...v2.0.0-beta.17) (2026-05-24)


### Features

* Classify errors before forwarding to onError ([#159](https://github.com/untemps/react-vocal/issues/159)) ([d2ba4e1](https://github.com/untemps/react-vocal/commit/d2ba4e1b18252f7b638784e0f87eb113e3ae141c))


### BREAKING CHANGES

* the value passed to `onError` changes shape from the raw Error/SpeechRecognitionErrorEvent to a VocalError object.
Migration:
   - `err.message` keeps working (now sourced from the wrapper).
   - New: `err.type` for discrimination.
   - For consumers that read fields specific to the underlying value (e.g. `err.error` on SpeechRecognitionErrorEvent), switch to `err.original` to access the raw payload.

# [2.0.0-beta.16](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.15...v2.0.0-beta.16) (2026-05-24)


### Features

* Export useCommands and fix README result callback examples ([#158](https://github.com/untemps/react-vocal/issues/158)) ([990636a](https://github.com/untemps/react-vocal/commit/990636a3d7b3a7981629b0172318ae9bc739abf8))

# [2.0.0-beta.15](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.14...v2.0.0-beta.15) (2026-05-24)


### chore

* Migrate codebase to TypeScript ([#156](https://github.com/untemps/react-vocal/issues/156)) ([86c6e49](https://github.com/untemps/react-vocal/commit/86c6e49a82f599b60356afb91f34b59f63710a44))


### BREAKING CHANGES

* minimum supported Node.js version bumped from `^20.19.0 || >=22.12.0` to `>=22`, aligning with the underlying @untemps/vocal 2.x direct dependency

# [2.0.0-beta.14](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.13...v2.0.0-beta.14) (2026-05-24)


### Performance Improvements

* Wrap _onFocus and _onBlur in useCallback ([#155](https://github.com/untemps/react-vocal/issues/155)) ([9a26840](https://github.com/untemps/react-vocal/commit/9a2684091252b784ea79f328536006f00ed9862b))

# [2.0.0-beta.13](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.12...v2.0.0-beta.13) (2026-05-24)

# [2.0.0-beta.12](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.11...v2.0.0-beta.12) (2026-05-24)

# [2.0.0-beta.11](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.10...v2.0.0-beta.11) (2026-05-24)


### chore

* Align package.json with @untemps/vocal 2.x packaging shape ([#150](https://github.com/untemps/react-vocal/issues/150)) ([7701738](https://github.com/untemps/react-vocal/commit/770173880c3cfa32b6e572bd775b35333fbe0531))


### BREAKING CHANGES

* the CJS bundle is now published as `dist/index.cjs` instead of `dist/index.js`. Consumers using the standard package entry point (`require('@untemps/react-vocal')`) are not affected — the `main`/`exports.require` fields resolve to the new path automatically.
Consumers that hard-coded a deep require to `@untemps/react-vocal/dist/index.js` must update the path to `@untemps/react-vocal/dist/index.cjs`, and bundlers that respect the `exports` map will reject sub-path imports outright — switch to the package entry import.

# [2.0.0-beta.10](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.9...v2.0.0-beta.10) (2026-05-24)


### Bug Fixes

* Add aria-hidden to decorative SVG in Icon component ([#148](https://github.com/untemps/react-vocal/issues/148)) ([5e00e34](https://github.com/untemps/react-vocal/commit/5e00e34e991b1a5c1a29a393ac885a76864c601c))

# [2.0.0-beta.9](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.8...v2.0.0-beta.9) (2026-05-24)


### Bug Fixes

* Prevent stale Fuse instance in useCommands after async fuse.js import ([#147](https://github.com/untemps/react-vocal/issues/147)) ([a83f06d](https://github.com/untemps/react-vocal/commit/a83f06d73644d1029e735b38dc06c8614470e19e))

# [2.0.0-beta.8](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.7...v2.0.0-beta.8) (2026-05-24)


### Features

* Migrate to @untemps/vocal 2.x functional API ([#146](https://github.com/untemps/react-vocal/issues/146)) ([582575f](https://github.com/untemps/react-vocal/commit/582575f391472e0e95b0c793b57c7c3edca71939))


### BREAKING CHANGES

* `isSupported` is now a function instead of a boolean snapshot. Consumers must call it as `isSupported()`.
Migration:
   // before
   import { isSupported } from '@untemps/react-vocal'
   if (isSupported) { ... }
   // after
   import { isSupported } from '@untemps/react-vocal'
   if (isSupported()) { ... }
The function form is SSR-safe — it returns `false` when `window` is undefined, so consumers no longer need a manual `typeof window` guard before checking support.
* UMD bundle is no longer published.
`dist/index.umd.js` is removed from the release artifacts and from the npm tarball. Consumers loading react-vocal via `<script src="…/dist/index.umd.js">` or an AMD loader must migrate to the ES bundle (`dist/index.es.js`) via a module-aware loader (or use a bundler). The CJS bundle (`dist/index.js`) remains available for Node-style require().

# [2.0.0-beta.7](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.6...v2.0.0-beta.7) (2026-05-13)

# [2.0.0-beta.6](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.5...v2.0.0-beta.6) (2026-05-12)


### Features

* Add continuous session support ([#118](https://github.com/untemps/react-vocal/issues/118)) ([690ba61](https://github.com/untemps/react-vocal/commit/690ba617746aa28499d7ea2d48751453a652ff5e))

# [2.0.0-beta.5](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.4...v2.0.0-beta.5) (2026-05-11)


### Features

* Make fuse.js an optional peer dependency ([#117](https://github.com/untemps/react-vocal/issues/117)) ([a1c2a33](https://github.com/untemps/react-vocal/commit/a1c2a337f8d4ba4729c81f0a9b8664bcf914755f))


### BREAKING CHANGES

* fuse.js must now be installed separately to enable fuzzy matching for phrase commands.

# [2.0.0-beta.4](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.3...v2.0.0-beta.4) (2026-05-10)


### Features

* Per-segment command matching, maxAlternatives, and exact lookup ([39b6370](https://github.com/untemps/react-vocal/commit/39b63701b2a15c058b5ae510be8ad4b4437d6763))

# [2.0.0-beta.3](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.2...v2.0.0-beta.3) (2026-05-07)


### Features

* Aggregate all result segments picking highest-confidence alternative ([#113](https://github.com/untemps/react-vocal/issues/113)) ([600600d](https://github.com/untemps/react-vocal/commit/600600dfde457df6fe93974d76d0b48599846082))

# [2.0.0-beta.2](https://github.com/untemps/react-vocal/compare/v2.0.0-beta.1...v2.0.0-beta.2) (2026-05-07)


### Bug Fixes

* Stabilize event handlers and fix stale prop closures ([#112](https://github.com/untemps/react-vocal/issues/112)) ([69c5c00](https://github.com/untemps/react-vocal/commit/69c5c00ed73e792b6dd91dd6b294163e1c3d00dc))

# [2.0.0-beta.1](https://github.com/untemps/react-vocal/compare/v1.7.35...v2.0.0-beta.1) (2026-05-05)


### Bug Fixes

* Address review feedback on migration PR ([0dba863](https://github.com/untemps/react-vocal/commit/0dba86374736f8a2a3763ef20073cdb5bc3a4ac8))
* Commit Vitest snapshots and remove __snapshots__ from gitignore ([e120fda](https://github.com/untemps/react-vocal/commit/e120fda321c5ed553d02262399ead46653b4e002))
* Fix comment accuracy and trailing blank line in Vocal ([0ffbbc9](https://github.com/untemps/react-vocal/commit/0ffbbc97dcda8c4c1008b5d9259cbc70753d6551))
* Restore Icon colors broken by React 19 defaultProps removal ([3d50a38](https://github.com/untemps/react-vocal/commit/3d50a38996e1cc2589ac238e30c1b164b3677252))


### Features

* Migrate to Vite, Vitest and React 19 ([#109](https://github.com/untemps/react-vocal/issues/109)) ([29ecf60](https://github.com/untemps/react-vocal/commit/29ecf607d7e4a0eb2ac802b31e6003a225d7fecc))


### BREAKING CHANGES

* Runtime prop validation removed. `Vocal.propTypes` and `Icon.propTypes` have been deleted — React 19 deprecated static propTypes on function components. Consumers relying on development-time prop warnings must migrate to TypeScript or an equivalent static type checker.
* Node >=20.19.0 required. Vite 8 and jsdom 29 enforce this minimum. Node 18 and 19 are no longer supported for development or CI.
* `background: none` replaced by `backgroundColor: transparent` on the default button. The shorthand previously reset all background sub-properties (image, gradient…); the longhand only resets the color. Impact is minimal for most users but visible if a custom style prop relied on the implicit background-image reset.

## [1.7.35](https://github.com/untemps/react-vocal/compare/v1.7.34...v1.7.35) (2026-05-03)

## [1.7.34](https://github.com/untemps/react-vocal/compare/v1.7.33...v1.7.34) (2026-05-03)

## [1.7.33](https://github.com/untemps/react-vocal/compare/v1.7.32...v1.7.33) (2026-05-03)

## [1.7.32](https://github.com/untemps/react-vocal/compare/v1.7.31...v1.7.32) (2026-05-03)

## [1.7.31](https://github.com/untemps/react-vocal/compare/v1.7.30...v1.7.31) (2026-05-03)

## [1.7.30](https://github.com/untemps/react-vocal/compare/v1.7.29...v1.7.30) (2025-12-08)

## [1.7.29](https://github.com/untemps/react-vocal/compare/v1.7.28...v1.7.29) (2025-12-08)

## [1.7.28](https://github.com/untemps/react-vocal/compare/v1.7.27...v1.7.28) (2024-12-13)

## [1.7.27](https://github.com/untemps/react-vocal/compare/v1.7.26...v1.7.27) (2024-11-22)

## [1.7.26](https://github.com/untemps/react-vocal/compare/v1.7.25...v1.7.26) (2024-06-20)

## [1.7.25](https://github.com/untemps/react-vocal/compare/v1.7.24...v1.7.25) (2024-06-20)

## [1.7.24](https://github.com/untemps/react-vocal/compare/v1.7.23...v1.7.24) (2024-04-11)

## [1.7.23](https://github.com/untemps/react-vocal/compare/v1.7.22...v1.7.23) (2024-03-06)

## [1.7.22](https://github.com/untemps/react-vocal/compare/v1.7.21...v1.7.22) (2023-10-17)

## [1.7.21](https://github.com/untemps/react-vocal/compare/v1.7.20...v1.7.21) (2023-07-21)

## [1.7.20](https://github.com/untemps/react-vocal/compare/v1.7.19...v1.7.20) (2023-07-13)

## [1.7.19](https://github.com/untemps/react-vocal/compare/v1.7.18...v1.7.19) (2023-07-13)

## [1.7.18](https://github.com/untemps/react-vocal/compare/v1.7.17...v1.7.18) (2023-07-13)

## [1.7.17](https://github.com/untemps/react-vocal/compare/v1.7.16...v1.7.17) (2023-02-08)

## [1.7.16](https://github.com/untemps/react-vocal/compare/v1.7.15...v1.7.16) (2023-01-06)

## [1.7.15](https://github.com/untemps/react-vocal/compare/v1.7.14...v1.7.15) (2022-12-10)

## [1.7.14](https://github.com/untemps/react-vocal/compare/v1.7.13...v1.7.14) (2022-12-10)

## [1.7.13](https://github.com/untemps/react-vocal/compare/v1.7.12...v1.7.13) (2022-07-20)

## [1.7.12](https://github.com/untemps/react-vocal/compare/v1.7.11...v1.7.12) (2022-07-06)

## [1.7.11](https://github.com/untemps/react-vocal/compare/v1.7.10...v1.7.11) (2022-07-06)

## [1.7.10](https://github.com/untemps/react-vocal/compare/v1.7.9...v1.7.10) (2022-04-24)

## [1.7.9](https://github.com/untemps/react-vocal/compare/v1.7.8...v1.7.9) (2022-04-17)

## [1.7.8](https://github.com/untemps/react-vocal/compare/v1.7.7...v1.7.8) (2022-04-17)

## [1.7.7](https://github.com/untemps/react-vocal/compare/v1.7.6...v1.7.7) (2022-04-01)

## [1.7.6](https://github.com/untemps/react-vocal/compare/v1.7.5...v1.7.6) (2022-02-02)

## [1.7.5](https://github.com/untemps/react-vocal/compare/v1.7.4...v1.7.5) (2022-01-30)

## [1.7.4](https://github.com/untemps/react-vocal/compare/v1.7.3...v1.7.4) (2021-09-25)

## [1.7.3](https://github.com/untemps/react-vocal/compare/v1.7.2...v1.7.3) (2021-09-04)

## [1.7.2](https://github.com/untemps/react-vocal/compare/v1.7.1...v1.7.2) (2021-08-20)

## [1.7.1](https://github.com/untemps/react-vocal/compare/v1.7.0...v1.7.1) (2021-08-04)

# [1.7.0](https://github.com/untemps/react-vocal/compare/v1.6.8...v1.7.0) (2021-07-16)


### Features

* Add commands support ([#58](https://github.com/untemps/react-vocal/issues/58)) ([12e086d](https://github.com/untemps/react-vocal/commit/12e086d2308fff738de8a0b370108432f0df3265)), closes [#60](https://github.com/untemps/react-vocal/issues/60)

## [1.6.8](https://github.com/untemps/react-vocal/compare/v1.6.7...v1.6.8) (2021-07-03)

## [1.6.7](https://github.com/untemps/react-vocal/compare/v1.6.6...v1.6.7) (2021-06-12)

## [1.6.6](https://github.com/untemps/react-vocal/compare/v1.6.5...v1.6.6) (2021-05-24)

## [1.6.5](https://github.com/untemps/react-vocal/compare/v1.6.4...v1.6.5) (2021-05-23)

## [1.6.4](https://github.com/untemps/react-vocal/compare/v1.6.3...v1.6.4) (2021-05-23)

## [1.6.3](https://github.com/untemps/react-vocal/compare/v1.6.2...v1.6.3) (2021-05-21)

## [1.6.2](https://github.com/untemps/react-vocal/compare/v1.6.1...v1.6.2) (2021-05-20)

## [1.6.1](https://github.com/untemps/react-vocal/compare/v1.6.0...v1.6.1) (2021-05-19)

# [1.6.0](https://github.com/untemps/react-vocal/compare/v1.5.4...v1.6.0) (2021-05-19)


### Features

* Make the SpeechRecognitionWrapper event API more predictable ([#36](https://github.com/untemps/react-vocal/issues/36)) ([f81bab6](https://github.com/untemps/react-vocal/commit/f81bab6b80454882d85b50ccfddab41e068b289d))

## [1.5.4](https://github.com/untemps/react-vocal/compare/v1.5.3...v1.5.4) (2021-04-27)

## [1.5.3](https://github.com/untemps/react-vocal/compare/v1.5.2...v1.5.3) (2020-12-26)

## [1.5.2](https://github.com/untemps/react-vocal/compare/v1.5.1...v1.5.2) (2020-12-26)

## [1.5.1](https://github.com/untemps/react-vocal/compare/v1.5.0...v1.5.1) (2020-12-22)

# [1.5.0](https://github.com/untemps/react-vocal/compare/v1.4.1...v1.5.0) (2020-12-21)


### Features

* Expose the isListening flag in the function as children ([#30](https://github.com/untemps/react-vocal/issues/30)) ([436df67](https://github.com/untemps/react-vocal/commit/436df67a5e516fa08c6edf3c2cf425f9eb3621e1))

## [1.4.1](https://github.com/untemps/react-vocal/compare/v1.4.0...v1.4.1) (2020-10-22)

# [1.4.0](https://github.com/untemps/react-vocal/compare/v1.3.5...v1.4.0) (2020-09-13)


### Features

* Add support for function as children ([#24](https://github.com/untemps/react-vocal/issues/24)) ([153be96](https://github.com/untemps/react-vocal/commit/153be96cc610bd6025f5edaff522987d8194c449))

## [1.3.5](https://github.com/untemps/react-vocal/compare/v1.3.4...v1.3.5) (2020-09-13)

## [1.3.4](https://github.com/untemps/react-vocal/compare/v1.3.3...v1.3.4) (2020-09-07)


### Bug Fixes

* Bump vulnerable dependencies version ([#23](https://github.com/untemps/react-vocal/issues/23)) ([bb496f3](https://github.com/untemps/react-vocal/commit/bb496f31a1f72b5866f87733c94c4a105e1e901b))

## [1.3.3](https://github.com/untemps/react-vocal/compare/v1.3.2...v1.3.3) (2020-09-05)

## [1.3.2](https://github.com/untemps/react-vocal/compare/v1.3.1...v1.3.2) (2020-08-12)

## [1.3.1](https://github.com/untemps/react-vocal/compare/v1.3.0...v1.3.1) (2020-08-04)


### Bug Fixes

* Fix event unsubscriptions by removing callback function overriding ([#19](https://github.com/untemps/react-vocal/issues/19)) ([3a8dca4](https://github.com/untemps/react-vocal/commit/3a8dca41f5dfc4a87eb979a2693022ff719d3855))

# [1.3.0](https://github.com/untemps/react-vocal/compare/v1.2.0...v1.3.0) (2020-07-31)


### Features

* Export hook to abstract SpeechRecognition instance creation ([cf36b86](https://github.com/untemps/react-vocal/commit/cf36b862280a3de4ed67afa484afafbdf5613b86))

# [1.2.0](https://github.com/untemps/react-vocal/compare/v1.1.3...v1.2.0) (2020-07-19)


### Features

* Export isSupported flag ([#15](https://github.com/untemps/react-vocal/issues/15)) ([d41e8f6](https://github.com/untemps/react-vocal/commit/d41e8f62af403922ea6acca9a277a54207d330ba))

## [1.1.3](https://github.com/untemps/react-vocal/compare/v1.1.2...v1.1.3) (2020-07-16)


### Bug Fixes

* Fix grammars setting ([5e55a20](https://github.com/untemps/react-vocal/commit/5e55a201cddd536d1af3202b6816552530936f3f))

## [1.1.2](https://github.com/untemps/react-vocal/compare/v1.1.1...v1.1.2) (2020-07-15)


### Bug Fixes

* Fix grammars default value to null ([d27db45](https://github.com/untemps/react-vocal/commit/d27db45db49a41b01875975c9a7d73525a847330))
* Regenerate yarn.lock ([9fc0556](https://github.com/untemps/react-vocal/commit/9fc0556ff96ede76a679e618f822f1942171a569))

## [1.1.1](https://github.com/untemps/react-vocal/compare/v1.1.0...v1.1.1) (2020-07-13)

# [1.1.0](https://github.com/untemps/react-vocal/compare/v1.0.5...v1.1.0) (2020-07-13)


### Features

* Add recognition grammar and lang options ([#12](https://github.com/untemps/react-vocal/issues/12)) ([c3825d9](https://github.com/untemps/react-vocal/commit/c3825d9bb085bb8b8c9318aff7e8eab4d489ae9b))

## [1.0.5](https://github.com/untemps/react-vocal/compare/v1.0.4...v1.0.5) (2020-07-13)


### Bug Fixes

* Fix CHANGELOG.md ([05ac7c6](https://github.com/untemps/react-vocal/commit/05ac7c63a1aa72ae5ea4b7ea3568a2899950d2f7))

## [1.0.4](https://github.com/untemps/react-vocal/compare/v1.0.3...v1.0.4) (2020-07-13)

## [1.0.3](https://github.com/untemps/react-vocal/compare/v1.0.2...v1.0.3) (2020-06-28)

## [1.0.2](https://github.com/untemps/react-vocal/compare/v1.0.1...v1.0.2) (2020-06-23)


### Bug Fixes

* Fix package.json ([#6](https://github.com/untemps/react-vocal/issues/6)) ([6c3397f](https://github.com/untemps/react-vocal/commit/6c3397f1aca059cc753793df440770abdb6534fd))

## [1.0.1](https://github.com/untemps/react-vocal/compare/v1.0.0...v1.0.1) (2020-06-17)


### Bug Fixes

* Fix crash in useEffect when SpeechRecognition is not supported ([f322b8c](https://github.com/untemps/react-vocal/commit/f322b8c3fdf12775e87ccfc770a375f99297f7a2))

# 1.0.0 (2020-06-02)


### Features

* Push first version fully tested and built with Rollup ([4274ea9](https://github.com/untemps/react-vocal/commit/4274ea9e0065aa58303b092655d46508e316fa84))
