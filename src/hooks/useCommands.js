import { useEffect, useMemo, useRef } from 'react'

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

	// Lazy-loaded so consumers using only single-word commands incur no bundle cost.
	const fuseRef = useRef(null)

	useEffect(() => {
		if (!hasPhraseKeys) {
			fuseRef.current = null
			return
		}
		import('fuse.js')
			.then((module) => {
				const Fuse = module.default ?? module
				fuseRef.current = new Fuse(keys, { includeScore: true, ignoreLocation: true })
			})
			.catch(() => {
				if (process.env.NODE_ENV !== 'production') {
					console.warn(
						'[react-vocal] fuse.js is not installed. Phrase command keys will fall back to exact matching. ' +
							'Install fuse.js to enable fuzzy matching: npm install fuse.js'
					)
				}
			})
	}, [hasPhraseKeys, keys])

	const triggerCommand = (rawInput) => {
		if (!keys.length) return null

		if (!hasPhraseKeys) {
			const words = rawInput.trim().split(/\s+/)
			const targets = words.length > 1 ? words : [rawInput.trim()]
			for (const w of targets) {
				const commandKey = w.toLowerCase()
				if (commandKey in normalized) return normalized[commandKey]?.(w, commandKey)
			}
			return null
		}

		const fuse = fuseRef.current
		if (fuse) {
			const result = fuse.search(rawInput).filter((r) => r.score < precision)
			if (result?.length) {
				const commandKey = result[0].item.toLowerCase()
				return normalized[commandKey]?.(rawInput, commandKey)
			}
		} else {
			// `k.includes(lInput)` can produce false positives when input is short
			// (e.g. "rouge" matches "change en rouge"). Accepted tradeoff: this branch
			// only runs when fuse.js is absent, so degraded precision is expected.
			const lInput = rawInput.toLowerCase()
			const commandKey = keys.find((k) => lInput.includes(k) || k.includes(lInput))
			if (commandKey) return normalized[commandKey]?.(rawInput, commandKey)
		}
		return null
	}

	return triggerCommand
}

export default useCommands
