import Fuse from 'fuse.js'

const useCommands = (commands, precision = 0.4) => {
	commands = !!commands
		? Object.entries(commands)?.reduce((acc, [key, value]) => ({ ...acc, [key.toLowerCase()]: value }), {})
		: {}

	const keys = Object.keys(commands)
	// Fuzzy matching is only needed for phrase command keys.
	// Single-word keys use exact case-insensitive lookup — simpler and no false positives.
	const hasPhraseKeys = keys.some((k) => k.includes(' '))
	const fuse = hasPhraseKeys ? new Fuse(keys, { includeScore: true, ignoreLocation: true }) : null

	const triggerCommand = (input) => {
		if (!keys.length) return null

		if (!hasPhraseKeys) {
			const words = input.trim().split(/\s+/)
			const targets = words.length > 1 ? words : [input.trim()]
			for (const w of targets) {
				const key = w.toLowerCase()
				if (key in commands) return commands[key]?.(w)
			}
			return null
		}

		const result = fuse.search(input).filter((r) => r.score < precision)
		if (result?.length) {
			const key = result[0].item.toLowerCase()
			return commands[key]?.(input)
		}
		return null
	}

	return triggerCommand
}

export default useCommands
