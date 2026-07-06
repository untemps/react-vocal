import { useEffect, useMemo, useState } from 'react'

import { Vocal, isSupported } from '@untemps/react-vocal'

import { Card } from '../components/Card'
import { Pill, StatusPill } from '../components/Pill'
import { createGladiaEngine } from '../lib/gladiaEngine'

const CODE = `import { Vocal } from '@untemps/react-vocal'
import { createGladiaEngine } from './gladiaEngine'

const engine = useMemo(() => createGladiaEngine({ apiKey }), [apiKey])

<Vocal
  engine={engine}       // swap the Web Speech API for Gladia
  lang="en-US"
  continuous            // stream until the mic is clicked again
  interimResults        // live partial transcripts while speaking
  onResult={(text, event) => {
    // interims stream live; the aggregated transcript arrives on stop
    const isFinal = event.results?.[event.resultIndex]?.isFinal
    isFinal ? commit(text) : setLiveCaption(text)
  }}
/>`

export const GladiaCard = ({ lang }: { lang: string }) => {
	const [apiKey, setApiKey] = useState((import.meta.env.VITE_GLADIA_API_KEY ?? '').trim())
	const [committed, setCommitted] = useState('')
	const [interim, setInterim] = useState('')
	const [listening, setListening] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const key = apiKey.trim()
	const engine = useMemo(() => (key ? createGladiaEngine({ apiKey: key }) : undefined), [key])
	const supported = useMemo(() => isSupported(createGladiaEngine({ apiKey: '' })), [])

	useEffect(() => {
		setListening(false)
		setInterim('')
		setError(null)
	}, [key])

	const onResult = (text: string, event: SpeechRecognitionEvent | Event) => {
		const srEvent = event as SpeechRecognitionEvent
		const segment = srEvent.results?.[srEvent.resultIndex ?? 0]
		const isFinal = segment ? segment.isFinal !== false : true
		if (isFinal) {
			setCommitted((prev) => `${prev}${prev ? ' ' : ''}${text}`.trim())
			setInterim('')
		} else {
			setInterim(text)
		}
	}

	return (
		<Card
			title="Custom engine — Gladia"
			badge="engine"
			description="The same <Vocal> component, driven by a cloud engine instead of the browser's Web Speech API. Pass an engine factory and Vocal streams the mic to Gladia over a WebSocket — bringing recognition to browsers without SpeechRecognition (e.g. Firefox). The live caption streams while you speak; the full transcript commits when you stop."
			code={CODE}
		>
			<div className="card__stage">
				{!supported ? (
					<p className="hint">
						This browser can’t reach a cloud engine — WebSocket or microphone capture is unavailable.
					</p>
				) : (
					<>
						<label className="control control--inline" style={{ width: '100%' }}>
							<span className="control__label">Gladia API key</span>
							<input
								className="field field--sm"
								type="password"
								autoComplete="off"
								placeholder="paste your key…"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								style={{ flex: 1 }}
							/>
						</label>

						<div className="control__row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
							<div className="pill-row">
								<StatusPill listening={listening} />
								{error && <Pill tone="danger">{error}</Pill>}
							</div>
						</div>

						<div style={{ display: 'flex', justifyContent: 'center' }}>
							{key ? (
								<Vocal
									engine={engine}
									lang={lang}
									continuous
									interimResults
									style={{ width: 44, height: 44 }}
									onStart={() => {
										setListening(true)
										setInterim('')
										setError(null)
									}}
									onEnd={() => {
										setListening(false)
										setInterim('')
									}}
									onResult={onResult}
									onError={(err) => {
										setListening(false)
										setError(err.message)
									}}
								/>
							) : (
								<p className="hint">Paste a Gladia API key above to try the cloud engine.</p>
							)}
						</div>

						<p className="transcript" aria-live="polite">
							{committed}
							{interim && (
								<span className="transcript__interim">
									{committed ? ' ' : ''}
									{interim}
								</span>
							)}
							{!committed && !interim && (
								<span className="transcript__placeholder">Press the mic and start dictating…</span>
							)}
						</p>

						{committed && (
							<button type="button" className="btn btn--ghost" onClick={() => setCommitted('')}>
								Clear
							</button>
						)}

						<p className="hint">
							Get a free key at gladia.io. The key stays in your browser and is proxied through Vite in
							this demo — never ship a raw key to production; mint short-lived credentials server-side.
						</p>
					</>
				)}
			</div>
		</Card>
	)
}
