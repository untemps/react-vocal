#!/usr/bin/env node
/**
 * Build guard for issue #267.
 *
 * The published bundles must leave React's automatic JSX runtime external so
 * element creation is performed by the *consumer's* React. If the runtime gets
 * inlined (e.g. because `rollupOptions.external` stops matching the
 * `react/jsx-runtime` subpath), the bundle embeds a build-time copy of React's
 * jsx factory and stamps elements with that React version's element symbol,
 * which crashes every consumer on a different major (React 16/17/18 only accept
 * `Symbol.for('react.element')`, React 19 uses `react.transitional.element`).
 *
 * This script fails the build if either bundle:
 *   - inlines a React element symbol (`react.transitional.element` / `react.element`), or
 *   - does not reference the external `react/jsx-runtime` module.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Derive the bundles to check from package.json's entry points so this guard
// never drifts from the actual build output (`module` -> ESM, `main` -> CJS).
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const bundles = [...new Set([pkg.module, pkg.main].filter(Boolean))]

// React element symbols that must never be inlined — their presence pins element
// creation to the build's React version instead of the consumer's (see header).
const inlinedElementSymbols = ['react.transitional.element', 'react.element']

const errors = []

for (const bundle of bundles) {
	let source
	try {
		source = readFileSync(join(root, bundle), 'utf8')
	} catch {
		errors.push(`${bundle}: file not found — run \`yarn build\` first.`)
		continue
	}

	for (const symbol of inlinedElementSymbols) {
		if (source.includes(symbol)) {
			errors.push(
				`${bundle}: inlined React element symbol "${symbol}" detected — ` +
					`react/jsx-runtime leaked into the bundle (see issue #267).`,
			)
		}
	}

	if (!source.includes('react/jsx-runtime')) {
		errors.push(
			`${bundle}: no reference to "react/jsx-runtime" — the JSX runtime is not ` +
				`externalized as expected (see issue #267).`,
		)
	}

	// fuse.js is an optional peer. Its lazy import() must carry a `webpackIgnore`
	// marker so consumer bundlers (webpack/CRA/Next) leave it to runtime resolution
	// instead of statically resolving it and failing the build when it is absent.
	// The library minifier strips the comment, so the build ships unminified — this
	// guard fails if the marker ever disappears (e.g. minify gets re-enabled).
	const fuseImport = source.match(/import\(([^)]*fuse\.js[^)]*)\)/)
	if (fuseImport && !fuseImport[1].includes('webpackIgnore')) {
		errors.push(
			`${bundle}: the import('fuse.js') lost its "webpackIgnore" marker — ` +
				`consumer bundlers will hard-resolve the optional fuse.js peer and break builds when it is absent.`,
		)
	}
}

if (errors.length > 0) {
	console.error('✖ Bundle verification failed:')
	for (const error of errors) console.error(`  - ${error}`)
	process.exit(1)
}

console.log(
	`✔ Bundle verification passed: ${bundles.join(', ')} keep react/jsx-runtime external and fuse.js consumer-ignorable.`,
)
