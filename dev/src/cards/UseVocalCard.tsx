import { useEffect, useState } from 'react'

import { useVocal } from '@untemps/react-vocal'

import { Card } from '../components/Card'
import { PermissionPill, StatusPill } from '../components/Pill'

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

interface LogEntry {
	t: string
	event: string
	detail?: string
}

export const UseVocalCard = ({ supported, lang }: { supported: boolean; lang: string }) => {
	const [, { start, stop, abort, subscribe, unsubscribe, isRecording, permissionState }] = useVocal(lang)
	const [log, setLog] = useState<LogEntry[]>([])

	useEffect(() => {
		if (!supported) return
		const push = (event: string, detail?: string) =>
			setLog((prev) => [{ t: stamp(), event, detail }, ...prev].slice(0, 24))
		const onStart = () => push('start')
		const onSpeechStart = () => push('speechstart')
		const onSpeechEnd = () => push('speechend')
		const onResult = (_event: SpeechRecognitionEvent, best: string) => push('result', best)
		const onNoMatch = () => push('nomatch')
		const onEnd = () => push('end')
		const onError = (event: SpeechRecognitionErrorEvent) => push('error', event.error || event.message)
		subscribe('start', onStart)
		subscribe('speechstart', onSpeechStart)
		subscribe('speechend', onSpeechEnd)
		subscribe('result', onResult)
		subscribe('nomatch', onNoMatch)
		subscribe('end', onEnd)
		subscribe('error', onError)
		return () => {
			unsubscribe('start', onStart)
			unsubscribe('speechstart', onSpeechStart)
			unsubscribe('speechend', onSpeechEnd)
			unsubscribe('result', onResult)
			unsubscribe('nomatch', onNoMatch)
			unsubscribe('end', onEnd)
			unsubscribe('error', onError)
		}
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
