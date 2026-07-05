import { useMemo, useState, type FormEvent } from 'react'

import { useCommands } from '@untemps/react-vocal'

import { Card } from '../components/Card'
import { Pill } from '../components/Pill'

const CODE = `import { useCommands } from '@untemps/react-vocal'

const trigger = useCommands(
  {
    hello: () => 'greeting',
    'good morning': () => 'morning', // fuzzy phrase match
  },
  0.4 // fuzzy precision (lower = stricter)
)

// Feed it any string — a voice transcript OR typed text.
const result = trigger(userInput) // callback return, or null
`

export const UseCommandsCard = () => {
	const [input, setInput] = useState('')
	const [outcome, setOutcome] = useState<{ matched: boolean; value: unknown } | null>(null)

	const commands = useMemo(
		() => ({
			hello: () => 'greeting',
			bonjour: () => 'greeting (fr)',
			'good morning': () => 'morning wishes',
			'change the border to orange': () => 'border command',
		}),
		[]
	)
	const trigger = useCommands(commands, 0.4)

	const run = (event: FormEvent) => {
		event.preventDefault()
		const matchedValue = trigger(input)
		setOutcome({ matched: matchedValue !== null && matchedValue !== undefined, value: matchedValue })
	}

	return (
		<Card
			title="Match without a mic"
			badge="useCommands"
			description="The command matcher is decoupled from speech: feed it any string and it returns the matched callback’s result (or null). Perfect as a keyboard fallback — it works in every browser."
			code={CODE}
		>
			<div className="card__stage">
				<form onSubmit={run} style={{ display: 'flex', gap: 'var(--space-2)' }}>
					<input
						className="field"
						type="text"
						value={input}
						placeholder="try “hello”, “good mornin”, …"
						onChange={(e) => setInput(e.target.value)}
						aria-label="text to match against commands"
					/>
					<button type="submit" className="btn btn--primary" style={{ flex: 'none' }}>
						Match
					</button>
				</form>
				<p className="hint">
					Commands: <code>hello</code>, <code>bonjour</code>, <code>good morning</code>,{' '}
					<code>change the border to orange</code>
				</p>
				{outcome &&
					(outcome.matched ? (
						<Pill tone="ok">matched → {String(outcome.value)}</Pill>
					) : (
						<Pill tone="warn">no match</Pill>
					))}
			</div>
		</Card>
	)
}
