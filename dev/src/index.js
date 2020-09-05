import 'regenerator-runtime/runtime'
import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import Vocal from '../../src'

const App = () => {
	const [result, setResult] = useState('')
	const [logs, setLogs] = useState('')

	const _onVocalStart = () => {
		setResult('')
		setLogs((logs) => `${logs}\nstart`)
	}

	const _onVocalEnd = () => {
		setLogs((logs) => `${logs}\nend`)
	}

	const _onVocalResult = (result) => {
		setResult(result)
		setLogs((logs) => `${logs}\nresult: "${result}"`)
	}

	const _onVocalError = (e) => {
		setLogs((logs) => `${logs}\n${e.message}`)
	}

	return (
		<div
			style={{
				backgroundColor: '#eeeeee',
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexDirection: 'column',
			}}
		>
			<div style={{ position: 'relative' }}>
				<Vocal
					onStart={_onVocalStart}
					onEnd={_onVocalEnd}
					onResult={_onVocalResult}
					onError={_onVocalError}
					style={{ position: 'absolute', right: 6, top: 16 }}
				/>
				<input
					defaultValue={result}
					style={{
						width: 300,
						height: 50,
						paddingLeft: 16,
						paddingRight: 32,
						backgroundColor: 'white',
						border: 'none',
						boxShadow: '10px 10px 5px -6px rgba(0,0,0,0.2)',
					}}
				/>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', marginTop: 32 }}>
				<label htmlFor="logsarea">Logs:</label>
				<textarea
					id="logsarea"
					value={logs}
					rows={12}
					disabled
					style={{
						width: 300,
						paddingLeft: 16,
						paddingRight: 32,
						marginTop: 8,
						backgroundColor: 'white',
						border: 'none',
						boxShadow: '10px 10px 5px -6px rgba(0,0,0,0.2)',
						resize: 'none',
						outline: 'none',
					}}
				/>
			</div>
		</div>
	)
}

ReactDOM.render(<App />, document.getElementById('root'))
