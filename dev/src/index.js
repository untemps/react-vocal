import 'regenerator-runtime/runtime'
import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import Vocal from '../../src'

const App = () => {
	const [logs, setLogs] = useState('')

	const _log = (value) => setLogs((logs) => `${logs}${logs.length > 0 ? '\n' : ''} ----- ${value}`)

	const _onVocalStart = () => {
		_log('start')
	}

	const _onVocalEnd = () => {
		_log(`end`)
	}

	const _onVocalResult = (result) => {
		_log(`result: "${result}"`)
	}

	const _onVocalError = (e) => {
		_log(e.message)
	}

	return (
		<>
			<Vocal onStart={_onVocalStart} onEnd={_onVocalEnd} onResult={_onVocalResult} onError={_onVocalError} />
			<textarea value={logs} rows={30} disabled style={{ width: '100%', marginTop: 16 }} />
		</>
	)
}

ReactDOM.render(<App />, document.getElementById('root'))
