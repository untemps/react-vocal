/// <reference types="vite/client" />

// Mirrors src/global.d.ts so the imported library source (which branches on
// process.env.NODE_ENV) typechecks here without pulling in @types/node.
declare const process: {
	env: {
		NODE_ENV?: string
	}
}
