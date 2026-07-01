import { CopyButton } from './CopyButton.jsx'

/** Collapsible "View source" panel with copy-to-clipboard. */
export const CodeBlock = ({ code, summary = 'View source', open = false }) => (
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
