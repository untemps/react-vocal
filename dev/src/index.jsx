import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { Vocal } from '../../src'

const COMMANDS = {
	red: 'red',
	blue: 'blue',
	green: 'green',
	yellow: 'yellow',
	'change the border to orange': 'orange',
}

const App = () => {
	const [logs, setLogs] = useState('')
	const [borderColor, setBorderColor] = useState()
	const [continuous, setContinuous] = useState(false)
	const [silenceTimeout, setSilenceTimeout] = useState(5000)
	const [permission, setPermission] = useState(null)

	const _log = (value) => setLogs((prev) => `${prev}${prev.length > 0 ? '\n' : ''} ----- ${value}`)

	// Memoized to avoid recreating the commands object (and re-indexing useCommands) on every render
	const commands = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(COMMANDS).map(([key, color]) => [
					key,
					(rawInput, commandKey) => {
						_log(`command matched: "${commandKey}" → ${color}`)
						setBorderColor(color)
					},
				])
			),
		[]
	)

	return (
		<>
			<Vocal
				lang="en-US"
				commands={commands}
				continuous={continuous}
				silenceTimeout={silenceTimeout}
				onStart={() => _log('start')}
				onEnd={() => _log('end')}
				onResult={(result) => _log(`transcript: "${result}"`)}
				onError={(e) => _log(`error: ${e.message}`)}
				onPermission={(state) => {
					setPermission(state)
					_log(`permission: ${state}`)
				}}
				maxAlternatives={3}
			/>
			<p style={{ fontSize: 12, color: '#666', margin: '8px 0' }}>
				Microphone permission: <code>{permission ?? 'unknown'}</code>
			</p>
			<p style={{ fontSize: 12, color: '#666', margin: '8px 0' }}>
				<label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					<input type="checkbox" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} />
					Continuous mode
				</label>
			</p>
			<p style={{ fontSize: 12, color: '#666', margin: '8px 0' }}>
				<label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					Silence timeout (ms)
					<input
						type="number"
						min={0}
						step={500}
						value={silenceTimeout ?? ''}
						disabled={!continuous}
						onChange={(e) => setSilenceTimeout(e.target.value === '' ? null : Number(e.target.value))}
						style={{ width: 80 }}
					/>
				</label>
				— in continuous mode the session auto-stops after this many ms of silence; leave empty (or 0) to
				require a button click
			</p>
			<p style={{ fontSize: 12, color: '#666', margin: '8px 0' }}>
				Commands:{' '}
				{Object.keys(COMMANDS).map((k, i) => (
					<span key={k}>
						{i > 0 && ', '}
						<code>{k}</code>
					</span>
				))}{' '}
				— single words fire even inside a sentence (e.g. “I want some red”), and the phrase command tolerates
				approximations
			</p>
			<textarea value={logs} rows={30} disabled style={{ width: '100%', borderColor }} />
		</>
	)
}

createRoot(document.getElementById('root')).render(<App />)
