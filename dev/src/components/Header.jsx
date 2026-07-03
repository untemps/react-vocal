import { useClipboard } from '../lib/useClipboard.js'
import { CheckIcon, CopyIcon, GithubIcon, MoonIcon, PackageIcon, SunIcon } from '../lib/icons.jsx'

const INSTALL_CMD = 'yarn add @untemps/react-vocal'

export const Header = ({ theme, onToggleTheme }) => {
	const [copied, copy] = useClipboard()
	return (
		<header className="header">
			<div className="container header__inner">
				<span className="brand">
					<img className="brand__icon" src="/react-vocal-icon.png" alt="" width="28" height="28" />
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
					{copied ? <CheckIcon size={17} /> : <CopyIcon size={17} />}
				</button>

				<div className="header__actions">
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
					<button
						type="button"
						className="iconbtn"
						onClick={onToggleTheme}
						aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
					>
						{theme === 'dark' ? <SunIcon /> : <MoonIcon />}
					</button>
				</div>
			</div>
		</header>
	)
}
