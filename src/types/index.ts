export interface TranscriptionSegment {
  id: string
  text: string
  translation: string
  timestamp: Date
  sourceLanguage: string
  targetLanguage: string
  isProcessing?: boolean
}

export interface Language {
  code: string
  name: string
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
