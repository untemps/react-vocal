import type { ReactNode, SVGProps } from 'react'

export type IconProps = { size?: number } & SVGProps<SVGSVGElement>

const Svg = ({ children, size = 24, ...rest }: IconProps & { children: ReactNode }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		{...rest}
	>
		{children}
	</svg>
)

export const MicIcon = (props: IconProps) => (
	<Svg {...props}>
		<rect x="9" y="2" width="6" height="12" rx="3" />
		<path d="M5 10a7 7 0 0 0 14 0" />
		<line x1="12" y1="17" x2="12" y2="22" />
	</Svg>
)

export const SunIcon = (props: IconProps) => (
	<Svg {...props}>
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
	</Svg>
)

export const MoonIcon = (props: IconProps) => (
	<Svg {...props}>
		<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
	</Svg>
)

export const CopyIcon = (props: IconProps) => (
	<Svg {...props}>
		<rect x="9" y="9" width="12" height="12" rx="2" />
		<path d="M5 15V5a2 2 0 0 1 2-2h10" />
	</Svg>
)

export const CheckIcon = (props: IconProps) => (
	<Svg {...props}>
		<path d="M20 6 9 17l-5-5" />
	</Svg>
)

export const InfoIcon = (props: IconProps) => (
	<Svg {...props}>
		<circle cx="12" cy="12" r="9" />
		<line x1="12" y1="11" x2="12" y2="16" />
		<line x1="12" y1="8" x2="12" y2="8" />
	</Svg>
)

export const GithubIcon = (props: IconProps) => (
	<Svg {...props}>
		<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
	</Svg>
)

export const PackageIcon = (props: IconProps) => (
	<Svg {...props}>
		<path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
		<path d="M3 7l9 5 9-5" />
		<path d="M12 12v10" />
	</Svg>
)

export const GlobeIcon = (props: IconProps) => (
	<Svg {...props}>
		<circle cx="12" cy="12" r="9" />
		<path d="M3 12h18" />
		<path d="M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18Z" />
	</Svg>
)
