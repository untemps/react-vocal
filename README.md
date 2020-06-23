# @untemps/react-vocal

React component to initiate a SpeechRecognition session.

![npm](https://img.shields.io/npm/v/@untemps/react-vocal?style=for-the-badge)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/untemps/react-vocal/deploy?style=for-the-badge)
![Codecov](https://img.shields.io/codecov/c/github/untemps/react-vocal?style=for-the-badge)

## Disclaimer

The [Web Speech API](https://developer.mozilla.org/fr/docs/Web/API/Web_Speech_API) is supported by Chrome only so far. On other browsers, the `Vocal` component won't display anything.

## Installation

```bash
yarn add @untemps/react-vocal
```

## Usage

Import the `Vocal` component:

```javascript
import Vocal from '@untemps/react-vocal'
```

Instantiate it:

```javascript
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

By default, `Vocal` displays an icon with two states (idle/listening):

![Idle icon](./icon-idle.png)
![Listening icon](./icon-listening.png)

But you can provide your own component:

```javascript
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

## API

| Props         | Type   | Default | Description                                                             |
| ------------- | ------ | ------- | ----------------------------------------------------------------------- |
| timeout       | number | 3000    | Defines the time in ms to wait before discarding the recognition        |
| style         | object | null    | Defines the styles of the default element if className is not specified |
| className     | string | null    | Defines the class of the default element                                |
| onStart       | func   | null    | Defines the handler called when the recognition starts                  |
| onEnd         | func   | null    | Defines the handler called when the recognition ends                    |
| onSpeechStart | func   | null    | Defines the handler called when the speech starts                       |
| onSpeechEnd   | func   | null    | Defines the handler called when the speech ends                         |
| onResult      | func   | null    | Defines the handler called when a result is recognized                  |
| onError       | func   | null    | Defines the handler called when an error occurs                         |
| onNoMatch     | func   | null    | Defines the handler called when no result can be recognized             |

## Todos

-   Rewrite with TypeScript
-   Expose SpeechRecognition properties via props
-   Add a connector management to plug external speech-to-text services in
