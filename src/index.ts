export {
	Vocal,
	classifyError,
	type VocalProps,
	type OnResultCallback,
	type OnErrorCallback,
	type VocalError,
	type VocalErrorType,
} from './components/Vocal'
export { useVocal, type UseVocalActions, type UseVocalReturn } from './hooks/useVocal'
export { useCommands, type CommandCallback, type CommandsMap, type TriggerCommand } from './hooks/useCommands'
export { isSupported } from '@untemps/vocal'
