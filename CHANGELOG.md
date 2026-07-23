## [2.0.5](https://github.com/untemps/react-vocal/compare/v2.0.4...v2.0.5) (2026-07-23)

## [2.0.4](https://github.com/untemps/react-vocal/compare/v2.0.3...v2.0.4) (2026-07-23)

## [2.0.3](https://github.com/untemps/react-vocal/compare/v2.0.2...v2.0.3) (2026-07-22)

## [2.0.2](https://github.com/untemps/react-vocal/compare/v2.0.1...v2.0.2) (2026-07-09)

## [2.0.1](https://github.com/untemps/react-vocal/compare/v2.0.0...v2.0.1) (2026-07-09)

# [2.0.0](https://github.com/untemps/react-vocal/compare/v1.7.43...v2.0.0) (2026-07-09)


* feat!: Remove __rsInstance injection prop in favor of module-level mock ([#160](https://github.com/untemps/react-vocal/issues/160)) ([d44c975](https://github.com/untemps/react-vocal/commit/d44c97545a4a5bc90ef1b14dfd330d95f182506a))


### Bug Fixes

* Add aria-hidden to decorative SVG in Icon component ([#148](https://github.com/untemps/react-vocal/issues/148)) ([334b0bd](https://github.com/untemps/react-vocal/commit/334b0bdd30bc7cec500858f3aa033e4370a344cc))
* Add type="button" to the default mic button to prevent form submission ([#265](https://github.com/untemps/react-vocal/issues/265)) ([b0c51ec](https://github.com/untemps/react-vocal/commit/b0c51ec0664ab4746b9ace8aa619e7260f0a734e))
* Address review feedback on migration PR ([0bcb971](https://github.com/untemps/react-vocal/commit/0bcb9716586b8cf9489bdf9f55258d6ddb78d3a1))
* Cancel silence timer on speechstart in continuous mode ([#188](https://github.com/untemps/react-vocal/issues/188)) ([e94fa19](https://github.com/untemps/react-vocal/commit/e94fa1941f67ce66103f6b3fc7e01473c031fadb))
* Coalesce empty-string input to 'unknown' message in classifyError ([#208](https://github.com/untemps/react-vocal/issues/208)) ([ed2e09d](https://github.com/untemps/react-vocal/commit/ed2e09d9e77ed0967d20e750cd8ca239954184d6))
* Commit Vitest snapshots and remove __snapshots__ from gitignore ([77f8d9c](https://github.com/untemps/react-vocal/commit/77f8d9cceae3c355a2e9f1c9964d61f0dc33da6f))
* Continuous-mode regular timeout pre-empts silenceTimeout and auto-stops always-on sessions ([#255](https://github.com/untemps/react-vocal/issues/255)) ([dba8486](https://github.com/untemps/react-vocal/commit/dba848657795dbe2d54f5a5e82e5194efde3891e))
* Externalize react/jsx-runtime so dist works on React <19 ([#269](https://github.com/untemps/react-vocal/issues/269)) ([0ff3c2d](https://github.com/untemps/react-vocal/commit/0ff3c2d49bdb43d8268f8499eda3614ccdc0aaae))
* Fix comment accuracy and trailing blank line in Vocal ([e742463](https://github.com/untemps/react-vocal/commit/e7424634ac79e1455415340138bdecbc0f7fe47d))
* isRecording flicker/double-start race and stale subscriptions after instance recreation ([#276](https://github.com/untemps/react-vocal/issues/276)) ([9c29d27](https://github.com/untemps/react-vocal/commit/9c29d27999a8790120aefd9c11ce4f96a13fd686))
* Keep continuous session alive on nomatch ([#177](https://github.com/untemps/react-vocal/issues/177)) ([5f22ff8](https://github.com/untemps/react-vocal/commit/5f22ff88a48aec4c75941d9f01b1abb49f25af30))
* Keep pointer cursor while listening in non-continuous mode ([#212](https://github.com/untemps/react-vocal/issues/212)) ([53e9591](https://github.com/untemps/react-vocal/commit/53e9591413ce07d5dd0a71d4fc46bed286e2bbad))
* Memoize useCommands triggerCommand to stabilize hook identity ([#178](https://github.com/untemps/react-vocal/issues/178)) ([95988d1](https://github.com/untemps/react-vocal/commit/95988d17a6fd7d8ce118716208f8454dc7e4cf14))
* Mid-session timeout/silenceTimeout changes are ignored ([#266](https://github.com/untemps/react-vocal/issues/266)) ([a61a012](https://github.com/untemps/react-vocal/commit/a61a0124c9c5f2b825e7778cb1e0975c0f1be037))
* Prevent stale Fuse instance in useCommands after async fuse.js import ([#147](https://github.com/untemps/react-vocal/issues/147)) ([acd62fb](https://github.com/untemps/react-vocal/commit/acd62fbcf835cb18c1b73d602b26b9852dbca08f))
* Propagate aria-pressed and aria-label to cloned-element children ([#210](https://github.com/untemps/react-vocal/issues/210)) ([43ff4a5](https://github.com/untemps/react-vocal/commit/43ff4a5bc88019606a304b7695239601e769710e))
* Release leaked event handlers when start() rejects or aborts ([#270](https://github.com/untemps/react-vocal/issues/270)) ([4bb6a57](https://github.com/untemps/react-vocal/commit/4bb6a57e469c71e864683ee5b3dae7c7b921357b))
* Reset isRecording when start() rejects or silently aborts ([#172](https://github.com/untemps/react-vocal/issues/172)) ([0f0abf4](https://github.com/untemps/react-vocal/commit/0f0abf435bf8f1fb8db6186d0bf6751fce70e87e))
* Restore Icon colors broken by React 19 defaultProps removal ([eb11761](https://github.com/untemps/react-vocal/commit/eb117610673ffb5534cd8423f5f52be0742fb227))
* Restore native focus ring when outlineStyle is falsy on the default button ([#282](https://github.com/untemps/react-vocal/issues/282)) ([10d9359](https://github.com/untemps/react-vocal/commit/10d935904896111ec8ae68eb07930693eb1f583e))
* Restore single-word matching in mixed command maps ([#253](https://github.com/untemps/react-vocal/issues/253)) ([336de2a](https://github.com/untemps/react-vocal/commit/336de2a037c53c27818d2c0684ba96046cb76ea7))
* Roll back isRecording whenever the start event does not fire ([#229](https://github.com/untemps/react-vocal/issues/229)) ([9ecab6a](https://github.com/untemps/react-vocal/commit/9ecab6a7da61a3aebba4d5caee33e6bc6b8dce72))
* Short transcripts falsely trigger phrase commands (Fuse missing minMatchCharLength) ([#264](https://github.com/untemps/react-vocal/issues/264)) ([97c0f16](https://github.com/untemps/react-vocal/commit/97c0f1676d417000cdfed5b34ada6c9aafbd987a))
* Snapshot handler identities to prevent listener leaks on prop changes ([#206](https://github.com/untemps/react-vocal/issues/206)) ([57de8e6](https://github.com/untemps/react-vocal/commit/57de8e6e34eb59571077e3eb12e583806b5fd4de))
* Stabilize event handlers and fix stale prop closures ([#112](https://github.com/untemps/react-vocal/issues/112)) ([82f434a](https://github.com/untemps/react-vocal/commit/82f434aa3ae5858b0c0fbc3740db4d3661d1670c))
* Toggle element-as-child onClick between start and stop ([#196](https://github.com/untemps/react-vocal/issues/196)) ([4911db8](https://github.com/untemps/react-vocal/commit/4911db8a70f858bccb7529fce327a4337479c2c1))


### chore

* Align package.json with @untemps/vocal 2.x packaging shape ([#150](https://github.com/untemps/react-vocal/issues/150)) ([a70f562](https://github.com/untemps/react-vocal/commit/a70f562ac3803e018d369f594ef3890e5c13826b))
* Migrate codebase to TypeScript ([#156](https://github.com/untemps/react-vocal/issues/156)) ([ec911b6](https://github.com/untemps/react-vocal/commit/ec911b64d2e671223f815e9e081c8babce1c6d22))


### Code Refactoring

* Drive default button outline from focus state instead of DOM mutation ([#245](https://github.com/untemps/react-vocal/issues/245)) ([eef129d](https://github.com/untemps/react-vocal/commit/eef129d01b3e35a046008e4b25b87aac5415ae5e))
* Switch to named-only exports ([#175](https://github.com/untemps/react-vocal/issues/175)) ([9c86c42](https://github.com/untemps/react-vocal/commit/9c86c425122c72eb0a16e37c92b662fda9185e3a))


### Features

* Add continuous session support ([#118](https://github.com/untemps/react-vocal/issues/118)) ([6f00b86](https://github.com/untemps/react-vocal/commit/6f00b86d1a7dae92f628fcda9c276fca9548f113))
* Add interimResults prop for live (interim) transcripts ([#272](https://github.com/untemps/react-vocal/issues/272)) ([74db919](https://github.com/untemps/react-vocal/commit/74db9199937e0f824cf130c144ce6dbb75a11823))
* Aggregate all result segments picking highest-confidence alternative ([#113](https://github.com/untemps/react-vocal/issues/113)) ([7581cfd](https://github.com/untemps/react-vocal/commit/7581cfd9d1e6484c226c769642a08ec73b2ac9b2))
* Classify errors before forwarding to onError ([#159](https://github.com/untemps/react-vocal/issues/159)) ([21ceeca](https://github.com/untemps/react-vocal/commit/21ceecabf69cf2b893aed336621d051e5495693b))
* Export useCommands and fix README result callback examples ([#158](https://github.com/untemps/react-vocal/issues/158)) ([067e4e8](https://github.com/untemps/react-vocal/commit/067e4e8c7ce5602d770cd7c458765307d53a2c48))
* Make fuse.js an optional peer dependency ([#117](https://github.com/untemps/react-vocal/issues/117)) ([1dd9557](https://github.com/untemps/react-vocal/commit/1dd955733686c51f0f04d050c07a6c2b72067a38))
* Migrate to @untemps/vocal 2.x functional API ([#146](https://github.com/untemps/react-vocal/issues/146)) ([cb4d372](https://github.com/untemps/react-vocal/commit/cb4d37282d8ff176bb912b004237bed0a3340cbd))
* Per-segment command matching, maxAlternatives, and exact lookup ([94e4980](https://github.com/untemps/react-vocal/commit/94e498039dca3ebd4182ada444305512990f4147))
* Preserve consumer onClick on element-as-child and let consumer preventDefault cancel the recognition toggle ([#207](https://github.com/untemps/react-vocal/issues/207)) ([00ffa91](https://github.com/untemps/react-vocal/commit/00ffa91ded0c513dc5a0b111476377a01f6b3411))
* Support custom speech engines and add a Gladia demo card ([#277](https://github.com/untemps/react-vocal/issues/277)) ([1e2cdea](https://github.com/untemps/react-vocal/commit/1e2cdeae44d85b22a3ebecad31987fce9989d99f))
* Update @untemps/vocal to 2.2.0 and expose microphone permission state ([#234](https://github.com/untemps/react-vocal/issues/234)) ([ccba482](https://github.com/untemps/react-vocal/commit/ccba48275efd339aead1fe8a39371b0c3761f394))


### Performance Improvements

* Replace O(n²) spread reducer with Object.fromEntries in useCommands ([#235](https://github.com/untemps/react-vocal/issues/235)) ([7511f07](https://github.com/untemps/react-vocal/commit/7511f07fffc1124921c950f12644fab3a8eb8335))
* Wrap _onFocus and _onBlur in useCallback ([#155](https://github.com/untemps/react-vocal/issues/155)) ([de4da73](https://github.com/untemps/react-vocal/commit/de4da73882fa9a2c492b3e506a6320823efa0a02))


### BREAKING CHANGES

* the default button renders `outline: none` at rest and now overrides any consumer-supplied `style.outline` with its focus outline.
* `Vocal` is no longer the default export of `@untemps/react-vocal`. Replace `import Vocal from '@untemps/react-vocal'` with `import { Vocal } from '@untemps/react-vocal'`. CJS consumers using `const { default: Vocal } = require('@untemps/react-vocal')` must switch to `const { Vocal } = require('@untemps/react-vocal')`.
* useVocal().start() now always returns Promise<void> instead of Promise<void> | undefined. The unsupported branch (isSupported() === false) previously returned undefined synchronously and now returns a resolved Promise<undefined>. Callers using `await` or `.catch()` are unaffected; callers that compared the return value to undefined synchronously must be updated.
* Synchronous throws from the underlying vocal.start() now surface as a rejected Promise rather than a synchronous exception, because the wrapper is now an async function. Callers wrapping start() in a synchronous try/catch must migrate to .catch() or await + try/catch.
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
* the value passed to `onError` changes shape from the raw Error/SpeechRecognitionErrorEvent to a VocalError object.
Migration:
   - `err.message` keeps working (now sourced from the wrapper).
   - New: `err.type` for discrimination.
   - For consumers that read fields specific to the underlying value (e.g. `err.error` on SpeechRecognitionErrorEvent), switch to `err.original` to access the raw payload.
* minimum supported Node.js version bumped from `^20.19.0 || >=22.12.0` to `>=22`, aligning with the underlying @untemps/vocal 2.x direct dependency
* the CJS bundle is now published as `dist/index.cjs` instead of `dist/index.js`. Consumers using the standard package entry point (`require('@untemps/react-vocal')`) are not affected — the `main`/`exports.require` fields resolve to the new path automatically.
Consumers that hard-coded a deep require to `@untemps/react-vocal/dist/index.js` must update the path to `@untemps/react-vocal/dist/index.cjs`, and bundlers that respect the `exports` map will reject sub-path imports outright — switch to the package entry import.
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
* fuse.js must now be installed separately to enable fuzzy matching for phrase commands.

## [1.7.43](https://github.com/untemps/react-vocal/compare/v1.7.42...v1.7.43) (2026-07-03)

## [1.7.42](https://github.com/untemps/react-vocal/compare/v1.7.41...v1.7.42) (2026-07-03)

## [1.7.41](https://github.com/untemps/react-vocal/compare/v1.7.40...v1.7.41) (2026-07-01)

## [1.7.40](https://github.com/untemps/react-vocal/compare/v1.7.39...v1.7.40) (2026-06-22)

## [1.7.39](https://github.com/untemps/react-vocal/compare/v1.7.38...v1.7.39) (2026-06-22)

## [1.7.38](https://github.com/untemps/react-vocal/compare/v1.7.37...v1.7.38) (2026-06-22)

## [1.7.37](https://github.com/untemps/react-vocal/compare/v1.7.36...v1.7.37) (2026-05-22)

## [1.7.36](https://github.com/untemps/react-vocal/compare/v1.7.35...v1.7.36) (2026-05-09)

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
