import Vocal from './components/Vocal'

export { default as useVocal } from './hooks/useVocal'
export type { UseVocalActions, UseVocalReturn } from './hooks/useVocal'
export type { CommandCallback, CommandsMap, TriggerCommand } from './hooks/useCommands'
export type { VocalProps, OnResultCallback } from './components/Vocal'
export { isSupported } from '@untemps/vocal'

export default Vocal
