class MediaDevices {
	__stream = null

	constructor() {}

	async getUserMedia() {
		return await Promise.resolve(this.__stream)
	}
}

export default {
	mock: (stream = null) => {
		const mediaDevices = new MediaDevices(stream)
		mediaDevices.__stream = stream
		global.navigator.mediaDevices = mediaDevices
	},

	unmock: () => {
		delete global.navigator.mediaDevices
	},
}
