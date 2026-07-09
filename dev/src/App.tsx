import { useMemo, useState } from 'react'

import { isSupported } from '@untemps/react-vocal'

import { useTheme } from './lib/useTheme'
import { Header } from './components/Header'
import { SupportBanner } from './components/SupportBanner'
import { LanguageSelector } from './components/LanguageSelector'
import { Footer } from './components/Footer'

import { DefaultButtonCard } from './cards/DefaultButtonCard'
import { CommandsCard } from './cards/CommandsCard'
import { DictationCard } from './cards/DictationCard'
import { GladiaCard } from './cards/GladiaCard'
import { RenderPropCard } from './cards/RenderPropCard'
import { ErrorsCard } from './cards/ErrorsCard'
import { UseVocalCard } from './cards/UseVocalCard'
import { UseCommandsCard } from './cards/UseCommandsCard'
import { SupportCard } from './cards/SupportCard'

export const App = () => {
	const [theme, toggleTheme] = useTheme()
	const [lang, setLang] = useState('en-US')
	const supported = useMemo(() => isSupported(), [])

	return (
		<div className="page">
			<Header theme={theme} onToggleTheme={toggleTheme} />

			<main className="container" id="main">
				<section className="intro">
					<span className="intro__eyebrow">
						<span className="brand__dot" />
						Web Speech API + custom engines · React
					</span>
					<h1>
						Speech recognition for React, in <span className="accent">one component</span>.
					</h1>
					<p>
						Voice commands, live dictation, custom buttons and typed errors — plus a pluggable engine seam
						that swaps the browser’s Web Speech API for a cloud or on-device backend. Every card is live;
						open “View source” for the code.
					</p>
					<div className="intro__meta">
						<span>
							Click a mic and speak — recognition runs in your browser, or in a cloud engine you plug in.
						</span>
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
					Nine focused examples, one capability each — from the drop-in button to a Gladia cloud engine.
				</p>

				<LanguageSelector value={lang} onChange={setLang} />

				<div className="grid">
					<DefaultButtonCard supported={supported} lang={lang} />
					<CommandsCard supported={supported} lang={lang} />
					<DictationCard supported={supported} lang={lang} />
					<GladiaCard lang={lang} />
					<RenderPropCard supported={supported} lang={lang} />
					<UseVocalCard supported={supported} lang={lang} />
					<UseCommandsCard />
					<ErrorsCard />
					<SupportCard supported={supported} />
				</div>
			</main>

			<Footer />
		</div>
	)
}
