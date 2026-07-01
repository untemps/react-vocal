import { useState } from 'react'

import { Vocal } from '../../../src'

import { Card } from '../components/Card.jsx'
import { MicButton } from '../components/MicButton.jsx'
import { PermissionPill } from '../components/Pill.jsx'

const CODE = `import { Vocal } from '@untemps/react-vocal'

<Vocal lang="en-US">
  {(start, stop, isStarted, permissionState) => (
    <MyMicButton
      pressed={isStarted}
      permission={permissionState}
      onClick={isStarted ? stop : start}
    />
  )}
</Vocal>`

export const RenderPropCard = ({ supported }) => {
	const [transcript, setTranscript] = useState('')
	const [speaking, setSpeaking] = useState(false)

	return (
		<Card
			title="Bring your own button"
			badge="children as function"
			description="Pass a function child to fully own the UI. You receive start, stop, the live isStarted flag and the microphone permissionState — wire them into any component you like."
			code={CODE}
		>
			<div className="card__stage card__stage--center">
				{supported ? (
					<Vocal
						lang="en-US"
						onSpeechStart={() => setSpeaking(true)}
						onSpeechEnd={() => setSpeaking(false)}
						onEnd={() => setSpeaking(false)}
						onResult={(result) => setTranscript(result)}
					>
						{(start, stop, isStarted, permissionState) => (
							<div style={{ display: 'grid', gap: 'var(--space-3)', justifyItems: 'center' }}>
								<MicButton
									listening={isStarted}
									speaking={speaking}
									onClick={isStarted ? stop : start}
								/>
								<PermissionPill state={permissionState} />
							</div>
						)}
					</Vocal>
				) : (
					<p className="hint">Microphone recognition isn’t available in this browser.</p>
				)}
				<p className="transcript">
					{transcript || <span className="transcript__placeholder">Custom mic → your transcript here…</span>}
				</p>
			</div>
		</Card>
	)
}
