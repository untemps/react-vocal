const PERMISSION_TONE = {
	granted: 'ok',
	denied: 'danger',
	prompt: 'warn',
}

export const Pill = ({ tone = '', dot = true, children }) => (
	<span className={`pill ${tone ? `pill--${tone}` : ''}`.trim()}>
		{dot && <span className="pill__dot" />}
		{children}
	</span>
)

/** Microphone permission state as a color-coded pill. */
export const PermissionPill = ({ state }) => (
	<Pill tone={PERMISSION_TONE[state] ?? ''}>permission: {state ?? 'unknown'}</Pill>
)

/** Listening indicator. */
export const StatusPill = ({ listening }) =>
	listening ? <Pill tone="live">listening…</Pill> : <Pill dot={false}>idle</Pill>
