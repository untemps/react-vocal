import { InfoIcon } from '../lib/icons'

/**
 * Honest, always-visible note about the Web Speech API. When unsupported
 * (Firefox, insecure context) the demo is never hidden — the banner sets
 * expectations and the typed cards keep working.
 */
export const SupportBanner = ({ supported }: { supported: boolean }) =>
	supported ? (
		<div className="banner" role="note">
			<InfoIcon size={18} className="banner__icon" />
			<span>
				Speech recognition runs on a <strong>remote service</strong> (Google in Chrome, Apple in Safari), so it
				needs a network connection and a <strong>secure context</strong> (HTTPS, or localhost). Under the hood
				it uses <code>webkitSpeechRecognition</code>.
			</span>
		</div>
	) : (
		<div className="banner banner--warn" role="alert">
			<InfoIcon size={18} className="banner__icon" />
			<span>
				This browser doesn’t expose the <strong>Web Speech API</strong> (Firefox never shipped it; it also needs
				HTTPS). The microphone cards are disabled here, but the <strong>typed</strong> cards below —{' '}
				<code>useCommands</code> and the fallback input — work everywhere.
			</span>
		</div>
	)
