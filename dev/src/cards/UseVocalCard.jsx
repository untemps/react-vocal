import { useEffect, useState } from 'react'

import { useVocal } from '../../../src'

import { Card } from '../components/Card.jsx'
import { PermissionPill, StatusPill } from '../components/Pill.jsx'

const CODE = `import { useVocal } from '@untemps/react-vocal'

const [ref, { start, stop, abort, subscribe, unsubscribe, isRecording, permissionState }] =
  useVocal('en-US')

useEffect(() => {
  const onResult = (event, best) => console.log(best)
  subscribe('result', onResult)
  return () => unsubscribe('result', onResult)
}, [subscribe, unsubscribe])`

const stamp = () => {
	const d = new Date()
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

export const UseVocalCard = ({ supported }) => {
	const [, { start, stop, abort, subscribe, unsubscribe, isRecording, permissionState }] = useVocal('en-US')
	const [log, setLog] = useState([])

	useEffect(() => {
		if (!supported) return
		const push = (event, detail) => setLog((prev) => [{ t: stamp(), event, detail }, ...prev].slice(0, 24))
		const handlers = {
			start: () => push('start'),
			speechstart: () => push('speechstart'),
			speechend: () => push('speechend'),
			result: (_event, best) => push('result', best),
			nomatch: () => push('nomatch'),
			end: () => push('end'),
			error: (err) => push('error', err?.error ?? err?.message ?? 'error'),
		}
		Object.entries(handlers).forEach(([type, fn]) => subscribe(type, fn))
		return () => Object.entries(handlers).forEach(([type, fn]) => unsubscribe(type, fn))
	}, [subscribe, unsubscribe, supported])

	return (
		<Card
			title="The useVocal hook"
			badge="useVocal"
			description="For full control, drive a session yourself: start / stop / abort, subscribe to the raw recognition events, and read isRecording and permissionState. Everything below is wired straight to the hook."
			code={CODE}
		>
			<div className="card__stage">
				<div className="pill-row" style={{ justifyContent: 'flex-start' }}>
					<StatusPill listening={isRecording} />
					<PermissionPill state={permissionState} />
				</div>
				<div className="control__row">
					<button
						type="button"
						className="btn btn--primary"
						onClick={() => start().catch(() => {})}
						disabled={!supported || isRecording}
					>
						start()
					</button>
					<button type="button" className="btn" onClick={stop} disabled={!supported || !isRecording}>
						stop()
					</button>
					<button
						type="button"
						className="btn btn--ghost"
						onClick={abort}
						disabled={!supported || !isRecording}
					>
						abort()
					</button>
				</div>
				<div className="log" role="log" aria-label="recognition events">
					{log.map((entry, i) => (
						<div className="log__line" key={`${entry.t}-${i}`}>
							<span className="log__time">{entry.t}</span>
							<span className="log__event">{entry.event}</span>
							{entry.detail && <span>{entry.detail}</span>}
						</div>
					))}
				</div>
				{!supported && <p className="hint">Controls are disabled — no Web Speech API in this browser.</p>}
			</div>
		</Card>
	)
}
