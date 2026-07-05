import { CopyButton } from './CopyButton'

interface CodeBlockProps {
	code: string
	summary?: string
	open?: boolean
}

export const CodeBlock = ({ code, summary = 'View source', open = false }: CodeBlockProps) => (
	<details className="code" open={open}>
		<summary>{summary}</summary>
		<div className="code__body">
			<CopyButton value={code} />
			<pre>
				<code>{code}</code>
			</pre>
		</div>
	</details>
)
