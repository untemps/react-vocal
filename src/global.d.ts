// Ambient minimal `process` declaration so the source code can branch on
// `process.env.NODE_ENV` without pulling in the full @types/node package.
// Vite replaces the expression statically at build time; at runtime, react-vocal
// is always consumed through a bundler that performs the same replacement.
declare const process: {
	env: {
		NODE_ENV?: string
	}
}
