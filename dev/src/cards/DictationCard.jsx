import { useState } from 'react'

import { Vocal } from '../../../src'

import { Card } from '../components/Card.jsx'
import { Pill, StatusPill } from '../components/Pill.jsx'

const CODE = `import { Vocal } from '@untemps/react-vocal'

<Vocal
  lang="en-US"
  continuous            // keep the session open across pauses
  interimResults        // stream provisional words as they are heard
  silenceTimeout={4000} // auto-stop after 4s of silence
  onResult={(text, event) => {
    const isFinal = event.results?.[event.resultIndex]?.isFinal
    isFinal ? commit(text) : setLiveCaption(text)
  }}
/>`

export const DictationCard = ({ supported }) => {
	const [silenceTimeout, setSilenceTimeout] = useState(4000)
	const [committed, setCommitted] = useState('')
	const [interim, setInterim] = useState('')
	const [listening, setListening] = useState(false)
	const [speaking, setSpeaking] = useState(false)

	const onResult = (text, event) => {
		const segment = event?.results?.[event.resultIndex ?? 0]
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
			title="Live dictation"
			badge="continuous + interimResults"
			description="Continuous mode keeps listening across pauses; interimResults streams provisional words in real time. The session auto-stops after silenceTimeout ms of quiet."
			code={CODE}
		>
			<div className="card__stage">
				<div className="control__row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
					<label className="control control--inline">
						<span className="control__label">silenceTimeout</span>
						<input
							className="field field--sm"
							type="number"
							min={0}
							step={500}
							value={silenceTimeout}
							onChange={(e) => setSilenceTimeout(Number(e.target.value))}
						/>
						<span className="hint">ms</span>
					</label>
					<div className="pill-row">
						<StatusPill listening={listening} />
						{speaking && <Pill tone="live">speaking</Pill>}
					</div>
				</div>

				<div style={{ display: 'flex', justifyContent: 'center' }}>
					{supported ? (
						<Vocal
							lang="en-US"
							continuous
							interimResults
							silenceTimeout={silenceTimeout || null}
							style={{ width: 44, height: 44 }}
							onStart={() => {
								setListening(true)
								setInterim('')
							}}
							onEnd={() => {
								setListening(false)
								setSpeaking(false)
								setInterim('')
							}}
							onSpeechStart={() => setSpeaking(true)}
							onSpeechEnd={() => setSpeaking(false)}
							onResult={onResult}
						/>
					) : (
						<p className="hint">Microphone recognition isn’t available in this browser.</p>
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
			</div>
		</Card>
	)
}
