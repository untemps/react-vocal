import { GlobeIcon } from '../lib/icons'

export interface Language {
	code: string
	label: string
}

export const LANGUAGES: Language[] = [
	{ code: 'en-US', label: 'English (US)' },
	{ code: 'en-GB', label: 'English (UK)' },
	{ code: 'fr-FR', label: 'Français' },
	{ code: 'es-ES', label: 'Español' },
	{ code: 'de-DE', label: 'Deutsch' },
	{ code: 'it-IT', label: 'Italiano' },
	{ code: 'pt-BR', label: 'Português (Brasil)' },
	{ code: 'nl-NL', label: 'Nederlands' },
	{ code: 'pl-PL', label: 'Polski' },
	{ code: 'ru-RU', label: 'Русский' },
	{ code: 'ja-JP', label: '日本語' },
	{ code: 'ko-KR', label: '한국어' },
	{ code: 'zh-CN', label: '中文 (简体)' },
	{ code: 'hi-IN', label: 'हिन्दी' },
	{ code: 'ar-SA', label: 'العربية' },
]

interface LanguageSelectorProps {
	value: string
	onChange: (lang: string) => void
}

export const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => (
	<div className="lang-bar">
		<label className="control control--inline lang-bar__control">
			<span className="lang-bar__icon" aria-hidden="true">
				<GlobeIcon size={18} />
			</span>
			<span className="control__label">Recognition language</span>
			<select
				className="field field--sm lang-bar__select"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				aria-label="Recognition language"
			>
				{LANGUAGES.map(({ code, label }) => (
					<option key={code} value={code}>
						{label} — {code}
					</option>
				))}
			</select>
		</label>
		<span className="lang-bar__hint">Applies to the live recognition cards below.</span>
	</div>
)
