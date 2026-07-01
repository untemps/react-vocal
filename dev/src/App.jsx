import { useMemo } from 'react'

import { isSupported } from '../../src'

import { useTheme } from './lib/useTheme.js'
import { Header } from './components/Header.jsx'
import { SupportBanner } from './components/SupportBanner.jsx'
import { Footer } from './components/Footer.jsx'

import { DefaultButtonCard } from './cards/DefaultButtonCard.jsx'
import { CommandsCard } from './cards/CommandsCard.jsx'
import { DictationCard } from './cards/DictationCard.jsx'
import { RenderPropCard } from './cards/RenderPropCard.jsx'
import { ErrorsCard } from './cards/ErrorsCard.jsx'
import { UseVocalCard } from './cards/UseVocalCard.jsx'
import { UseCommandsCard } from './cards/UseCommandsCard.jsx'

export const App = () => {
	const [theme, toggleTheme] = useTheme()
	const supported = useMemo(() => isSupported(), [])

	return (
		<div className="page">
			<Header theme={theme} onToggleTheme={toggleTheme} supported={supported} />

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
					Seven focused examples, one capability each — from the drop-in button to the low-level hooks.
				</p>

				<div className="grid">
					<DefaultButtonCard supported={supported} />
					<CommandsCard supported={supported} />
					<DictationCard supported={supported} />
					<RenderPropCard supported={supported} />
					<UseVocalCard supported={supported} />
					<UseCommandsCard />
					<ErrorsCard />
				</div>
			</main>

			<Footer />
		</div>
	)
}
