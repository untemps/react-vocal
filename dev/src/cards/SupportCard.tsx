import { Card } from '../components/Card'
import { Pill } from '../components/Pill'

const CODE = `import { isSupported } from '@untemps/react-vocal'

if (isSupported()) {
  renderMicUI()
} else {
  // Web Speech API missing (Firefox, insecure context):
  // hide the mic and offer a typed fallback instead.
  renderKeyboardFallback()
}`

export const SupportCard = ({ supported }: { supported: boolean }) => (
	<Card
		title="Feature detection"
		badge="isSupported"
		description="Before showing a mic, call isSupported(). With no argument it returns true only when the browser exposes the Web Speech API and microphone access; pass a custom engine factory and it probes that backend instead. The single check that drives graceful degradation across this whole page."
		code={CODE}
	>
		<div className="card__stage card__stage--center">
			<Pill tone={supported ? 'ok' : 'warn'}>
				{supported ? 'Supported in this browser' : 'Not available in this browser'}
			</Pill>
			<p className="hint">
				Works in Chrome, Edge and Safari. Firefox doesn’t ship <code>SpeechRecognition</code> — but a custom
				engine (see the Gladia card) brings recognition there too. Every browser still needs a secure context
				(HTTPS, or localhost).
			</p>
		</div>
	</Card>
)
