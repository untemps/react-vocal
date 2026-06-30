// Minimal ambient `process` so the code can branch on `process.env.NODE_ENV`
// without @types/node; bundlers (Vite) replace the expression at build time.
declare const process: {
	env: {
		NODE_ENV?: string
	}
}
