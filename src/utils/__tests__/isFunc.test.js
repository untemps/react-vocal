import isFunc from '../isFunc'

const noop = () => null
const asyncNoop = async () => {}
const genNoop = function* () {}

describe('isFunc', () => {
	it('returns true for function', function () {
		expect(isFunc(noop)).toBeTruthy()
	})

	it('returns true for async function', function () {
		expect(isFunc(asyncNoop)).toBeTruthy()
	})

	it('returns true for generator function', function () {
		expect(isFunc(genNoop)).toBeTruthy()
	})

	it('returns false for array', function () {
		expect(isFunc([1, 2, 3])).toBeFalsy()
	})

	it('returns false for boolean', function () {
		expect(isFunc(true)).toBeFalsy()
	})

	it('returns false for date', function () {
		expect(isFunc(new Date())).toBeFalsy()
	})

	it('returns false for error', function () {
		expect(isFunc(new Error())).toBeFalsy()
	})

	it('returns false for object', function () {
		expect(isFunc({ a: 1 })).toBeFalsy()
	})

	it('returns false for number', function () {
		expect(isFunc(1)).toBeFalsy()
	})

	it('returns false for regex', function () {
		expect(isFunc(/foo/)).toBeFalsy()
	})

	it('returns false for string', function () {
		expect(isFunc('foo')).toBeFalsy()
	})

	it('returns false for DOM node', function () {
		if (document) {
			expect(isFunc(document.getElementsByTagName('body'))).toBeFalsy()
		}
	})
})
