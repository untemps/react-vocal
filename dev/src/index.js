import 'regenerator-runtime/runtime'
import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import Vocal from '../../src'

const App = () => {
	const [isListening, setIsListening] = useState(false)
	const [result, setResult] = useState('')

	const _onVocalStart = () => {
		console.log('start')
		setIsListening(true)
		setResult('')
	}

	const _onVocalEnd = () => {
		console.log('end')
		setIsListening(false)
	}

	const _onVocalResult = (result) => {
		console.log('result')
		setIsListening(false)

		setResult(result)
	}

	const _onVocalError = (e) => {
		console.error(e)
	}

	return <div style={{backgroundColor: '#eeeeee', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<span style={{ position: 'relative' }}>
				<Vocal onStart={_onVocalStart} onEnd={_onVocalEnd} onResult={_onVocalResult} onError={_onVocalError} style={{ position: 'absolute', right: 6, top: 13  }}/>
				<input defaultValue={result} style={{ width: 300, height: 40, paddingLeft: 16, paddingRight: 32, borderWidth: 2, borderStyle: 'solid', borderRadius: 5, boxShadow: '10px 10px 5px -6px rgba(0,0,0,0.2)', borderColor: isListening ? 'rgba(30, 116, 255, 1)' : 'rgba(30, 116, 255, 0)' }} />
			</span>
	</div>
}

ReactDOM.render(<App/>, document.getElementById('root'))
