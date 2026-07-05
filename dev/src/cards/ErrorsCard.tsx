import { useState } from 'react'

import { classifyError, type VocalError, type VocalErrorType } from '@untemps/react-vocal'

import { Card } from '../components/Card'
import { Pill } from '../components/Pill'

const CODE = `import { classifyError } from '@untemps/react-vocal'

<Vocal
  onError={(error) => {
    // error.type is one of 7 stable VocalErrorType values
    showToast(FRIENDLY[error.type], error.message)
  }}
/>

// classifyError normalizes raw SpeechRecognition errors
// and getUserMedia DOMExceptions into { type, message, original }`

const SAMPLES = [
	{ label: 'permission-denied', raw: { error: 'not-allowed', message: 'Permission dismissed' } },
	{ label: 'no-speech', raw: { error: 'no-speech' } },
	{ label: 'network', raw: { error: 'network' } },
	{ label: 'audio-capture', raw: { name: 'NotFoundError', message: 'No microphone found' } },
	{ label: 'service-not-allowed', raw: { error: 'service-not-allowed' } },
	{ label: 'aborted', raw: { name: 'AbortError', message: 'The session was aborted' } },
	{ label: 'unknown', raw: new Error('Something unexpected happened') },
]

const FRIENDLY: Record<VocalErrorType, string> = {
	'permission-denied': 'Microphone access was blocked. Allow it in your browser settings to continue.',
	'no-speech': 'We didn’t catch anything — try speaking a little louder.',
	network: 'The recognition service is unreachable. Check your connection.',
	'audio-capture': 'No microphone was found. Plug one in and try again.',
	'service-not-allowed': 'The browser blocked the speech service for this page.',
	aborted: 'The session was cancelled.',
	unknown: 'Something went wrong. Please try again.',
}

export const ErrorsCard = () => {
	const [result, setResult] = useState<VocalError | null>(null)

	return (
		<Card
			title="Typed error handling"
			badge="classifyError"
			description="Raw SpeechRecognition errors and getUserMedia DOMExceptions are normalized into one of seven stable VocalErrorType values, so you can show a friendly message for each. Tap a sample to classify it."
			code={CODE}
		>
			<div className="card__stage">
				<div className="chips">
					{SAMPLES.map((sample) => (
						<button
							key={sample.label}
							type="button"
							className="chip"
							onClick={() => setResult(classifyError(sample.raw))}
						>
							{sample.label}
						</button>
					))}
				</div>

				{result ? (
					<div style={{ display: 'grid', gap: 'var(--space-2)' }}>
						<Pill tone="danger">type: {result.type}</Pill>
						<p style={{ fontSize: 'var(--step--1)' }}>{FRIENDLY[result.type]}</p>
						<p className="hint">
							message: <code>{result.message}</code>
						</p>
					</div>
				) : (
					<p className="hint">Tap a sample above to see the classified error.</p>
				)}
			</div>
		</Card>
	)
}
