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

	const singleWordKeys = useMemo(() => keys.filter((k) => !k.includes(' ')), [keys])
	const phraseKeys = useMemo(() => keys.filter((k) => k.includes(' ')), [keys])

	// Lazy-loaded so consumers using only single-word commands incur no bundle cost.
	const fuseRef = useRef<Fuse<string> | null>(null)

	useEffect(() => {
		if (!phraseKeys.length) {
			fuseRef.current = null
			return
		}
		// Race guard: discard the result if the effect re-runs or unmounts before the
		// dynamic import resolves, so a stale Fuse instance can't overwrite fuseRef.current.
		let cancelled = false
		import(/* webpackIgnore: true */ /* @vite-ignore */ 'fuse.js')
			.then((module) => {
				if (cancelled) return
				const FuseCtor = (module.default ?? module) as unknown as typeof Fuse
				fuseRef.current = new FuseCtor(phraseKeys, {
					includeScore: true,
					ignoreLocation: true,
					minMatchCharLength: 2,
				})
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
	}, [phraseKeys])

	const triggerCommand = useCallback<TriggerCommand>(
		(rawInput) => {
			if (!keys.length) return null

			const trimmed = rawInput.trim()
			const isMultiWord = /\s/.test(trimmed)

			const matchSingleWord = (word: string) => {
				const commandKey = word.toLowerCase()
				return Object.hasOwn(normalized, commandKey) ? normalized[commandKey]?.(word, commandKey) : null
			}

			if (singleWordKeys.length && !isMultiWord) {
				const result = matchSingleWord(trimmed)
				if (result !== null) return result
			}

			if (phraseKeys.length) {
				const fuse = fuseRef.current
				if (fuse) {
					if (isMultiWord) {
						const matches = fuse.search(rawInput).filter((r) => (r.score ?? 1) < precision)
						if (matches.length) {
							const commandKey = matches[0].item as string
							const result = normalized[commandKey]?.(rawInput, commandKey)
							if (result !== null) return result
						}
					}
				} else if (trimmed) {
					// `k.includes(lInput)` can false-positive on short input (e.g. "rouge" matches
					// "change en rouge"); accepted since this fallback only runs when fuse.js is absent.
					const lInput = trimmed.toLowerCase()
					const commandKey = phraseKeys.find((k) => lInput.includes(k) || k.includes(lInput))
					if (commandKey) {
						const result = normalized[commandKey]?.(rawInput, commandKey)
						if (result !== null) return result
					}
				}
			}

			if (singleWordKeys.length && isMultiWord) {
				for (const w of trimmed.split(/\s+/)) {
					const result = matchSingleWord(w)
					if (result !== null) return result
				}
			}

			return null
		},
		[keys, normalized, singleWordKeys, phraseKeys, precision]
	)

	return triggerCommand
}
