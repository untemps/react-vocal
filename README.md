<p align="center">
    <img src="assets/react-vocal.png" alt="react-vocal" height="150"/>
</p>
<p align="center">
    A React component and hook to initiate a SpeechRecognition session
</p>

---

[![npm](https://img.shields.io/npm/v/@untemps/react-vocal?style=for-the-badge)](https://www.npmjs.com/package/@untemps/react-vocal)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/untemps/react-vocal/publish.yml?style=for-the-badge)](https://github.com/untemps/react-vocal/actions)
[![Codecov](https://img.shields.io/codecov/c/github/untemps/react-vocal?style=for-the-badge)](https://codecov.io/gh/untemps/react-vocal)

## Links

:red_circle:&nbsp;<big><a href="https://untemps.github.io/react-vocal" target="_blank" rel="noopener">LIVE
DEMO</a></big>&nbsp;:red_circle:

## Disclaimer

The [Web Speech API](https://developer.mozilla.org/fr/docs/Web/API/Web_Speech_API) is only supported by few browsers so
far (see [caniuse](https://caniuse.com/#search=SpeechRecognition)). If the API is not available, the `Vocal` component
won't display anything.

This component intends to catch a speech result as soon as possible. This can be a good fit for vocal commands or search
field filling. It also supports a continuous mode (`continuous` prop) for real-time transcription and always-on voice
command use cases — see the `Vocal` component API table for details.

In single-shot mode (the default), either a result is caught and returned or the timeout is reached and the recognition
is discarded. The `stop` function returned by children-as-function mechanism allows to prematurely discard the
recognition before the timeout elapses.

### Special cases

Some browsers supports the `SpeechRecognition` API but not all the related APIs.  
For example, browsers on iOS 14.5, the `SpeechGrammar` and `SpeechGrammarList` and `Permissions` APIs are not supported.

Although the lack of `SpeechGrammar` and `SpeechGrammarList` is handled by the underlying `@untemps/vocal` library, you need to deal with `Permissions` by yourself.

## Requirements

-   React >= 16.13.1
-   Node >= 22

## Installation

```bash
yarn add @untemps/react-vocal
```

Fuzzy matching for phrase commands requires [fuse.js](https://fusejs.io/) as an optional peer dependency:

```bash
yarn add fuse.js
```

Without fuse.js, phrase commands fall back to case-insensitive exact matching. Single-word commands always use exact matching and never require fuse.js.

## TypeScript

`@untemps/react-vocal` is written in TypeScript and ships full type declarations. The public surface is typed end-to-end:

- `Vocal` component props (`VocalProps`, `OnResultCallback`, `OnErrorCallback`)
- `useVocal` hook signature, action tuple (`UseVocalActions`, `UseVocalReturn`)
- `useCommands` shapes (`CommandCallback`, `CommandsMap`, `TriggerCommand`)
- Error classification (`VocalError`, `VocalErrorType`, `classifyError`)
- `isSupported` function (re-exported from `@untemps/vocal`)

```typescript
import Vocal, { useVocal, isSupported, type VocalProps, type CommandsMap } from '@untemps/react-vocal'
```

TypeScript is listed as an optional peer dependency (`>=6.0.0`) — install it only if your project uses TS.

## Usage

### `Vocal` component

#### Basic usage

```javascript
import Vocal from '@untemps/react-vocal'

const App = () => {
	const [result, setResult] = useState('')

	const _onVocalStart = () => {
		setResult('')
	}

	const _onVocalResult = (result) => {
		setResult(result)
	}

	return (
		<div className="App">
			<span style={{ position: 'relative' }}>
				<Vocal
					onStart={_onVocalStart}
					onResult={_onVocalResult}
					style={{ width: 16, position: 'absolute', right: 10, top: -2 }}
				/>
				<input defaultValue={result} style={{ width: 300, height: 40 }} />
			</span>
		</div>
	)
}
```

---

#### Custom component

By default, `Vocal` displays an icon with two states:

-   Idle  
    ![Idle state](assets/icon-idle.png)
-   Listening  
    ![Listening state](assets/icon-listening.png)

But you can provide your own component.

-   With a simple React element:

```javascript
import Vocal from '@untemps/react-vocal'

const App = () => {
	return (
		<Vocal>
			<button>Start</button>
		</Vocal>
	)
}
```

In this case, a `onClick` handler is automatically attached to the component to start a recognition session.  
Only the first direct descendant of Vocal will receive the `onClick` handler. If you want to use a more complex
hierarchy, use the function syntax below.

-   With a function that returns a React element:

```javascript
import Vocal from '@untemps/react-vocal'

const Play = () => (
	<div
		style={{
			width: 0,
			height: 0,
			marginLeft: 1,
			borderStyle: 'solid',
			borderWidth: '4px 0 4px 8px',
			borderColor: 'transparent transparent transparent black',
		}}
	/>
)

const Stop = () => (
	<div
		style={{
			width: 8,
			height: 8,
			backgroundColor: 'black',
		}}
	/>
)

const App = () => {
	return (
		<Vocal>
			{(start, stop, isStarted) => (
				<button style={{ padding: 5 }} onClick={isStarted ? stop : start}>
					{isStarted ? <Stop /> : <Play />}
				</button>
			)}
		</Vocal>
	)
}
```

The following parameters are passed to the function:

| Arguments | Type | Description                                                     |
| --------- | ---- | --------------------------------------------------------------- |
| start     | func | The function used to start the recognition                      |
| stop      | func | The function used to stop the recognition                       |
| isStarted | bool | A flag that indicates whether the recognition is started or not |

---

#### Commands

The `Vocal` component accepts a `commands` prop to map special recognition results to callbacks.  
That means you can define vocal commands to trigger specific functions.

```javascript
const App = () => {
  return (
    <Vocal commands={{
      'switch border color': () => setBorderColor('red'),
    }}/>
  )
}
```

`commands` object is a key/pair model where the `key` is the command to be caught by the recognition and the `value` is the callback triggered when the command is detected.  

`key` is not case sensitive.

```javascript
const commands = {
    submit: () => submitForm(),
    'Change the background color': () => setBackgroundColor('red'), 
    'PLAY MUSIC': play
}
```

The component utilizes a special hook called `useCommands` to respond to the commands.  
The hook performs a fuzzy search to match approximate commands if needed. This allows to fix accidental typos or approximate recognition results.  
To do so the hook uses [fuse.js](https://fusejs.io/) which implements an algorithm to find strings that are approximately equal to a given input. The score precision that distinguishes acceptable command-to-callback mapping from negative matching can be customized in the hook instantiation.

fuse.js is an optional peer dependency — install it separately to enable fuzzy matching (see [Installation](#installation)). Without it, phrase commands fall back to case-insensitive exact matching.

**Single-word command keys** (e.g. `rouge`, `submit`) use exact case-insensitive lookup. When the recognition returns a multi-word transcript, each word is tried individually so a command fires even when embedded in a phrase (e.g. _"je veux du rouge"_ triggers `rouge`).

**Phrase command keys** (e.g. `'Change the background color'`) use [fuse.js](https://fusejs.io/) fuzzy matching. The `precision` prop controls the Fuse.js score threshold (default `0.4` — lower is stricter).

**Homophone tolerance** is achieved via `maxAlternatives`: by setting it to 3–5, the speech engine returns several transcription candidates per segment. The correct word (e.g. _vert_) may appear as a secondary alternative when the primary is a homophone (e.g. _verre_), and will still trigger the command.

**At most one command fires per utterance.** Alternatives and segments are scanned in order and matching stops at the first hit, so a single recognition event can trigger at most one command callback.

---

#### `Vocal` component API

| Props         | Type              | Default              | Description                                                                                     |
| ------------- | ----------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| commands        | object            | null                 | Callbacks to be triggered when specified commands are detected by the recognition               |
| lang            | string            | 'en-US'              | Language understood by the recognition [BCP 47 language tag](https://tools.ietf.org/html/bcp47) |
| grammars        | SpeechGrammarList | null                 | Grammars understood by the recognition [JSpeech Grammar Format](https://www.w3.org/TR/jsgf/)    |
| timeout         | number            | 3000                 | Time in ms to wait before discarding the recognition                                            |
| precision       | number            | 0.4                  | Fuse.js score threshold for **phrase** command keys only (lower = stricter). Single-word commands always use exact lookup. |
| maxAlternatives | number            | 1                    | Maximum number of recognition alternatives per segment. Setting this to 3–5 lets the engine surface the correct word as a secondary transcript, which is useful for handling homophones (e.g. _vert_ / _verre_ in French). |
| continuous      | boolean           | false                | Keep the recognition session open after each result. The session accumulates transcript across segments and stops when the button is clicked again or `silenceTimeout` expires. Commands are not evaluated in continuous mode. |
| silenceTimeout  | number            | null                 | When `continuous` is true, automatically stop the session after this many ms of inactivity following the last recognized result. `null` or `0` disables auto-stop (button click required). |
| style         | object            | null                 | Styles of the root element if className is not specified                                        |
| className     | string            | null                 | Class of the root element                                                                       |
| ariaLabel     | string            | 'start recognition'  | Accessible label for the default button                                                         |
| outlineStyle  | string            | '2px solid'          | Focus outline style applied to the default button                                               |
| onStart       | func              | null                 | Handler called when the recognition starts                                                      |
| onEnd         | func              | null                 | Handler called when the recognition ends                                                        |
| onSpeechStart | func              | null                 | Handler called when the speech starts                                                           |
| onSpeechEnd   | func              | null                 | Handler called when the speech ends                                                             |
| onResult      | func              | null                 | Handler called when a result is recognized                                                      |
| onError       | func              | null                 | Handler called when an error occurs                                                             |
| onNoMatch     | func              | null                 | Handler called when no result can be recognized                                                 |
| signal        | AbortSignal       | null                 | Optional `AbortSignal` propagated to the underlying `start()` call. Aborting it cancels the in-flight start (e.g. while waiting for microphone permission). |

### `useVocal` hook

#### Basic usage

```javascript
import React, { useState } from 'react'
import { useVocal } from '@untemps/react-vocal'
import Icon from './Icon'

const App = () => {
	const [isListening, setIsListening] = useState(false)
	const [result, setResult] = useState('')

	const [, { start, subscribe }] = useVocal('fr-FR')

	const _onButtonClick = () => {
		setIsListening(true)

		subscribe('speechstart', _onVocalStart)
		subscribe('result', _onVocalResult)
		subscribe('error', _onVocalError)
		start()
	}

	const _onVocalStart = () => {
		setResult('')
	}

	const _onVocalResult = (_event, bestAlternative) => {
		setIsListening(false)

		setResult(bestAlternative)
	}

	const _onVocalError = (e) => {
		console.error(e)
	}

	return (
		<div>
			<span style={{ position: 'relative' }}>
				<div
					role="button"
					aria-label="Vocal"
					tabIndex={0}
					style={{ width: 16, position: 'absolute', right: 10, top: 2 }}
					onClick={_onButtonClick}
				>
					<Icon color={isListening ? 'red' : 'blue'} />
				</div>
				<input defaultValue={result} style={{ width: 300, height: 40 }} />
			</span>
		</div>
	)
}
```

---

#### Signature

```
useVocal(lang, grammars, maxAlternatives, continuous)
```

| Args            | Type              | Default | Description                                                                                     |
| --------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| lang            | string            | 'en-US' | Language understood by the recognition [BCP 47 language tag](https://tools.ietf.org/html/bcp47) |
| grammars        | SpeechGrammarList | null    | Grammars understood by the recognition [JSpeech Grammar Format](https://www.w3.org/TR/jsgf/)    |
| maxAlternatives | number            | 1       | Maximum number of recognition alternatives per segment                                          |
| continuous      | boolean           | false   | Keep the recognition session open after each result                                             |

---

#### Return value

```
const [ref, { start, stop, abort, subscribe, unsubscribe, clean, isRecording }]
```

| Args        | Type | Description                                          |
| ----------- | ---- | ---------------------------------------------------- |
| ref         | Ref  | React ref to the underlying `@untemps/vocal` instance |
| start       | func | Function to start the recognition. Accepts an optional `{ signal }` argument — an `AbortSignal` propagated to the underlying `start()` call. Returns the underlying `vocal.start()` promise (resolves once the session starts, rejects on microphone/permission errors). |
| stop        | func | Function to stop the recognition                     |
| abort       | func | Function to abort the recognition                    |
| subscribe   | func | Function to subscribe to recognition events          |
| unsubscribe | func | Function to unsubscribe to recognition events        |
| clean       | func | Function to remove all event listeners and clean up the recognition instance |
| isRecording | bool | Reactive flag mirroring whether a session is active. `true` between `start()` and the next `end`/`error` event. Updated optimistically on `start()` so the UI re-renders at click time. |

#### Cancelling a start in flight

Both `<Vocal signal={...}>` and `useVocal().start({ signal })` accept an `AbortSignal`. Aborting the controller while the browser is still resolving microphone permission cancels the start cleanly — no `start` event is dispatched and `isRecording` reverts to `false`.

```javascript
const controller = new AbortController()

// Cancel pending recognition after 2s of waiting for permission
setTimeout(() => controller.abort(), 2000)

const [, { start }] = useVocal('en-US')
start({ signal: controller.signal })
```

**Behavior note** — the underlying `@untemps/vocal` library currently swallows the `AbortError` internally: the promise returned by `start()` resolves silently rather than rejecting (see [untemps/vocal#129](https://github.com/untemps/vocal/issues/129)). `react-vocal` compensates by detecting `signal.aborted` after resolution and rolling `isRecording` back to `false`, so consumers of `<Vocal>` or `useVocal` do not need any extra handling. If you bypass the hook and access the underlying `VocalInstance` via the ref returned by `useVocal`, you must check `signal.aborted` yourself after `start()` resolves.

### `useCommands` hook

The `useCommands` hook is the same command-matching primitive used internally by the `Vocal` component. Export it directly when you build a custom UI on top of `useVocal` and want to reuse the matching logic instead of re-implementing it.

#### Basic usage

```javascript
import { useVocal, useCommands } from '@untemps/react-vocal'

const App = () => {
	const commands = {
		rouge: () => setBorderColor('red'),
		bleu: () => setBorderColor('blue'),
	}
	const triggerCommand = useCommands(commands)

	const [, { start, subscribe }] = useVocal('fr-FR')

	const _onResult = (_event, bestAlternative) => {
		triggerCommand(bestAlternative)
	}

	const _onClick = () => {
		subscribe('result', _onResult)
		start()
	}

	return <button onClick={_onClick}>Listen</button>
}
```

#### Signature

```
useCommands(commands, precision)
```

| Args      | Type   | Default | Description                                                                                              |
| --------- | ------ | ------- | -------------------------------------------------------------------------------------------------------- |
| commands  | object | null    | A `{ key: callback }` map. Keys are lowercased internally. Callbacks receive `(rawInput, commandKey)`.   |
| precision | number | 0.4     | Fuse.js score threshold for **phrase** command keys only (lower = stricter). Single-word keys use exact lookup. |

#### Return value

`useCommands` returns a `triggerCommand(rawInput)` function. Passing a transcript runs it against the commands map and invokes the matching callback if any, returning its result. Returns `null` when no command matches.

Matching rules:

- **Single-word keys** (e.g. `rouge`, `submit`): exact case-insensitive lookup, with each word of the input tried individually so a key fires even when embedded in a phrase (`je veux du rouge` triggers `rouge`).
- **Phrase keys** (e.g. `change the background color`): Fuse.js fuzzy matching against the joined transcript, gated by `precision`. fuse.js is loaded lazily; if it's not installed, the hook falls back to substring matching.

### Browser support flag

#### Basic usage

`isSupported` is a function that returns `true` when the browser supports the Web Speech API (along with the Permissions and MediaDevices APIs that `@untemps/vocal` relies on). It is safe to call during server-side rendering — it returns `false` when `window` is undefined.

```javascript
import Vocal, { isSupported } from '@untemps/react-vocal'

const App = () => {
	return isSupported() ? <Vocal /> : <p>Your browser does not support Web Speech API</p>
}
```

### Events

| Events      | Description                                                                               |
| ----------- | ----------------------------------------------------------------------------------------- |
| audioend    | Fired when the user agent has finished capturing audio for recognition                    |
| audiostart  | Fired when the user agent has started to capture audio for recognition                    |
| end         | Fired when the recognition service has disconnected                                       |
| error       | Fired when a recognition error occurs                                                     |
| nomatch     | Fired when the recognition service returns a final result with no significant recognition |
| result      | Fired when the recognition service returns a result                                       |
| soundend    | Fired when any sound — recognisable or not — has stopped being detected                   |
| soundstart  | Fired when any sound — recognisable or not — has been detected                            |
| speechend   | Fired when speech recognized by the recognition service has stopped being detected        |
| speechstart | Fired when sound recognized by the recognition service as speech has been detected        |
| start       | fired when the recognition service has begun listening to incoming audio                  |

### Notes

The process to grant microphone access permissions is automatically managed by the hook (internally used by the `Vocal`
component).

### Error classification

`onError` receives a structured `VocalError` object so consumers can branch on the error category without parsing low-level error names or messages.

```typescript
interface VocalError {
	type: 'permission-denied' | 'no-speech' | 'network' | 'audio-capture' | 'service-not-allowed' | 'aborted' | 'unknown'
	message: string
	original: unknown
}
```

Mapping rules:

| `type`                | Source                                                                              |
| --------------------- | ----------------------------------------------------------------------------------- |
| `permission-denied`   | `SpeechRecognitionErrorEvent` `not-allowed` or `DOMException` `NotAllowedError`     |
| `no-speech`           | `SpeechRecognitionErrorEvent` `no-speech`                                           |
| `network`             | `SpeechRecognitionErrorEvent` `network`                                             |
| `audio-capture`       | `SpeechRecognitionErrorEvent` `audio-capture` or `DOMException` `NotFoundError` / `NotReadableError` |
| `service-not-allowed` | `SpeechRecognitionErrorEvent` `service-not-allowed`                                 |
| `aborted`             | `SpeechRecognitionErrorEvent` `aborted` or `DOMException` `AbortError`              |
| `unknown`             | Anything else (generic Errors, non-Error values)                                    |

Example:

```javascript
<Vocal
	onError={(err) => {
		if (err.type === 'permission-denied') {
			showPermissionPrompt()
		} else if (err.type === 'no-speech') {
			hint('Try speaking louder')
		} else {
			console.error(err.original)
		}
	}}
/>
```

The `classifyError` helper used internally is also exported for consumers who want to apply the same classification to errors caught at the `useVocal().start({ signal })` call site.

### Testing

The library has no dedicated injection prop — tests inject a custom vocal instance through standard vitest module mocking. Build a minimal `VocalInstance`-shaped object and return it from a mocked `createVocal`:

```typescript
import { createVocal, type VocalInstance } from '@untemps/vocal'
import { render } from '@testing-library/react'
import Vocal from '@untemps/react-vocal'

vi.mock('@untemps/vocal', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@untemps/vocal')>()
	return { ...actual, createVocal: vi.fn(actual.createVocal) }
})

const buildMockVocal = () => {
	const handlers: Record<string, ((...args: unknown[]) => void)[]> = {}
	return {
		start: vi.fn(),
		stop: vi.fn(),
		abort: vi.fn(),
		cleanup: vi.fn(),
		on: vi.fn((type: string, cb: (...args: unknown[]) => void) => {
			handlers[type] = handlers[type] ?? []
			handlers[type].push(cb)
		}),
		off: vi.fn(),
		get isRecording() {
			return false
		},
		fire(type: string, ...args: unknown[]) {
			handlers[type]?.forEach((cb) => cb(...args))
		},
	} satisfies VocalInstance & { fire: (type: string, ...args: unknown[]) => void }
}

it('reacts to a recognized command', async () => {
	const setBorderRed = vi.fn()
	const recognition = buildMockVocal()
	vi.mocked(createVocal).mockReturnValue(recognition)
	render(<Vocal commands={{ red: setBorderRed }} />)
	// drive the recognition lifecycle via `recognition.fire('start', new Event('start'))`,
	// `recognition.fire('result', evt, 'red', ['red'])`, etc., then assert as usual
})
```

The same pattern works for `useVocal`. There is no public prop or argument to swap the vocal instance — the module-level mock is the supported, stable entry point.

## Development

The component can be served for development purpose on `http://localhost:10001/` using:

```
yarn dev
```

## Contributing

Contributions are warmly welcomed:

-   Fork the repository
-   Create a feature branch (preferred name convention: `[feature type]_[imperative verb]-[description of the feature]`)
-   Develop the feature AND write the tests (or write the tests AND develop the feature)
-   Commit your changes
    using [Angular Git Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)
-   Submit a Pull Request

## Roadmap

-   Add a connector management to plug external speech-to-text services in
