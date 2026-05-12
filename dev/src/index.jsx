import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'

import Vocal from '../../src'

const COMMANDS = {
	rouge: 'red',
	bleu: 'blue',
	vert: 'green',
	jaune: 'yellow',
}

const App = () => {
	const [logs, setLogs] = useState('')
	const [borderColor, setBorderColor] = useState()
	const [continuous, setContinuous] = useState(false)

	const _log = (value) => setLogs((prev) => `${prev}${prev.length > 0 ? '\n' : ''} ----- ${value}`)

	// Memoized to avoid recreating the commands object (and re-indexing useCommands) on every render
	const commands = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(COMMANDS).map(([key, color]) => [
					key,
					(input) => {
						_log(`command matched: "${input}" → ${color}`)
						setBorderColor(color)
					},
				])
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
				onResult={(result) => _log(`result: "${result}"`)}
				onError={(e) => _log(`error: ${e.message}`)}
				maxAlternatives={3}
			/>
            <p style={{ fontSize: 12, color: '#666', margin: '8px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} />
                Mode continu
              </label>
            </p>
			<p style={{ fontSize: 12, color: '#666', margin: '8px 0' }}>
				Commandes :{' '}
				{Object.keys(COMMANDS).map((k, i) => (
					<span key={k}>{i > 0 && ', '}<code>{k}</code></span>
				))}
				{' '}— ou dans une phrase (ex : «&nbsp;je veux du vert&nbsp;»)
			</p>
			<textarea value={logs} rows={30} disabled style={{ width: '100%', borderColor }} />
		</>
	)
}

createRoot(document.getElementById('root')).render(<App />)
