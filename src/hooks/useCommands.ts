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

	// Partition keys by matching strategy. Single-word keys use exact case-insensitive
	// lookup (simpler, no false positives); phrase keys use fuzzy matching. The two passes
	// are independent so a mixed map keeps single-word matching working regardless of how
	// many phrase keys it also contains.
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
				// Index only phrase keys: single-word keys are handled by exact lookup, so
				// indexing them here would let a typo'd single word fuzzy-match a key that
				// is contractually exact-only.
				fuseRef.current = new FuseCtor(phraseKeys, { includeScore: true, ignoreLocation: true })
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

			// Three passes run in priority order; each returns the first command whose callback
			// yields a non-null result. `null` is the documented "no match" sentinel (see
			// tryMatchCommand in Vocal.tsx), so a callback that returns it falls through to the
			// next pass instead of ending the scan.

			// 1. Exact single-word command for the whole utterance. Highest priority so an
			// intentional one-word command fires even when that word also appears inside a phrase
			// key (e.g. "rouge" with a { rouge, 'change la bordure en rouge' } map).
			if (singleWordKeys.length && !trimmed.includes(' ')) {
				const commandKey = trimmed.toLowerCase()
				if (commandKey in normalized) {
					const result = normalized[commandKey]?.(trimmed, commandKey)
					if (result !== null) return result
				}
			}

			// 2. Phrase keys via fuzzy matching (or substring fallback when fuse.js is absent).
			// Runs before the per-word pass so an exact/near-exact phrase wins over a single-word
			// key that merely appears inside it (#246: "change the background color" must fire the
			// phrase, not the embedded "color").
			if (phraseKeys.length) {
				const fuse = fuseRef.current
				if (fuse) {
					const matches = fuse.search(rawInput).filter((r) => (r.score ?? 1) < precision)
					if (matches.length) {
						const commandKey = (matches[0].item as string).toLowerCase()
						const result = normalized[commandKey]?.(rawInput, commandKey)
						if (result !== null) return result
					}
				} else {
					// `k.includes(lInput)` can produce false positives when input is short
					// (e.g. "rouge" matches "change en rouge"). Accepted tradeoff: this branch
					// only runs when fuse.js is absent, so degraded precision is expected.
					const lInput = rawInput.toLowerCase()
					const commandKey = phraseKeys.find((k) => lInput.includes(k) || k.includes(lInput))
					if (commandKey) {
						const result = normalized[commandKey]?.(rawInput, commandKey)
						if (result !== null) return result
					}
				}
			}

			// 3. A single-word command embedded in a multi-word utterance ("je veux du rouge"
			// fires "rouge"). Lowest priority: only reached when no phrase matched (#246).
			if (singleWordKeys.length && trimmed.includes(' ')) {
				for (const w of trimmed.split(/\s+/)) {
					const commandKey = w.toLowerCase()
					// A split word never contains a space, so this only ever hits single-word keys.
					if (commandKey in normalized) {
						const result = normalized[commandKey]?.(w, commandKey)
						if (result !== null) return result
					}
				}
			}

			return null
		},
		[keys, normalized, singleWordKeys, phraseKeys, precision]
	)

	return triggerCommand
}
