import { MicIcon } from '../lib/icons.jsx'

/**
 * Shared three-state mic visual (idle / listening / speaking) used by the
 * render-prop cards. Pass the toggle handler from <Vocal>'s children function.
 */
export const MicButton = ({ listening, speaking = false, disabled = false, onClick, label }) => {
	const state = listening ? (speaking ? 'mic--speaking' : 'mic--listening') : ''
	return (
		<button
			type="button"
			className={`mic ${listening ? 'mic--listening' : ''} ${state}`.trim()}
			aria-pressed={listening}
			aria-label={label ?? (listening ? 'Stop listening' : 'Start listening')}
			disabled={disabled}
			onClick={onClick}
		>
			<MicIcon />
		</button>
	)
}
