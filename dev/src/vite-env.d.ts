/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_GLADIA_API_KEY?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

declare const process: {
	env: {
		NODE_ENV?: string
	}
}
