import 'regenerator-runtime/runtime'
import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import Vocal from '../../src'

import VocalConverter, { start } from './VocalConverter'

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

	const onStartGCClick = async () => {
		try {
			const converter = new VocalConverter()
			converter.addEventListener('blobavailable', async (event) => {
				/*const blob = event.detail
                const url = URL.createObjectURL(blob)
                const audio = new Audio(url)
                audio.play()*/
				try {
					const formData = new FormData()
					formData.append('blob', event.detail, 'test')
					console.log(formData.get('blob'))
					const res = await fetch(
						'https://europe-west1-project-4148157880889261852.cloudfunctions.net/revai-job',
						{
							method: 'POST',
							body: formData,
							mode: 'no-cors',
						}
					)
					console.log(res)
				} catch (err) {
					console.log(err)
				}
			})
			converter.start()
		} catch (err) {
			console.log(err)
		}
	}

	return (
		<>
			<button onClick={onStartGCClick}>Start GC</button>
			<Vocal onStart={_onVocalStart} onEnd={_onVocalEnd} onResult={_onVocalResult} onError={_onVocalError} />
			<textarea value={logs} rows={30} disabled style={{ width: '100%', marginTop: 16 }} />
		</>
	)
}

ReactDOM.render(<App />, document.getElementById('root'))
