import Vocal from './components/Vocal'
import SpeechRecognitionWrapper from './core/SpeechRecognitionWrapper'

export { default as useVocal } from './hooks/useVocal'
export const isSupported = SpeechRecognitionWrapper.isSupported

export default Vocal
