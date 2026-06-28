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
		// Race guard: if the effect re-runs (keys change) or unmounts before the dynamic
		// import resolves, discard the .then()/.catch() result so a stale Fuse instance
		// can't overwrite fuseRef.current.
		let cancelled = false
		import('fuse.js')
			.then((module) => {
				if (cancelled) return
				const FuseCtor = (module.default ?? module) as unknown as typeof Fuse
				// `minMatchCharLength: 2` drops single-character match segments so a stray
				// letter (e.g. "a", "c") can't score near zero against a phrase key. It does
				// not, on its own, block short whole-word fragments ("the", "to", "der") —
				// the multi-word guard in triggerCommand handles those.
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
					// Only multi-word transcripts can be a meaningful match for a (multi-word)
					// phrase key. With `ignoreLocation`, a single short word that happens to be a
					// substring of a phrase scores near zero (e.g. "the"/"to"/"der"), so a stray
					// fragment would otherwise fire the wrong command. Single words are still
					// handled by the exact single-word lookup above and the embedded scan below.
					if (isMultiWord) {
						const matches = fuse.search(rawInput).filter((r) => (r.score ?? 1) < precision)
						if (matches.length) {
							const commandKey = matches[0].item as string
							const result = normalized[commandKey]?.(rawInput, commandKey)
							if (result !== null) return result
						}
					}
				} else if (trimmed) {
					// `k.includes(lInput)` can produce false positives when input is short
					// (e.g. "rouge" matches "change en rouge"). Accepted tradeoff: this branch
					// only runs when fuse.js is absent, so degraded precision is expected.
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
