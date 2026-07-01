import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'react-vocal-theme'

const getSystemTheme = () =>
	typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const getStored = () => {
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
export const useTheme = () => {
	const [override, setOverride] = useState(getStored)
	const [systemTheme, setSystemTheme] = useState(getSystemTheme)

	useEffect(() => {
		const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
		if (!mql) return
		const onChange = (e) => setSystemTheme(e.matches ? 'dark' : 'light')
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
			const next = (prev ?? getSystemTheme()) === 'dark' ? 'light' : 'dark'
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
