import { useEffect, useMemo, useState } from 'react'

import { Vocal } from '@untemps/react-vocal'

import { Card } from '../components/Card'
import { StatusPill } from '../components/Pill'
import { LANGUAGES } from '../components/LanguageSelector'

const COMMAND_SETS: Record<string, Record<string, string>> = {
	en: {
		red: '#e8231e',
		green: '#1f9d57',
		blue: '#2b6cb0',
		yellow: '#c9a227',
		'change the border to orange': '#e07b1a',
	},
	fr: {
		rouge: '#e8231e',
		vert: '#1f9d57',
		bleu: '#2b6cb0',
		jaune: '#c9a227',
		'change la bordure en orange': '#e07b1a',
	},
	es: {
		rojo: '#e8231e',
		verde: '#1f9d57',
		azul: '#2b6cb0',
		amarillo: '#c9a227',
		'cambia el borde a naranja': '#e07b1a',
	},
	de: {
		rot: '#e8231e',
		grün: '#1f9d57',
		blau: '#2b6cb0',
		gelb: '#c9a227',
		'ändere den rahmen zu orange': '#e07b1a',
	},
	it: {
		rosso: '#e8231e',
		verde: '#1f9d57',
		blu: '#2b6cb0',
		giallo: '#c9a227',
		'cambia il bordo in arancione': '#e07b1a',
	},
	pt: {
		vermelho: '#e8231e',
		verde: '#1f9d57',
		azul: '#2b6cb0',
		amarelo: '#c9a227',
		'muda a borda para laranja': '#e07b1a',
	},
	nl: {
		rood: '#e8231e',
		groen: '#1f9d57',
		blauw: '#2b6cb0',
		geel: '#c9a227',
		'verander de rand naar oranje': '#e07b1a',
	},
	pl: {
		czerwony: '#e8231e',
		zielony: '#1f9d57',
		niebieski: '#2b6cb0',
		żółty: '#c9a227',
		'zmień ramkę na pomarańczowy': '#e07b1a',
	},
	ru: {
		красный: '#e8231e',
		зелёный: '#1f9d57',
		синий: '#2b6cb0',
		жёлтый: '#c9a227',
		'сделай рамку оранжевой': '#e07b1a',
	},
}

const SUPPORTED = 'English, French, Spanish, German, Italian, Portuguese, Dutch, Polish or Russian'

const CODE = `import { Vocal } from '@untemps/react-vocal'

const commands = {
  red:    () => setColor('red'),
  green:  () => setColor('green'),
  blue:   () => setColor('blue'),
  // multi-word keys are matched fuzzily (needs fuse.js)
  'change the border to orange': () => setColor('orange'),
}

<Vocal lang="en-US" commands={commands} maxAlternatives={3} />`

export const CommandsCard = ({ supported, lang }: { supported: boolean; lang: string }) => {
	const primary = lang.split('-')[0].toLowerCase()
	const set = COMMAND_SETS[primary] ?? null

	const [color, setColor] = useState<string | null>(null)
	const [matched, setMatched] = useState<string | null>(null)
	const [alternatives, setAlternatives] = useState<string[]>([])
	const [noMatch, setNoMatch] = useState(false)
	const [listening, setListening] = useState(false)

	useEffect(() => {
		setColor(null)
		setMatched(null)
		setAlternatives([])
		setNoMatch(false)
		// A language change tears down any active <Vocal> (unsupported languages unmount it, and
		// useVocal recreates its instance on lang change), so onEnd may never fire — reset listening
		// here too, otherwise StatusPill stays stuck on "listening…".
		setListening(false)
	}, [primary])

	const commands = useMemo(
		() =>
			set
				? Object.fromEntries(
						Object.entries(set).map(([key, value]) => [
							key,
							(_rawInput: string, commandKey: string) => {
								setColor(value)
								setMatched(commandKey)
								setNoMatch(false)
							},
						])
					)
				: {},
		[set]
	)

	const examples = set
		? Object.keys(set)
				.map((word) => `“${word}”`)
				.join(', ')
		: ''
	const label = LANGUAGES.find((entry) => entry.code === lang)?.label ?? lang

	return (
		<Card
			title="Voice commands"
			badge="commands"
			description="Map spoken words to callbacks. Single words match exactly; multi-word phrases match fuzzily. maxAlternatives={3} surfaces homophones so “red” still fires if the engine heard “read”. The command set follows the selected language."
			code={CODE}
		>
			<div className="card__stage card__stage--center">
				{!supported ? (
					<p className="hint">Microphone recognition isn’t available in this browser.</p>
				) : !set ? (
					<p className="hint">
						This demo defines its color commands for Latin-script and Cyrillic European languages only, so
						they aren’t available for {label}. Switch to {SUPPORTED} to try them.
					</p>
				) : (
					<>
						<Vocal
							lang={lang}
							commands={commands}
							maxAlternatives={3}
							onStart={() => {
								setListening(true)
								setNoMatch(false)
							}}
							onEnd={() => setListening(false)}
							onResult={(_best, event) => {
								const segment = (event as SpeechRecognitionEvent).results?.[0]
								setAlternatives(segment ? Array.from(segment, (alt) => alt.transcript) : [])
							}}
							onNoMatch={() => setNoMatch(true)}
						/>
						<StatusPill listening={listening} />
						<div
							aria-label="command target"
							style={{
								width: '100%',
								height: 56,
								borderRadius: 12,
								border: `3px solid ${color ?? 'var(--border-strong)'}`,
								transition: 'border-color 0.2s ease',
								display: 'grid',
								placeItems: 'center',
								color: 'var(--text-muted)',
								fontSize: 'var(--step--1)',
							}}
						>
							{matched ? `matched: “${matched}”` : 'say a color'}
						</div>
						{alternatives.length > 0 && (
							<div className="chips" aria-label="recognition alternatives">
								{alternatives.map((alt, i) => (
									<span key={`${alt}-${i}`} className={`chip ${i === 0 ? 'chip--best' : ''}`.trim()}>
										{alt}
									</span>
								))}
							</div>
						)}
						<p className="hint">{noMatch ? `No command matched — try ${examples}.` : `Say ${examples}.`}</p>
					</>
				)}
			</div>
		</Card>
	)
}
