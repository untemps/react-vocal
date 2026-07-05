import { useClipboard } from '../lib/useClipboard'
import { CheckIcon, CopyIcon } from '../lib/icons'

interface CopyButtonProps {
	value: string
	label?: string
	className?: string
}

export const CopyButton = ({
	value,
	label = 'Copy code',
	className = 'btn btn--ghost code__copy',
}: CopyButtonProps) => {
	const [copied, copy] = useClipboard()
	return (
		<button type="button" className={className} onClick={() => copy(value)} aria-label={copied ? 'Copied' : label}>
			{copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
			<span aria-hidden="true">{copied ? 'Copied' : 'Copy'}</span>
			<span className="visually-hidden" role="status" aria-live="polite">
				{copied ? 'Copied to clipboard' : ''}
			</span>
		</button>
	)
}
