import { useCallback, useRef, useState } from 'react'

/**
 * Copy-to-clipboard with a transient "copied" flag for button feedback.
 * Falls back to a hidden textarea + execCommand where the async Clipboard API
 * is unavailable or blocked (older Safari, insecure contexts).
 */
export const useClipboard = (resetMs = 1600) => {
	const [copied, setCopied] = useState(false)
	const timer = useRef(null)

	const copy = useCallback(
		async (text) => {
			try {
				if (navigator.clipboard?.writeText) {
					await navigator.clipboard.writeText(text)
				} else {
					const ta = document.createElement('textarea')
					ta.value = text
					ta.setAttribute('readonly', '')
					ta.style.position = 'absolute'
					ta.style.left = '-9999px'
					document.body.appendChild(ta)
					ta.select()
					document.execCommand('copy')
					document.body.removeChild(ta)
				}
				setCopied(true)
				clearTimeout(timer.current)
				timer.current = setTimeout(() => setCopied(false), resetMs)
				return true
			} catch {
				return false
			}
		},
		[resetMs]
	)

	return [copied, copy]
}
