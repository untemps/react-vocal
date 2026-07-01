import { useState } from 'react'

import { Vocal } from '../../../src'

import { Card } from '../components/Card.jsx'
import { StatusPill } from '../components/Pill.jsx'

const CODE = `import { Vocal } from '@untemps/react-vocal'

<Vocal
  lang="en-US"
  onResult={(transcript) => console.log(transcript)}
/>`

export const DefaultButtonCard = ({ supported }) => {
	const [transcript, setTranscript] = useState('')
	const [listening, setListening] = useState(false)

	return (
		<Card
			title="Drop-in button"
			badge="<Vocal>"
			description="The zero-config default: render <Vocal> and you get an accessible mic button. Click, speak, and the final transcript arrives through onResult."
			code={CODE}
		>
			<div className="card__stage card__stage--center">
				{supported ? (
					<Vocal
						lang="en-US"
						style={{ width: 44, height: 44 }}
						onStart={() => setListening(true)}
						onEnd={() => setListening(false)}
						onResult={(result) => setTranscript(result)}
					/>
				) : (
					<p className="hint">Microphone recognition isn’t available in this browser.</p>
				)}
				<StatusPill listening={listening} />
				<p className="transcript">
					{transcript || <span className="transcript__placeholder">Your words will appear here…</span>}
				</p>
			</div>
		</Card>
	)
}
