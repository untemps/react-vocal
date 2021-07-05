import Fuse from 'fuse.js'

const useCommands = (commands) => {
	commands = !!commands
		? Object.entries(commands)?.reduce((acc, [key, value]) => ({ [key.toLocaleLowerCase()]: value }), {})
		: {}

	const triggerCommand = (command) => {
		const fuse = new Fuse(Object.keys(commands), { includeScore: true, ignoreLocation: true })
		const result = fuse.search(command).filter((r) => r.score < 0.4)
		if (!!result?.length) {
			const key = result[0].item.toLocaleLowerCase()
			return commands[key]?.(result)
		}
		return null
	}

	return triggerCommand
}

export default useCommands
