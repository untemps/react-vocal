import Vocal from './components/Vocal'
import { Vocal as SpeechRecognitionWrapper } from '@untemps/vocal'

export { default as useVocal } from './hooks/useVocal'
export const isSupported = SpeechRecognitionWrapper.isSupported

export default Vocal
