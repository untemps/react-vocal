import type { ReactNode } from 'react'

import { CodeBlock } from './CodeBlock'

interface CardProps {
	title: ReactNode
	badge?: ReactNode
	description?: ReactNode
	code?: string
	children?: ReactNode
}

/**
 * Self-contained showcase card: title + description, a live preview "stage",
 * and a collapsible source snippet. One capability per card.
 */
export const Card = ({ title, badge, description, code, children }: CardProps) => (
	<article className="card">
		<div className="card__head">
			<h3 className="card__title">
				{title}
				{badge && <span className="card__badge">{badge}</span>}
			</h3>
			{description && <p className="card__desc">{description}</p>}
		</div>
		<div className="card__body">
			{children}
			{code && <CodeBlock code={code} />}
		</div>
	</article>
)
