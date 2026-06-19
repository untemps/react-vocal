import { useCallback, useEffect, useMemo, useRef } from 'react'
import type Fuse from 'fuse.js'

export type CommandCallback = (rawInput: string, commandKey: string) => unknown

export type CommandsMap = Record<string, CommandCallback>

export type TriggerCommand = (rawInput: string) => unknown

export const useCommands = (commands?: CommandsMap | null, precision: number = 0.4): TriggerCommand => {
	const normalized = useMemo<CommandsMap>(
		() =>
			commands
				? Object.fromEntries(Object.entries(commands).map(([key, value]) => [key.toLowerCase(), value]))
				: {},
		[commands]
	)

	const keys = useMemo(() => Object.keys(normalized), [normalized])

	// Fuzzy matching is only needed for phrase command keys.
	// Single-word keys use exact case-insensitive lookup — simpler and no false positives.
	const hasPhraseKeys = useMemo(() => keys.some((k) => k.includes(' ')), [keys])

	// Lazy-loaded so consumers using only single-word commands incur no bundle cost.
	const fuseRef = useRef<Fuse<string> | null>(null)

	useEffect(() => {
		if (!hasPhraseKeys) {
			fuseRef.current = null
			return
		}
		// Race guard: if the effect re-runs (keys change) or unmounts before the dynamic
		// import resolves, discard the .then()/.catch() result so a stale Fuse instance
		// can't overwrite fuseRef.current.
		let cancelled = false
		import('fuse.js')
			.then((module) => {
				if (cancelled) return
				const FuseCtor = (module.default ?? module) as unknown as typeof Fuse
				fuseRef.current = new FuseCtor(keys, { includeScore: true, ignoreLocation: true })
			})
			.catch(() => {
				if (cancelled) return
				if (process.env.NODE_ENV !== 'production') {
					console.warn(
						'[react-vocal] fuse.js is not installed. Phrase command keys will fall back to exact matching. ' +
							'Install fuse.js to enable fuzzy matching: npm install fuse.js'
					)
				}
			})
		return () => {
			cancelled = true
		}
	}, [hasPhraseKeys, keys])

	const triggerCommand = useCallback<TriggerCommand>(
		(rawInput) => {
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
				const result = fuse.search(rawInput).filter((r) => (r.score ?? 1) < precision)
				if (result?.length) {
					const commandKey = (result[0].item as string).toLowerCase()
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
		},
		[keys, normalized, hasPhraseKeys, precision]
	)

	return triggerCommand
}
