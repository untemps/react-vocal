import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'react-vocal-theme'

const getSystemTheme = (): Theme =>
	typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const getStored = (): Theme | null => {
	try {
		const value = localStorage.getItem(STORAGE_KEY)
		return value === 'light' || value === 'dark' ? value : null
	} catch {
		return null
	}
}

/**
 * Resolves the active theme from an explicit user choice (persisted) or the OS
 * setting, and keeps <html data-theme> + the address-bar color in sync.
 */
export const useTheme = (): [Theme, () => void] => {
	const [override, setOverride] = useState<Theme | null>(getStored)
	const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme)

	useEffect(() => {
		const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
		if (!mql) return
		const onChange = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light')
		mql.addEventListener('change', onChange)
		return () => mql.removeEventListener('change', onChange)
	}, [])

	const theme = override ?? systemTheme

	useEffect(() => {
		const root = document.documentElement
		if (override) {
			root.dataset.theme = override
		} else {
			delete root.dataset.theme
		}
	}, [override])

	const toggle = useCallback(() => {
		setOverride((prev) => {
			const next: Theme = (prev ?? getSystemTheme()) === 'dark' ? 'light' : 'dark'
			try {
				localStorage.setItem(STORAGE_KEY, next)
			} catch {
				// Ignore storage failures (private mode, disabled cookies) — theme still applies for the session.
			}
			return next
		})
	}, [])

	return [theme, toggle]
}
