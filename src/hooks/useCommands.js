import { useMemo } from 'react'
import Fuse from 'fuse.js'

const useCommands = (commands, precision = 0.4) => {
	const normalized = useMemo(
		() =>
			!!commands
				? Object.entries(commands).reduce((acc, [key, value]) => ({ ...acc, [key.toLowerCase()]: value }), {})
				: {},
		[commands]
	)

	const keys = useMemo(() => Object.keys(normalized), [normalized])

	// Fuzzy matching is only needed for phrase command keys.
	// Single-word keys use exact case-insensitive lookup — simpler and no false positives.
	const hasPhraseKeys = useMemo(() => keys.some((k) => k.includes(' ')), [keys])

	// precision only applies to phrase keys — single-word keys always use exact lookup
	const fuse = useMemo(
		() => (hasPhraseKeys ? new Fuse(keys, { includeScore: true, ignoreLocation: true }) : null),
		[hasPhraseKeys, keys]
	)

	const triggerCommand = (input) => {
		if (!keys.length) return null

		if (!hasPhraseKeys) {
			const words = input.trim().split(/\s+/)
			const targets = words.length > 1 ? words : [input.trim()]
			for (const w of targets) {
				const key = w.toLowerCase()
				if (key in normalized) return normalized[key]?.(w)
			}
			return null
		}

		const result = fuse.search(input).filter((r) => r.score < precision)
		if (result?.length) {
			const key = result[0].item.toLowerCase()
			return normalized[key]?.(input)
		}
		return null
	}

	return triggerCommand
}

export default useCommands
