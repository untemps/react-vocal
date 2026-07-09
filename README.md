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

<p align="center">
    🔴&nbsp;<strong><a href="https://react-vocal.vercel.app">LIVE DEMO</a></strong>&nbsp;🔴
</p>

## Features

- **Single-shot & continuous recognition** — catch a result as soon as it lands, or keep the session open across speech segments for one aggregated transcript. See [How it works](#how-it-works-single-shot-vs-continuous-mode).
- **Vocal commands with fuzzy matching** — map spoken phrases to callbacks, with Fuse.js fuzzy matching for phrase keys and exact matching for single-word keys. See [Vocal commands](#vocal-commands).
- **Interim results / live captions** — stream provisional transcripts while the user is still speaking. See [Interim results & live captions](#interim-results--live-captions).
- **Microphone-permission tracking** — read the `PermissionState` reactively without ever starting a session. See [Microphone permission](#microphone-permission).
- **Structured error classification** — `onError` receives a typed `VocalError` you branch on instead of parsing raw error names. See [Error handling](#error-handling).
- **Pluggable custom speech engines** — swap the Web Speech API for a cloud or on-device backend behind a stable seam. See [Custom speech engines](#custom-speech-engines).
- **Full TypeScript types** — the public surface is typed end-to-end. See [TypeScript types](#typescript-types).
- **SSR-safe support check** — `isSupported()` returns `false` (rather than throwing) when `window` is undefined. See [`isSupported`](#issupported).

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Guide](#guide)
    - [How it works: single-shot vs continuous mode](#how-it-works-single-shot-vs-continuous-mode)
    - [Custom UI & render styles](#custom-ui--render-styles)
    - [Vocal commands](#vocal-commands)
    - [Interim results & live captions](#interim-results--live-captions)
    - [Microphone permission](#microphone-permission)
    - [Error handling](#error-handling)
    - [Stable references & memoization](#stable-references--memoization)
    - [Browser & platform caveats](#browser--platform-caveats)
- [API reference](#api-reference)
    - [`<Vocal>` component](#vocal-component)
    - [`useVocal` hook](#usevocal-hook)
    - [`useCommands` hook](#usecommands-hook)
    - [`isSupported`](#issupported)
    - [`classifyError` & `VocalError`](#classifyerror--vocalerror)
    - [Events](#events)
    - [TypeScript types](#typescript-types)
- [Custom speech engines](#custom-speech-engines)
    - [Example: Gladia cloud engine](#example-gladia-cloud-engine)
- [Testing](#testing)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Requirements

- React >= 16.14.0
- Node >= 22

The [Web Speech API](https://developer.mozilla.org/fr/docs/Web/API/Web_Speech_API) is only supported by a few browsers so far (see [caniuse](https://caniuse.com/#search=SpeechRecognition)). When the API is unavailable, the `Vocal` component renders nothing — probe support ahead of time with [`isSupported`](#issupported), and note that a [custom speech engine](#custom-speech-engines) can bring recognition to browsers that lack `SpeechRecognition`.

## Installation

```bash
yarn add @untemps/react-vocal
```

Fuzzy matching for phrase commands requires [fuse.js](https://fusejs.io/) as an optional peer dependency:

```bash
yarn add fuse.js
```

Without fuse.js, phrase commands fall back to case-insensitive exact matching. Single-word commands always use exact matching and never require fuse.js.

TypeScript is listed as an optional peer dependency (`>=6.0.0`) — install it only if your project uses TS.

## Quick start

Drop a `<Vocal>` next to an input and read the transcript from `onResult`:

```javascript
import { Vocal } from '@untemps/react-vocal'

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

## Guide

Concepts and mental models. For exact signatures, prop names, defaults, and types, see the [API reference](#api-reference).

### How it works: single-shot vs continuous mode

`Vocal` is built to catch a speech result as soon as possible — a good fit for vocal commands or search-field filling.

**Single-shot mode (the default).** Either a result is caught and returned through `onResult`, or `timeout` (default `3000` ms) is reached and the recognition is discarded. The `stop` function exposed by the [children-as-function](#children-as-a-function) mechanism lets you prematurely discard the recognition before the timeout elapses. Commands are evaluated in this mode, on the final result segment.

**Continuous mode (`continuous` prop).** The recognition session stays open across speech segments and accumulates the transcript, delivering a single aggregated transcript through `onResult` when the session ends — stopped by a second click on the button or by `silenceTimeout`. Commands are **not** evaluated in continuous mode.

### Custom UI & render styles

By default, `Vocal` displays an icon with two states:

- Idle  
  ![Idle state](assets/icon-idle.png)
- Listening  
  ![Listening state](assets/icon-listening.png)

But you can provide your own component.

- With a simple React element:

```javascript
import { Vocal } from '@untemps/react-vocal'

const App = () => {
	return (
		<Vocal>
			<button>Start</button>
		</Vocal>
	)
}
```

In this case, an `onClick` handler is automatically attached to the component to toggle the recognition session (start when idle, stop while listening). Only the first direct descendant of `Vocal` will receive the `onClick` handler. If you want to use a more complex hierarchy, use the function syntax below.

If the child element already declares its own `onClick`, it is preserved: your handler runs first, then the recognition toggle. This lets you attach analytics or any other behavior to the same element without losing the toggle.

To cancel the toggle (e.g. require a confirmation, block while the user is unauthenticated), call `event.preventDefault()` inside your handler — the recognition will not start or stop for that click.

For accessibility parity with the default button, `aria-pressed` is also injected on the cloned child to reflect the listening state, and `aria-label` falls back to the `ariaLabel` prop of `<Vocal>` when the child does not declare one of its own.

- With a function that returns a React element:

```javascript
import { Vocal } from '@untemps/react-vocal'

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

The function receives `(start, stop, isStarted, permissionState)` — see [Children as a function](#children-as-a-function) for the full argument reference.

### Vocal commands

The `Vocal` component accepts a `commands` prop to map special recognition results to callbacks. That means you can define vocal commands to trigger specific functions.

```javascript
const App = () => {
  return (
    <Vocal commands={{
      'switch border color': () => setBorderColor('red'),
    }}/>
  )
}
```

The `commands` object is a key/pair model where the `key` is the command to be caught by the recognition and the `value` is the callback triggered when the command is detected. The `key` is not case sensitive.

```javascript
const commands = {
    submit: () => submitForm(),
    'Change the background color': () => setBackgroundColor('red'), 
    'PLAY MUSIC': play
}
```

The component uses a special hook called [`useCommands`](#usecommands-hook) to respond to the commands. For phrase keys, the hook performs a fuzzy search to match approximate commands, fixing accidental typos or approximate recognition results. It does so via [fuse.js](https://fusejs.io/), which finds strings approximately equal to a given input; the score precision that distinguishes an acceptable command-to-callback mapping from a negative match is customizable through the `precision` prop. fuse.js is an optional peer dependency — install it separately to enable fuzzy matching (see [Installation](#installation)). Without it, phrase commands fall back to case-insensitive exact matching.

**Single-word command keys** (e.g. `red`, `submit`) use exact case-insensitive lookup. When the recognition returns a multi-word transcript, each word is tried individually so a command fires even when embedded in a phrase (e.g. _"I want some red"_ triggers `red`).

**Phrase command keys** (e.g. `'Change the background color'`) use [fuse.js](https://fusejs.io/) fuzzy matching against multi-word transcripts. The `precision` prop controls the Fuse.js score threshold (default `0.4` — lower is stricter). A single-word transcript never fuzzy-matches a phrase key, so a stray fragment (`"the"`, `"to"`) returned by the recognition can't trigger a phrase command.

**Mixing single-word and phrase keys** is fully supported — a phrase key never disables single-word matching. For each transcript the hook tries, in order: (1) an exact match of the whole utterance against a single-word key, (2) fuzzy matching against the phrase keys, then (3) each word of the utterance against the single-word keys. The first command whose callback returns a non-`null` value wins (returning `null` is treated as "no match" and falls through to the next step). So an exact phrase like _"change the background color"_ fires the phrase even when a single-word key (`color`) appears inside it, while an embedded single word like _"I want some red"_ still fires `red` when no phrase matches.

**Homophone tolerance** is achieved via `maxAlternatives`: by setting it to 3–5, the speech engine returns several transcription candidates per segment. The correct word (e.g. _blue_) may appear as a secondary alternative when the primary is a homophone (e.g. _blew_), and will still trigger the command.

**At most one command fires per utterance.** Alternatives and segments are scanned in order and matching stops at the first hit, so a single recognition event can trigger at most one command callback.

Commands are evaluated only in single-shot mode; see [How it works](#how-it-works-single-shot-vs-continuous-mode).

### Interim results & live captions

Set `interimResults` to emit provisional (non-final) transcripts through `onResult` while the user is still speaking, enabling live captions. Each result event carries `event.results[event.resultIndex].isFinal`, so consumers can distinguish interim from final text. In non-continuous mode the session is **not** discarded on an interim result — only the final result ends it (and evaluates [commands](#vocal-commands)). Combine `interimResults` with `continuous` to keep captions flowing across segments; see [How it works](#how-it-works-single-shot-vs-continuous-mode).

### Microphone permission

Since `@untemps/vocal` 2.3, `react-vocal` surfaces the microphone permission state **without starting a recognition session** (no `getUserMedia` prompt). `useVocal` begins watching `navigator.permissions` at mount and exposes the result reactively as `permissionState` — and the `Vocal` component forwards it through the `onPermission` prop and the fourth argument of the [children function](#children-as-a-function). The value is `'granted'`, `'denied'`, `'prompt'`, or `null` while still unknown (or when the Permissions API is unavailable, e.g. some browsers or SSR). The process to actually grant microphone access is still managed automatically by the hook when a session starts.

Use it to gate the UI before the user ever clicks — for example, to hide the button or show guidance when access is already denied:

```javascript
import { Vocal } from '@untemps/react-vocal'

const App = () => (
	<Vocal onPermission={(state) => console.log('microphone permission:', state)}>
		{(start, stop, isStarted, permissionState) =>
			permissionState === 'denied' ? (
				<p>Microphone access is blocked — enable it in your browser settings.</p>
			) : (
				<button onClick={isStarted ? stop : start}>{isStarted ? 'Stop' : 'Start'}</button>
			)
		}
	</Vocal>
)
```

With the `useVocal` hook the same state is available directly:

```javascript
const [, { start, permissionState }] = useVocal('en-US')
```

### Error handling

`onError` receives a structured `VocalError` object so consumers can branch on the error category without parsing low-level error names or messages:

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

The `VocalError` shape and the full type-to-source mapping table live in [`classifyError` & `VocalError`](#classifyerror--vocalerror).

### Stable references & memoization

> :warning: **Memoize non-primitive props and arguments.** `Vocal` and `useVocal` rebuild the underlying recognition instance whenever a non-primitive input changes identity, which aborts in-flight sessions and churns microphone permissions. This affects three inputs:
>
> - **`grammars`** — constructing it inline (`<Vocal grammars={new SpeechGrammarList()} />` or `useVocal(lang, new SpeechGrammarList())`) yields a fresh identity on every render and forces a teardown/rebuild cycle each time.
> - **`commands`** — a fresh object forces [`useCommands`](#usecommands-hook) to re-normalize and re-index its fuzzy matcher on every render.
> - **`engine`** — like `grammars`, a fresh factory identity tears down and rebuilds the recognition instance.
>
> Wrap each of these in `useMemo` (keyed on its inputs — e.g. the API key for an engine) so the reference stays stable across renders.

### Browser & platform caveats

- When the Web Speech API is unavailable, the `Vocal` component renders nothing. See [Requirements](#requirements) for the base support caveat and [`isSupported`](#issupported) for probing support ahead of time.
- Some browsers support the `SpeechRecognition` API but not all the related APIs. For example, on iOS 14.5, browsers do not support the `SpeechGrammar`, `SpeechGrammarList`, and `Permissions` APIs. The lack of `SpeechGrammar` and `SpeechGrammarList` is handled by the underlying `@untemps/vocal` library, but you must deal with `Permissions` yourself (see [Microphone permission](#microphone-permission)).
- A [custom speech engine](#custom-speech-engines) does not rely on `SpeechRecognition`, so it can bring recognition to browsers that lack it (e.g. Firefox).

## API reference

Every entry point is a **named export** — there is no default export. Import with braces:

```typescript
import { Vocal, useVocal, isSupported, createEngine, type VocalProps, type CommandsMap } from '@untemps/react-vocal'
```

Value exports: `Vocal`, `useVocal`, `useCommands`, `classifyError`, `isSupported`, `createEngine`, `WebSpeechEngine`. Everything else is a type-only export (see [TypeScript types](#typescript-types)).

### `<Vocal>` component

#### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `commands` | `CommandsMap \| null` | `null` | Map of vocal commands to callbacks. See [Vocal commands](#vocal-commands). |
| `lang` | `string` | `'en-US'` | Language understood by the recognition ([BCP 47 language tag](https://tools.ietf.org/html/bcp47)). |
| `grammars` | `SpeechGrammarList \| null` | `null` | Grammars understood by the recognition ([JSpeech Grammar Format](https://www.w3.org/TR/jsgf/)). [Memoize it](#stable-references--memoization). |
| `timeout` | `number` | `3000` | Time in ms to wait before discarding the recognition. Not applied in continuous mode, where the session is governed by `silenceTimeout` or an explicit stop. Changing this value during an active session takes effect the next time the timer re-arms. |
| `silenceTimeout` | `number \| null` | `null` | When `continuous` is true, automatically stop the session after this many ms of silence following the last detected speech (the `speechend` event). `null` or `0` disables auto-stop (button click required). A change during an active session takes effect when the silence timer next re-arms (on the next `speechend`); a countdown already in progress keeps its original deadline, so switching to `null`/`0` does not cancel an auto-stop that is already pending until speech resumes. |
| `precision` | `number` | `0.4` | Fuse.js score threshold for **phrase** command keys only (lower = stricter). Single-word commands always use exact lookup. See [Vocal commands](#vocal-commands). |
| `maxAlternatives` | `number` | `1` | Maximum number of recognition alternatives per segment. Set to 3–5 for homophone tolerance. See [Vocal commands](#vocal-commands). |
| `continuous` | `boolean` | `false` | Keep the recognition session open after each result. See [How it works](#how-it-works-single-shot-vs-continuous-mode). |
| `interimResults` | `boolean` | `false` | Emit provisional (non-final) transcripts through `onResult`. See [Interim results & live captions](#interim-results--live-captions). |
| `engine` | `SpeechEngineFactory` | `undefined` | Custom speech recognition backend. When omitted, the built-in Web Speech API engine is used. See [Custom speech engines](#custom-speech-engines) and [memoize it](#stable-references--memoization). |
| `style` | `CSSProperties \| null` | `null` | Styles of the root element if `className` is not specified. |
| `className` | `string \| null` | `null` | Class of the root element. |
| `ariaLabel` | `string` | `'start recognition'` | Accessible label for the default button. |
| `outlineStyle` | `string \| null` | `'2px solid'` | Focus outline style applied to the default button. |
| `onStart` | `((event: Event) => void) \| null` | `null` | Handler called when the recognition starts. |
| `onEnd` | `((event?: Event) => void) \| null` | `null` | Handler called when the recognition ends. |
| `onSpeechStart` | `((event: Event) => void) \| null` | `null` | Handler called when the speech starts. |
| `onSpeechEnd` | `((event: Event) => void) \| null` | `null` | Handler called when the speech ends. |
| `onResult` | `OnResultCallback \| null` | `null` | Handler called when a result is recognized. Invoked as `onResult(bestAlternative, event)` — the best alternative is the **first** argument, the event is second. |
| `onError` | `OnErrorCallback \| null` | `null` | Handler called with a structured `VocalError`. See [Error handling](#error-handling). |
| `onNoMatch` | `((event: Event) => void) \| null` | `null` | Handler called when no result can be recognized. |
| `onPermission` | `((state: PermissionState) => void) \| null` | `null` | Handler called with the microphone `PermissionState`. See [Microphone permission](#microphone-permission). |
| `signal` | `AbortSignal \| null` | `null` | `AbortSignal` propagated to the underlying `start()` call. See [Cancelling a start in flight](#cancelling-a-start-in-flight). |

#### Children as a function

When `children` is a function, it receives exactly four arguments in this order:

| Argument | Type | Description |
| --- | --- | --- |
| `start` | `() => void` | The function used to start the recognition. |
| `stop` | `() => void` | The function used to stop the recognition. |
| `isStarted` | `boolean` | A flag that indicates whether the recognition is started or not. |
| `permissionState` | `PermissionState \| null` | Current microphone permission (`'granted'`/`'denied'`/`'prompt'`), tracked without starting a session. `null` until known or when the Permissions API is unavailable. See [Microphone permission](#microphone-permission). |

### `useVocal` hook

```javascript
import React, { useEffect, useState } from 'react'
import { useVocal } from '@untemps/react-vocal'
import Icon from './Icon'

const App = () => {
	const [result, setResult] = useState('')

	const [, { start, subscribe, unsubscribe, isRecording }] = useVocal('en-US')

	useEffect(() => {
		const _onVocalStart = () => {
			setResult('')
		}

		const _onVocalResult = (_event, bestAlternative) => {
			setResult(bestAlternative)
		}

		const _onVocalError = (e) => {
			console.error(e)
		}

		subscribe('speechstart', _onVocalStart)
		subscribe('result', _onVocalResult)
		subscribe('error', _onVocalError)

		return () => {
			unsubscribe('speechstart', _onVocalStart)
			unsubscribe('result', _onVocalResult)
			unsubscribe('error', _onVocalError)
		}
	}, [subscribe, unsubscribe])

	const _onButtonClick = () => {
		start()
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
					<Icon color={isRecording ? 'red' : 'blue'} />
				</div>
				<input defaultValue={result} style={{ width: 300, height: 40 }} />
			</span>
		</div>
	)
}
```

> The raw `result` event handler passed to `subscribe` is `(event, transcript, alternatives)` — event first — which is why the example above destructures `(_event, bestAlternative)`. This differs from the `onResult` **prop**, which is `(bestAlternative, event)`. See [Events](#events).

#### Signature

```
useVocal(lang, grammars, maxAlternatives, continuous, interimResults, engine)
```

| Argument | Type | Default | Description |
| --- | --- | --- | --- |
| `lang` | `string` | `'en-US'` | Recognition language. Same semantics as the [`lang` prop](#props). |
| `grammars` | `SpeechGrammarList \| null` | `null` | Recognition grammars. Same as the [`grammars` prop](#props); [memoize it](#stable-references--memoization). |
| `maxAlternatives` | `number` | `1` | Maximum recognition alternatives per segment. Same as the [`maxAlternatives` prop](#props). |
| `continuous` | `boolean` | `false` | Keep the session open after each result. See [How it works](#how-it-works-single-shot-vs-continuous-mode). |
| `interimResults` | `boolean` | `false` | Emit provisional transcripts. See [Interim results & live captions](#interim-results--live-captions). |
| `engine` | `SpeechEngineFactory` | `undefined` | Custom recognition backend. Omit to use the built-in Web Speech engine. See [Custom speech engines](#custom-speech-engines); [memoize it](#stable-references--memoization). |

#### Return value

```
const [ref, { start, stop, abort, subscribe, unsubscribe, clean, isRecording, permissionState }]
```

| Field | Type | Description |
| --- | --- | --- |
| `ref` | `RefObject<VocalInstance \| null>` | React ref to the underlying `@untemps/vocal` instance. |
| `start` | `(options?: { signal?: AbortSignal }) => Promise<void>` | Starts the recognition. Accepts an optional `{ signal }` — an `AbortSignal` propagated to the underlying `start()` call (see [Cancelling a start in flight](#cancelling-a-start-in-flight)). Returns a `Promise<void>` that resolves once the session starts and **rejects** with the original error on microphone/permission failures. |
| `stop` | `() => void` | Stops the recognition. |
| `abort` | `() => void` | Aborts the recognition. |
| `subscribe` | `(eventType, handler) => void` | Subscribes to a recognition [event](#events). |
| `unsubscribe` | `(eventType, handler?) => void` | Unsubscribes from a recognition [event](#events). |
| `clean` | `() => void` | Removes all event listeners and cleans up the recognition instance. |
| `isRecording` | `boolean` | Reactive flag mirroring whether a session is active. `true` between `start()` and the next `end`/`error` event. Updated optimistically on `start()` so the UI re-renders at click time. |
| `permissionState` | `PermissionState \| null` | Reactive microphone permission state. See [Microphone permission](#microphone-permission). |

#### Cancelling a start in flight

Both `<Vocal signal={...}>` and `useVocal().start({ signal })` accept an `AbortSignal`. Aborting the controller while the browser is still resolving microphone permission cancels the start cleanly — no `start` event is dispatched and `isRecording` reverts to `false`.

```javascript
const controller = new AbortController()

// Cancel pending recognition after 2s of waiting for permission
setTimeout(() => controller.abort(), 2000)

const [, { start }] = useVocal('en-US')
start({ signal: controller.signal })
```

**Behavior note** — the underlying `@untemps/vocal` library still swallows the `AbortError` internally (as of 2.3.5), so `start()` resolves silently on abort rather than rejecting ([untemps/vocal#129](https://github.com/untemps/vocal/issues/129), with the reject-on-abort fix targeted for 3.0.0). `react-vocal` compensates by tracking whether the `start` event actually fired and rolling `isRecording` back to `false` when it did not, so consumers of `<Vocal>` or `useVocal` need no extra handling. Only if you bypass the hook and drive the underlying `VocalInstance` via `ref` must you observe the `start` event yourself.

### `useCommands` hook

The `useCommands` hook is the same command-matching primitive used internally by the `Vocal` component. Use it directly when you build a custom UI on top of `useVocal` and want to reuse the matching logic instead of re-implementing it.

```javascript
import { useVocal, useCommands } from '@untemps/react-vocal'

const App = () => {
	const commands = {
		red: () => setBorderColor('red'),
		blue: () => setBorderColor('blue'),
	}
	const triggerCommand = useCommands(commands)

	const [, { start, subscribe }] = useVocal('en-US')

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

| Argument | Type | Default | Description |
| --- | --- | --- | --- |
| `commands` | `CommandsMap \| null` | `undefined` | A `{ key: callback }` map (optional; omitting is treated as no commands). Keys are lowercased internally. Callbacks receive `(rawInput, commandKey)`. |
| `precision` | `number` | `0.4` | Fuse.js score threshold for **phrase** command keys only (lower = stricter). Single-word keys use exact lookup. |

#### Return value & matching rules

`useCommands` returns a `triggerCommand(rawInput)` function. Passing a transcript runs it against the commands map and invokes the matching callback if any, returning its result. It returns `null` when no command matches (and a callback that itself returns `null` is treated as no-match and falls through).

Matching, in order: single-word keys use exact case-insensitive lookup (each word of a multi-word transcript tried individually); phrase keys use Fuse.js fuzzy matching gated by `precision`; the first non-`null` callback result wins. See [Vocal commands](#vocal-commands) for the full precedence, homophone, and fuse.js-fallback semantics.

### `isSupported`

`isSupported` returns `true` when the browser supports the Web Speech API and the MediaDevices API that `@untemps/vocal` relies on. (The Permissions API is used at runtime to watch microphone permission, but it is **not** part of the support check.) It is safe to call during server-side rendering — it returns `false` when `window` is undefined.

```javascript
import { Vocal, isSupported } from '@untemps/react-vocal'

const App = () => {
	return isSupported() ? <Vocal /> : <p>Your browser does not support Web Speech API</p>
}
```

Pass a [custom engine](#custom-speech-engines) factory to probe **that** backend instead of the Web Speech API — useful when you ship a cloud or on-device engine to browsers where `SpeechRecognition` is missing:

```javascript
import { isSupported } from '@untemps/react-vocal'
import { createGladiaEngine } from './gladiaEngine'

const engine = createGladiaEngine({ apiKey })
isSupported(engine) // probes the engine's own support (microphone + transport) instead of SpeechRecognition
```

### `classifyError` & `VocalError`

`onError` (and `useVocal().start` rejections) surface a structured `VocalError` so consumers can branch on a stable category. See [Error handling](#error-handling) for the conceptual branching example.

```typescript
interface VocalError {
	type: 'permission-denied' | 'no-speech' | 'network' | 'audio-capture' | 'service-not-allowed' | 'aborted' | 'unknown'
	message: string
	original: unknown
}
```

Mapping rules:

| `type` | Source |
| --- | --- |
| `permission-denied` | `SpeechRecognitionErrorEvent` `not-allowed` or `DOMException` `NotAllowedError` |
| `no-speech` | `SpeechRecognitionErrorEvent` `no-speech` |
| `network` | `SpeechRecognitionErrorEvent` `network` |
| `audio-capture` | `SpeechRecognitionErrorEvent` `audio-capture` or `DOMException` `NotFoundError` / `NotReadableError` |
| `service-not-allowed` | `SpeechRecognitionErrorEvent` `service-not-allowed` |
| `aborted` | `SpeechRecognitionErrorEvent` `aborted` or `DOMException` `AbortError` |
| `unknown` | Anything else (generic Errors, non-Error values) |

The `classifyError(err)` helper used internally is also exported for consumers who want to apply the same classification to errors caught at the `useVocal().start({ signal })` call site.

### Events

Subscribe to these through `useVocal().subscribe` / `unsubscribe` (or the corresponding `on*` props on `<Vocal>`):

| Event | Description |
| --- | --- |
| `audioend` | Fired when the user agent has finished capturing audio for recognition. |
| `audiostart` | Fired when the user agent has started to capture audio for recognition. |
| `end` | Fired when the recognition service has disconnected. |
| `error` | Fired when a recognition error occurs. |
| `nomatch` | Fired when the recognition service returns a final result with no significant recognition. |
| `permission` | Fired with the current microphone `PermissionState` when first observed and on every change. The handler receives `(event, state)` where `state` is `'granted'`/`'denied'`/`'prompt'`. See [Microphone permission](#microphone-permission). |
| `result` | Fired when the recognition service returns a result. The handler receives `(event, transcript, alternatives)` — **event first**. |
| `soundend` | Fired when any sound — recognisable or not — has stopped being detected. |
| `soundstart` | Fired when any sound — recognisable or not — has been detected. |
| `speechend` | Fired when speech recognized by the recognition service has stopped being detected. |
| `speechstart` | Fired when sound recognized by the recognition service as speech has been detected. |
| `start` | Fired when the recognition service has begun listening to incoming audio. |

> The raw `result` event handler signature is `(event, transcript, alternatives)` — event first — which is distinct from the `onResult` prop's `(bestAlternative, event)` order. Likewise the `permission` event handler receives `(event, state)`.

### TypeScript types

`@untemps/react-vocal` is written in TypeScript and ships full type declarations. The public surface is typed end-to-end:

- **Component props** — `VocalProps`, `OnResultCallback`, `OnErrorCallback`
- **Hook shapes** — `UseVocalActions`, `UseVocalReturn`, `CommandCallback`, `CommandsMap`, `TriggerCommand`
- **Error classification** — `VocalError`, `VocalErrorType` (the [`classifyError`](#classifyerror--vocalerror) helper is a value export)
- **`isSupported`** — a value export re-exported from `@untemps/vocal`
- **Engine authoring** — `SpeechEngineFactory`, `SpeechEngineInstance`, `SpeechEngineContext`, `CreateVocalOptions`, `EngineBackend`, `EngineConnectContext`, `EngineSession` — re-exported from `@untemps/vocal`; see [Custom speech engines](#custom-speech-engines)

```typescript
import { Vocal, useVocal, isSupported, createEngine, type VocalProps, type CommandsMap } from '@untemps/react-vocal'
```

The optional TypeScript peer dependency is noted in [Installation](#installation).

## Custom speech engines

By default `Vocal` and `useVocal` drive the browser's Web Speech API. Pass an `engine` — any `SpeechEngineFactory` — to target a different backend instead: a cloud STT service (Gladia, Deepgram, OpenAI…) or an on-device model. Because a custom engine does not rely on `SpeechRecognition`, it also brings speech recognition to browsers that lack it (e.g. Firefox). Omitting `engine` keeps the built-in Web Speech engine, so existing code is unaffected.

```tsx
import { Vocal, createEngine } from '@untemps/react-vocal'

const engine = createEngine({
	isSupported: () => typeof WebSocket !== 'undefined',
	async connect({ stream, signal, language, options, emitTranscript, emitError, end }) {
		// Stream `stream` to your backend, then push transcripts back to Vocal:
		//   emitTranscript(text, { isFinal }) → the base applies the interim/continuous policy
		//   emitError(message)                → emits a well-formed `error` event
		//   end({ flush: true })              → flush the aggregated transcript and emit `end`
		return {
			stop() {
				/* graceful close; call end({ flush: true }) once the transport drains */
			},
			abort() {
				/* immediate teardown of the transport and the stream */
			},
		}
	},
})

const App = () => <Vocal engine={engine} lang="en-US" interimResults onResult={(text) => console.log(text)} />
```

The engine authoring surface is re-exported from `@untemps/vocal`, so you can build one without adding a second dependency:

| Export | Kind | Description |
| --- | --- | --- |
| `createEngine` | function | Scaffolds a `SpeechEngineFactory` from a small backend (`isSupported?` + `connect`). It owns microphone acquisition, `AbortSignal` handling, the `fr-FR → fr` language reduction, transcript aggregation in continuous mode, and the `start`/`result`/`end`/`error` lifecycle — your backend implements only its transport. |
| `WebSpeechEngine` | function | The built-in Web Speech engine factory — the default backend used when no `engine` is passed. |
| _types_ | types | `SpeechEngineFactory`, `SpeechEngineInstance`, `SpeechEngineContext`, `CreateVocalOptions`, `EngineBackend`, `EngineConnectContext`, `EngineSession` for engine authors. |

Wrap the engine in `useMemo` so its identity stays stable across renders — see [Stable references & memoization](#stable-references--memoization).

See the [`@untemps/vocal` custom-engine guide](https://github.com/untemps/vocal#custom-speech-engines) for the full contract and additional reference backends.

### Example: Gladia cloud engine

The [demo](./dev) wires a real [Gladia](https://gladia.io) engine behind this seam — it streams PCM16 audio to Gladia over a WebSocket (an `AudioWorklet` converts Float32 → PCM16 off the main thread) and maps Gladia's partial/final transcripts onto `onResult`:

```tsx
import { useMemo } from 'react'
import { Vocal } from '@untemps/react-vocal'
import { createGladiaEngine } from './gladiaEngine' // demo engine — see dev/src/lib/gladiaEngine.ts

const GladiaMic = ({ apiKey, lang }: { apiKey: string; lang: string }) => {
	const engine = useMemo(() => createGladiaEngine({ apiKey }), [apiKey])
	return <Vocal engine={engine} lang={lang} continuous interimResults onResult={(text) => console.log(text)} />
}
```

Serve the demo (see [Development](#development)) and open the **Custom engine — Gladia** card to try it (bring your own [Gladia](https://gladia.io) API key). The key stays in the browser and is proxied through Vite for local convenience — in production, mint short-lived credentials server-side and never ship a raw key to the client.

## Testing

The library has no dedicated injection prop — tests inject a custom vocal instance through standard vitest module mocking. Build a minimal `VocalInstance`-shaped object and return it from a mocked `createVocal`:

```typescript
import { createVocal, type VocalInstance } from '@untemps/vocal'
import { render } from '@testing-library/react'
import { Vocal } from '@untemps/react-vocal'

vi.mock('@untemps/vocal', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@untemps/vocal')>()
	return { ...actual, createVocal: vi.fn(actual.createVocal) }
})

const buildMockVocal = () => {
	const handlers: Record<string, ((...args: unknown[]) => void)[]> = {}
	return {
		start: vi.fn(async () => {}),
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

The same pattern works for `useVocal`. There is no public prop or argument to swap the vocal instance — the module-level mock is the supported, stable entry point for both `Vocal` and `useVocal`.

## Development

The component can be served for development purpose on `http://localhost:10001/` using:

```
yarn dev
```

## Contributing

Contributions are warmly welcomed:

- Fork the repository
- Create a feature branch (preferred name convention: `[feature type]_[imperative verb]-[description of the feature]`)
- Develop the feature AND write the tests (or write the tests AND develop the feature)
- Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/)
- Submit a Pull Request

## License

[MIT](./LICENSE) © Vincent Le Badezet
