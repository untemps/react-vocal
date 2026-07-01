import { useClipboard } from '../lib/useClipboard.js'
import { CheckIcon, CopyIcon, GithubIcon, MoonIcon, PackageIcon, SunIcon } from '../lib/icons.jsx'
import { Pill } from './Pill.jsx'

const INSTALL_CMD = 'npm i @untemps/react-vocal'

export const Header = ({ theme, onToggleTheme, supported }) => {
	const [copied, copy] = useClipboard()
	return (
		<header className="header">
			<div className="container header__inner">
				<span className="brand">
					<span className="brand__dot" />
					react-vocal
				</span>

				<span className="header__spacer" />

				<button
					type="button"
					className="install"
					onClick={() => copy(INSTALL_CMD)}
					aria-label={copied ? 'Copied install command' : 'Copy install command'}
				>
					<code>{INSTALL_CMD}</code>
					{copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
				</button>

				<Pill tone={supported ? 'ok' : 'warn'}>{supported ? 'API supported' : 'API unavailable'}</Pill>

				<div className="header__actions">
					<button
						type="button"
						className="iconbtn"
						onClick={onToggleTheme}
						aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
					>
						{theme === 'dark' ? <SunIcon /> : <MoonIcon />}
					</button>
					<a
						className="iconbtn"
						href="https://github.com/untemps/react-vocal"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="GitHub repository"
					>
						<GithubIcon />
					</a>
					<a
						className="iconbtn"
						href="https://www.npmjs.com/package/@untemps/react-vocal"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="npm package"
					>
						<PackageIcon />
					</a>
				</div>
			</div>
		</header>
	)
}
