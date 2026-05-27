export {
	Vocal,
	classifyError,
	type VocalProps,
	type OnResultCallback,
	type OnErrorCallback,
	type VocalError,
	type VocalErrorType,
} from './components/Vocal'
export { default as useVocal } from './hooks/useVocal'
export type { UseVocalActions, UseVocalReturn } from './hooks/useVocal'
export { default as useCommands } from './hooks/useCommands'
export type { CommandCallback, CommandsMap, TriggerCommand } from './hooks/useCommands'
export { isSupported } from '@untemps/vocal'
