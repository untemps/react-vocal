import { InfoIcon } from '../lib/icons'

export const SupportBanner = ({ supported }: { supported: boolean }) =>
	supported ? (
		<div className="banner" role="note">
			<InfoIcon size={18} className="banner__icon" />
			<span>
				Speech recognition runs on a <strong>remote service</strong> (Google in Chrome, Apple in Safari), so it
				needs a network connection and a <strong>secure context</strong> (HTTPS, or localhost). Under the hood
				it uses <code>webkitSpeechRecognition</code> by default — or any custom STT engine you plug in.
			</span>
		</div>
	) : (
		<div className="banner banner--warn" role="alert">
			<InfoIcon size={18} className="banner__icon" />
			<span>
				This browser doesn’t expose the <strong>Web Speech API</strong> (Firefox never shipped it; it also needs
				HTTPS), so the built-in mic cards are disabled here. But the <strong>Custom engine (Gladia)</strong>{' '}
				card still works (a pluggable engine doesn’t rely on <code>SpeechRecognition</code>), and the{' '}
				<strong>typed</strong> cards below — <code>useCommands</code> and the fallback input — work everywhere.
			</span>
		</div>
	)
