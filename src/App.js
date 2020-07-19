import React, { useState } from 'react'

import Vocal, { isSupported } from '@untemps/react-vocal'

const LANGS = {
	'ar-SA': 'Arabic Saudi Arabia',
	'cs-CZ': 'Czech Czech Republic',
	'da-DK': 'Danish Denmark',
	'de-DE': 'German Germany',
	'el-GR': 'Modern Greek Greece',
	'en-AU': 'English Australia',
	'en-GB': 'English United Kingdom',
	'en-IE': 'English Ireland',
	'en-US': 'English United States',
	'en-ZA': 'English South Africa',
	'es-ES': 'Spanish Spain',
	'es-MX': 'Spanish Mexico',
	'fi-FI': 'Finnish Finland',
	'fr-CA': 'French Canada',
	'fr-FR': 'French France',
	'he-IL': 'Hebrew Israel',
	'hi-IN': 'Hindi India',
	'hu-HU': 'Hungarian Hungary',
	'id-ID': 'Indonesian Indonesia',
	'it-IT': 'Italian Italy',
	'ja-JP': 'Japanese Japan',
	'ko-KR': 'Korean Republic of Korea',
	'nl-BE': 'Dutch Belgium',
	'nl-NL': 'Dutch Netherlands',
	'no-NO': 'Norwegian Norway',
	'pl-PL': 'Polish Poland',
	'pt-BR': 'Portuguese Brazil',
	'pt-PT': 'Portuguese Portugal',
	'ro-RO': 'Romanian Romania',
	'ru-RU': 'Russian Russian Federation',
	'sk-SK': 'Slovak Slovakia',
	'sv-SE': 'Swedish Sweden',
	'th-TH': 'Thai Thailand',
	'tr-TR': 'Turkish Turkey',
	'zh-CN': 'Chinese China',
	'zh-HK': 'Chinese Hong Kong',
	'zh-TW': 'Chinese Taiwan',
}

const App = () => {
	const [result, setResult] = useState('')
	const [lang, setLang] = useState('en-US')

	const _onVocalStart = () => setResult('')

	const _onVocalResult = (result) => setResult(result)

	const _onLangChange = (e) => setLang(e.target.value)

	const _onInputChange = (e) => setResult(e.target.value)

	return (
		<div className="container w-full max-w-4xl h-screen flex flex-col items-center justify-center mx-auto p-10">
			{!isSupported && (
				<div
					className="w-full bg-red-400 text-indigo-100 leading-none rounded-full flex items-center px-12 py-6 mb-6"
					role="alert"
				>
					<div className="py-1">
						<svg
							className="fill-current h-6 w-6 text-white mr-4"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
						>
							<path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
						</svg>
					</div>

					<div>
						<p className="font-display font-bold text-left">
							Web Speech API is not supported by your browser
						</p>
						<p className="font-display text-left">Please switch to Chrome</p>
					</div>
				</div>
			)}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="100%"
				height="100%"
				viewBox="0 0 24 24"
				className="text-teal-500 inline-block h-12 w-12"
			>
				<g>
					<path
						fill="black"
						d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"
					/>
					<circle fill="red" cx="16" cy="4" r="4" />
				</g>
			</svg>
			<h1 className="font-display font-bold text-2xl xs:text-4xl text-center leading-none mb-6">react-vocal</h1>
			<div className="w-full flex flex-col mx-auto">
				<p className="font-display text-base leading-none ml-6 mb-6">
					1<hr className="inline-block h-1 w-1 border-none rounded-full bg-primary mx-1" />
					Choose a lang option...
				</p>
				<div className="relative w-40 mb-10">
					<select
						value={lang}
						onChange={_onLangChange}
						className="font-display text-gray-700 leading-tight appearance-none border rounded-full w-full py-6 pl-6 pr-12 focus:outline-none focus:shadow-outline"
					>
						{Object.keys(LANGS).map((lang) => (
							<option>{lang}</option>
						))}
					</select>
					<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-gray-700">
						<svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
							<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
						</svg>
					</div>
				</div>
				<p className="font-display text-base leading-none ml-6 mb-6">
					2<hr className="inline-block h-1 w-1 border-none rounded-full bg-primary mx-1" />
					Click the microphone icon below and say something...
				</p>
				<div className="relative w-full mb-10">
					<Vocal
						lang={lang}
						onStart={_onVocalStart}
						onResult={_onVocalResult}
						className="absolute w-6 right-0 mr-4 top-0 mt-6"
					/>
					<input
						value={result}
						onChange={_onInputChange}
						className="font-display text-gray-700 leading-tight appearance-none border rounded-full w-full py-6 pl-6 pr-12 focus:outline-none focus:shadow-outline"
					/>
				</div>
			</div>
			<hr className="h-4 w-4 border-none rounded-full bg-primary" />
		</div>
	)
}

export default App
