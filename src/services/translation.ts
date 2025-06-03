import { TranscriptionSegment } from '../types'

const PROXY_URL = 'undefined'
const PROXY_TOKEN = import.meta.env.VITE_PROXY_SERVER_ACCESS_TOKEN

export class TranslationService {
  // Using Web Speech API for speech recognition (browser built-in)
  private recognition: SpeechRecognition | null = null
  private isListening = false

  constructor() {
    // Check if Web Speech API is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.maxAlternatives = 1
    }
  }

  async startListening(
    language: string, 
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      onError('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    this.recognition.lang = this.getLanguageCode(language)
    this.isListening = true

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1
      const transcript = event.results[last][0].transcript
      const isFinal = event.results[last].isFinal

      onResult(transcript, isFinal)
    }

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'no-speech') {
        // Ignore no-speech errors as they're common
        return
      }
      onError(`Speech recognition error: ${event.error}`)
    }

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart recognition if it stopped unexpectedly
        try {
          this.recognition?.start()
        } catch (e) {
          console.error('Failed to restart recognition:', e)
        }
      }
    }

    try {
      this.recognition.start()
    } catch (e) {
      onError('Failed to start speech recognition. Please check microphone permissions.')
    }
  }

  stopListening(): void {
    if (this.recognition) {
      this.isListening = false
      this.recognition.stop()
    }
  }

  async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    if (sourceLanguage === targetLanguage) {
      return text
    }

    try {
      // Using LibreTranslate API (free tier available)
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PROXY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://libretranslate.com/translate',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            q: text,
            source: this.getLibreTranslateCode(sourceLanguage),
            target: this.getLibreTranslateCode(targetLanguage),
            format: 'text'
          }
        })
      })

      if (!response.ok) {
        // Fallback to MyMemory Translation API
        return await this.translateWithMyMemory(text, sourceLanguage, targetLanguage)
      }

      const data = await response.json()
      return data.translatedText || text
    } catch (error) {
      console.error('Translation error:', error)
      // Fallback to MyMemory Translation API
      return await this.translateWithMyMemory(text, sourceLanguage, targetLanguage)
    }
  }

  private async translateWithMyMemory(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    try {
      const langPair = `${sourceLanguage}|${targetLanguage}`
      const encodedText = encodeURIComponent(text)
      
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PROXY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}`,
          method: 'GET',
          headers: {},
          body: {}
        })
      })

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const data = await response.json()
      return data.responseData?.translatedText || text
    } catch (error) {
      console.error('MyMemory translation error:', error)
      return text // Return original text if translation fails
    }
  }

  private getLanguageCode(code: string): string {
    // Map to Web Speech API language codes
    const languageMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-BR',
      ru: 'ru-RU',
      zh: 'zh-CN',
      ja: 'ja-JP',
      ko: 'ko-KR',
      ar: 'ar-SA',
      hi: 'hi-IN',
      nl: 'nl-NL',
      pl: 'pl-PL',
      tr: 'tr-TR',
      sv: 'sv-SE',
      da: 'da-DK',
      no: 'nb-NO',
      fi: 'fi-FI',
      el: 'el-GR',
      he: 'he-IL',
      th: 'th-TH',
      vi: 'vi-VN',
      id: 'id-ID',
      ms: 'ms-MY',
      cs: 'cs-CZ',
      hu: 'hu-HU',
      ro: 'ro-RO',
      uk: 'uk-UA',
      bg: 'bg-BG',
      hr: 'hr-HR',
      sk: 'sk-SK',
      sl: 'sl-SI',
      et: 'et-EE',
      lv: 'lv-LV',
      lt: 'lt-LT',
      fa: 'fa-IR',
      ur: 'ur-PK',
      bn: 'bn-BD',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      ne: 'ne-NP',
      si: 'si-LK',
      my: 'my-MM',
      km: 'km-KH',
      lo: 'lo-LA'
    }
    return languageMap[code] || code
  }

  private getLibreTranslateCode(code: string): string {
    // LibreTranslate uses different language codes
    const codeMap: Record<string, string> = {
      zh: 'zh',
      he: 'he',
      no: 'no'
    }
    return codeMap[code] || code
  }

  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  getSupportedLanguages(): string[] {
    // Languages well-supported by Web Speech API
    return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'nl', 'pl', 'tr']
  }
}

export const translationService = new TranslationService()
