import { useMemo } from 'react'

import { isSupported } from '../../src'

import { useTheme } from './lib/useTheme'
import { Header } from './components/Header'
import { SupportBanner } from './components/SupportBanner'
import { Footer } from './components/Footer'

import { DefaultButtonCard } from './cards/DefaultButtonCard'
import { CommandsCard } from './cards/CommandsCard'
import { DictationCard } from './cards/DictationCard'
import { RenderPropCard } from './cards/RenderPropCard'
import { ErrorsCard } from './cards/ErrorsCard'
import { UseVocalCard } from './cards/UseVocalCard'
import { UseCommandsCard } from './cards/UseCommandsCard'
import { SupportCard } from './cards/SupportCard'

export const App = () => {
	const [theme, toggleTheme] = useTheme()
	const supported = useMemo(() => isSupported(), [])

	return (
		<div className="page">
			<Header theme={theme} onToggleTheme={toggleTheme} />

			<main className="container" id="main">
				<section className="intro">
					<span className="intro__eyebrow">
						<span className="brand__dot" />
						Web Speech API · React
					</span>
					<h1>
						Add voice to any React UI, in <span className="accent">one component</span>.
					</h1>
					<p>
						react-vocal wraps the browser’s SpeechRecognition into a component and a hook — voice commands,
						live dictation, custom buttons and typed error handling. Every card below is live; open “View
						source” to see the exact code.
					</p>
					<div className="intro__meta">
						<span>Click a mic and speak — recognition happens in your browser.</span>
						<a
							href="https://github.com/untemps/react-vocal#readme"
							target="_blank"
							rel="noopener noreferrer"
						>
							Read the docs →
						</a>
					</div>
				</section>

				<SupportBanner supported={supported} />

				<h2 className="section-title">Explore the API</h2>
				<p className="section-lead">
					Eight focused examples, one capability each — from the drop-in button to feature detection.
				</p>

				<div className="grid">
					<DefaultButtonCard supported={supported} />
					<CommandsCard supported={supported} />
					<DictationCard supported={supported} />
					<RenderPropCard supported={supported} />
					<UseVocalCard supported={supported} />
					<UseCommandsCard />
					<ErrorsCard />
					<SupportCard supported={supported} />
				</div>
			</main>

			<Footer />
		</div>
	)
}
