<p align="center">
    <img src="assets/react-vocal.png" alt="react-vocal" height="150"/>
</p>
<p align="center">
    A React component and hook to initiate a SpeechRecognition session
</p>

---

![npm](https://img.shields.io/npm/v/@untemps/react-vocal?style=for-the-badge)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/untemps/react-vocal/deploy?style=for-the-badge)
![Codecov](https://img.shields.io/codecov/c/github/untemps/react-vocal?style=for-the-badge)

## Links

<a href="https://untemps.github.io/react-vocal" target="_blank" rel="noopener">Demo</a>

## Disclaimer

The [Web Speech API](https://developer.mozilla.org/fr/docs/Web/API/Web_Speech_API) is only supported by few browsers so far (see [caniuse](https://caniuse.com/#search=SpeechRecognition)). If the API is not available, the `Vocal` component won't display anything.

## Installation

```bash
yarn add @untemps/react-vocal
```

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

#### Custom component

By default, `Vocal` displays an icon with two states (idle/listening):

![Idle icon](assets/icon-idle.png)
![Listening icon](assets/icon-listening.png)

But you can provide your own component:

```javascript
import Vocal from '@untemps/react-vocal'

const App = () => {
	const [isListening, setIsListening] = useState('')

	const _onSpeechStart = () => {
		setIsListening(true)
	}

	const _onSpeechEnd = () => {
		setIsListening(false)
	}

	return (
		<Vocal onSpeechStart={_onSpeechStart} onSpeechEnd={_onSpeechEnd}>
			{isListening ? 'Waiting for vocal' : <button>Click to speech</button>}
		</Vocal>
	)
}
```

The component passed as children must respect the following constraints:

-   Be a single valid element. Neither array of elements nor string.
-   Accept a `onClick` handler used to trigger the recognition session. If the component provides its own `onClick` callback, it will be overridden by the Vocal component implementation.

#### API

| Props         | Type              | Default | Description                                                                                        |
| ------------- | ----------------- | ------- | -------------------------------------------------------------------------------------------------- |
| lang          | string            | 'en-US' | Language understood by the recognition [BCP 47 language tag](https://tools.ietf.org/html/bcp47)    |
| grammars      | SpeechGrammarList | null    | Grammars understood by the recognition [JSpeech Grammar Format](https://www.w3.org/TR/jsgf/)       |
| timeout       | number            | 3000    | Time in ms to wait before discarding the recognition                                               |
| style         | object            | null    | Styles of the root element if className is not specified                                           |
| className     | string            | null    | Class of the root element                                                                       |
| onStart       | func              | null    | Handler called when the recognition starts                                                         |
| onEnd         | func              | null    | Handler called when the recognition ends                                                           |
| onSpeechStart | func              | null    | Handler called when the speech starts                                                              |
| onSpeechEnd   | func              | null    | Handler called when the speech ends                                                                |
| onResult      | func              | null    | Handler called when a result is recognized                                                         |
| onError       | func              | null    | Handler called when an error occurs                                                                |
| onNoMatch     | func              | null    | Handler called when no result can be recognized                                                    |

### `useVocal` hook

#### Basic usage

```javascript
import React, { useState } from 'react'
import { useVocal } from '@untemps/react-vocal'
import Icon from './Icon'

const App = () => {
	const [isListening, setIsListening] = useState(false)
	const [result, setResult] = useState('')

	const [, {start, subscribe}] = useVocal('fr_FR')

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

	const _onVocalResult = (result) => {
		setIsListening(false)

		setResult(result)
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
					<Icon color={isListening ? 'red': 'blue'} />
				</div>
				<input defaultValue={result} style={{ width: 300, height: 40 }} />
			</span>
		</div>
	)
}
```

#### Signature

```
useVocal(lang, grammars)
```

| Args          | Type              | Default | Description                                                                                          |
| ------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| lang          | string            | 'en-US' | Language understood by the recognition [BCP 47 language tag](https://tools.ietf.org/html/bcp47)      |
| grammars      | SpeechGrammarList | null    | Grammars understood by the recognition [JSpeech Grammar Format](https://www.w3.org/TR/jsgf/)         |

#### Return value

```
const [ref, { start, stop, abort, subscribe, unsubscribe, clean }]
```

| Args          | Type              | Description                                                 |
| ------------- | ----------------- | ----------------------------------------------------------- |
| ref           | Ref               | React ref to the SpeechRecognitionWrapper instance          |
| start         | func              | Function to start the recognition                           |
| stop          | func              | Function to stop the recognition                            |
| abort         | func              | Function to abort the recognition                           |
| subscribe     | func              | Function to subscribe to recognition events                 |
| unsubscribe   | func              | Function to unsubscribe to recognition events               |
| clean         | func              | Function to clean subscription to recognition events        |

### Browser support flag

#### Basic usage

```javascript
import Vocal, {isSupported} from '@untemps/react-vocal'

const App = () => {
	return isSupported ? (
		<Vocal />
    ) : (
        <p>Your browser does not support Web Speech API</p>
    )
}
```

### Events

| Events        | Description                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| audioend      | Fired when the user agent has finished capturing audio for recognition                              |
| audiostart    | Fired when the user agent has started to capture audio for recognition                              |
| end           | Fired when the recognition service has disconnected                                                 |
| error         | Fired when a recognition error occurs                                                               |
| nomatch       | Fired when the recognition service returns a final result with no significant recognition           |
| result        | Fired when the recognition service returns a result                                                 |
| soundend      | Fired when any sound — recognisable or not — has stopped being detected                             |
| soundstart    | Fired when any sound — recognisable or not — has been detected                                      |
| speechend     | Fired when speech recognized by the recognition service has stopped being detected                  |
| speechstart   | Fired when sound recognized by the recognition service as speech has been detected                  |
| start         | fired when the recognition service has begun listening to incoming audio                            |

### Notes

The process to grant microphone access permissions is automatically managed by the hook (internally used by the `Vocal` component).

## Todos

-   Add a connector management to plug external speech-to-text services in
