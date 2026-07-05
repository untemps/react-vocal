import { MicIcon } from '../lib/icons'

interface MicButtonProps {
	listening: boolean
	speaking?: boolean
	disabled?: boolean
	onClick: () => void
	label?: string
}

export const MicButton = ({ listening, speaking = false, disabled = false, onClick, label }: MicButtonProps) => {
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
