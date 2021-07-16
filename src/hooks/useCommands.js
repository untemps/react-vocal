import Fuse from 'fuse.js'

const useCommands = (commands, precision = 0.4) => {
	commands = !!commands
		? Object.entries(commands)?.reduce((acc, [key, value]) => ({ [key.toLowerCase()]: value }), {})
		: {}

	const triggerCommand = (input) => {
		const fuse = new Fuse(Object.keys(commands), { includeScore: true, ignoreLocation: true })
		const result = fuse.search(input).filter((r) => r.score < precision)
		if (!!result?.length) {
			const key = result[0].item.toLowerCase()
			return commands[key]?.(input)
		}
		return null
	}

	return triggerCommand
}

export default useCommands
