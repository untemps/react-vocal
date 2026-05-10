import { useEffect, useRef } from 'react'

const useCommands = (commands, precision = 0.4) => {
	commands = !!commands
		? Object.entries(commands)?.reduce((acc, [key, value]) => ({ ...acc, [key.toLowerCase()]: value }), {})
		: {}

	const keys = Object.keys(commands)
	const hasPhraseKeys = keys.some((k) => k.includes(' '))

	// Fuse.js is an optional peer dependency used only for phrase command keys.
	// It is loaded lazily so consumers who only use single-word commands incur no bundle cost.
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
	}, [hasPhraseKeys, keys.join(',')])

	const triggerCommand = (input) => {
		if (!keys.length) return null

		if (!hasPhraseKeys) {
			// Single-word keys: exact case-insensitive lookup, word-level splitting for embedded commands
			const words = input.trim().split(/\s+/)
			const targets = words.length > 1 ? words : [input.trim()]
			for (const w of targets) {
				const key = w.toLowerCase()
				if (key in commands) return commands[key]?.(w)
			}
			return null
		}

		const fuse = fuseRef.current
		if (fuse) {
			const result = fuse.search(input).filter((r) => r.score < precision)
			if (result?.length) {
				const key = result[0].item.toLowerCase()
				return commands[key]?.(input)
			}
		} else {
			// Fuse.js not yet loaded or not installed: simple case-insensitive contains match
			const lInput = input.toLowerCase()
			const match = keys.find((k) => lInput.includes(k) || k.includes(lInput))
			if (match) return commands[match]?.(input)
		}
		return null
	}

	return triggerCommand
}

export default useCommands
