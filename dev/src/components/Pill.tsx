import type { ReactNode } from 'react'

const PERMISSION_TONE: Record<PermissionState, string> = {
	granted: 'ok',
	denied: 'danger',
	prompt: 'warn',
}

interface PillProps {
	tone?: string
	dot?: boolean
	children: ReactNode
}

export const Pill = ({ tone = '', dot = true, children }: PillProps) => (
	<span className={`pill ${tone ? `pill--${tone}` : ''}`.trim()}>
		{dot && <span className="pill__dot" />}
		{children}
	</span>
)

/** Microphone permission state as a color-coded pill. */
export const PermissionPill = ({ state }: { state: PermissionState | null }) => (
	<Pill tone={(state && PERMISSION_TONE[state]) || ''}>permission: {state ?? 'unknown'}</Pill>
)

/** Listening indicator. */
export const StatusPill = ({ listening }: { listening: boolean }) =>
	listening ? <Pill tone="live">listening…</Pill> : <Pill dot={false}>idle</Pill>
