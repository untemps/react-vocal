import {
	createEngine,
	type EngineConnectContext,
	type EngineSession,
	type SpeechEngineFactory,
} from '@untemps/react-vocal'

const GLADIA_INIT_URL = '/gladia-api/v2/live'
const SAMPLE_RATE = 16000
const STOP_GRACE_MS = 2000

interface GladiaConfig {
	apiKey: string
}

interface GladiaMessage {
	type?: string
	data?: { is_final?: boolean; utterance?: { text?: string } }
}

export const createGladiaEngine = ({ apiKey }: GladiaConfig): SpeechEngineFactory =>
	createEngine({
		isSupported: () => typeof WebSocket !== 'undefined',
		connect: async ({
			stream,
			signal,
			language,
			options,
			emitTranscript,
			emitError,
			end,
		}: EngineConnectContext): Promise<EngineSession> => {
			let audioContext: AudioContext | null = null
			let workletNode: AudioWorkletNode | null = null
			let source: MediaStreamAudioSourceNode | null = null
			let closed = false
			let closeTimer: ReturnType<typeof setTimeout> | null = null

			const clearCloseTimer = (): void => {
				if (closeTimer !== null) {
					clearTimeout(closeTimer)
					closeTimer = null
				}
			}

			const releaseAudio = (): void => {
				workletNode?.disconnect()
				source?.disconnect()
				stream.getTracks().forEach((track) => track.stop())
				audioContext?.close()
				workletNode = source = audioContext = null
			}

			const initSession = async (sampleRate: number): Promise<string> => {
				const response = await fetch(GLADIA_INIT_URL, {
					method: 'POST',
					signal,
					headers: { 'x-gladia-key': apiKey, 'content-type': 'application/json' },
					body: JSON.stringify({
						encoding: 'wav/pcm',
						sample_rate: sampleRate,
						bit_depth: 16,
						channels: 1,
						language_config: { languages: [language] },
						messages_config: { receive_partial_transcripts: options.interimResults },
					}),
				})
				if (!response.ok) {
					throw new Error(`Gladia init failed (${response.status} ${response.statusText})`)
				}
				const { url } = (await response.json()) as { url: string }
				return url
			}

			const startAudio = async (socket: WebSocket): Promise<void> => {
				await audioContext!.resume()
				await audioContext!.audioWorklet.addModule('/pcm-worklet.js')
				source = audioContext!.createMediaStreamSource(stream)
				workletNode = new AudioWorkletNode(audioContext!, 'pcm-processor')
				workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
					if (socket.readyState === WebSocket.OPEN) socket.send(event.data)
				}
				source.connect(workletNode)
				workletNode.connect(audioContext!.destination)
			}

			const handleMessage = (event: MessageEvent): void => {
				if (closed) return
				let message: GladiaMessage
				try {
					message = JSON.parse(event.data as string)
				} catch {
					return
				}
				if (message.type !== 'transcript') return
				emitTranscript(message.data?.utterance?.text ?? '', { isFinal: message.data?.is_final ?? false })
			}

			try {
				audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
				const url = await initSession(audioContext.sampleRate)
				const socket = await new Promise<WebSocket>((resolve, reject) => {
					let opened = false
					const ws = new WebSocket(url)
					const onAbort = () => {
						ws.onclose = null
						ws.close()
						const error = new Error('Aborted')
						error.name = 'AbortError'
						reject(error)
					}
					if (signal?.aborted) return onAbort()
					signal?.addEventListener('abort', onAbort, { once: true })
					const clearAbort = () => signal?.removeEventListener('abort', onAbort)
					ws.onopen = () => {
						startAudio(ws).then(
							() => {
								clearAbort()
								opened = true
								resolve(ws)
							},
							(error) => {
								clearAbort()
								ws.onclose = null
								ws.close()
								reject(error)
							}
						)
					}
					ws.onmessage = handleMessage
					ws.onerror = () => {
						clearAbort()
						if (opened && !closed) emitError('Gladia WebSocket error')
						reject(new Error('Gladia WebSocket error'))
					}
					ws.onclose = () => {
						if (!opened) {
							clearAbort()
							reject(new Error('Gladia WebSocket closed before opening'))
							return
						}
						if (closed) return
						closed = true
						clearCloseTimer()
						releaseAudio()
						end({ flush: true })
					}
				})

				return {
					stop() {
						if (closed) return
						if (socket.readyState === WebSocket.OPEN) {
							socket.send(JSON.stringify({ type: 'stop_recording' }))
						}
						releaseAudio()
						closeTimer = setTimeout(() => socket.close(), STOP_GRACE_MS)
					},
					abort() {
						if (closed) return
						closed = true
						clearCloseTimer()
						socket.onclose = null
						socket.close()
						releaseAudio()
					},
				}
			} catch (error) {
				releaseAudio()
				throw error
			}
		},
	})
