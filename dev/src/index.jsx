import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { Vocal } from '../../src'

// Mixed command map: single-word keys (exact lookup, fire even when embedded in a phrase)
// alongside a phrase key (fuzzy matching). See #246 — a phrase key must not disable the
// single-word matching, so saying "je veux du rouge" still triggers `rouge`.
const COMMANDS = {
	rouge: 'red',
	bleu: 'blue',
	vert: 'green',
	jaune: 'yellow',
	'change la bordure en orange': 'orange',
}

const App = () => {
	const [logs, setLogs] = useState('')
	const [borderColor, setBorderColor] = useState()
	const [continuous, setContinuous] = useState(false)
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
				lang="fr"
				commands={commands}
				continuous={continuous}
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
				Permission micro : <code>{permission ?? 'inconnue'}</code>
			</p>
			<p style={{ fontSize: 12, color: '#666', margin: '8px 0' }}>
				<label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					<input type="checkbox" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} />
					Mode continu
				</label>
			</p>
			<p style={{ fontSize: 12, color: '#666', margin: '8px 0' }}>
				Commandes :{' '}
				{Object.keys(COMMANDS).map((k, i) => (
					<span key={k}>
						{i > 0 && ', '}
						<code>{k}</code>
					</span>
				))}{' '}
				— les mots simples se déclenchent même dans une phrase (ex : «&nbsp;je veux du rouge&nbsp;»), la
				commande phrase tolère les approximations
			</p>
			<textarea value={logs} rows={30} disabled style={{ width: '100%', borderColor }} />
		</>
	)
}

createRoot(document.getElementById('root')).render(<App />)
