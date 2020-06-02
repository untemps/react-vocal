import { EventDispatcher } from '@untemps/event-dispatcher'

class PermissionStatus extends EventDispatcher {
	__currentState = 'granted'
	__pendingState = 'granted'

	get state() {
		return this.__currentState
	}

	constructor() {
		super()
	}

	addEventListener(type, callback) {
		if (type !== 'change') return
		const event = {
			target: {
				state: this.__pendingState,
			},
		}
		callback(event)
	}
}

class Permissions {
	__currentState = null
	__pendingState = null

	constructor() {}

	async query() {
		const status = new PermissionStatus()
		status.__currentState = this.__currentState
		status.__pendingState = this.__pendingState
		return await Promise.resolve(status)
	}
}

export default {
	mock: (currentState = null, pendingState = null) => {
		const permissions = new Permissions()
		permissions.__currentState = currentState
		permissions.__pendingState = pendingState
		global.navigator.permissions = permissions
	},

	unmock: () => {
		delete global.navigator.permissions
	},
}
