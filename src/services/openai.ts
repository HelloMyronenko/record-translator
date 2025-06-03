import { TranscriptionSegment } from '../types'

const PROXY_URL = 'undefined'
const PROXY_TOKEN = import.meta.env.VITE_PROXY_SERVER_ACCESS_TOKEN

export class OpenAIService {
  private apiKey: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
    if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
      console.warn('OpenAI API key not configured. Please add your API key to the .env file.')
    }
  }

  async transcribeAudio(audioBlob: Blob, language: string): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')
      formData.append('model', 'whisper-1')
      formData.append('language', language)
      formData.append('response_format', 'text')

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PROXY_TOKEN}`,
        },
        body: JSON.stringify({
          url: 'https://api.openai.com/v1/audio/transcriptions',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: formData
        })
      })

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`)
      }

      const text = await response.text()
      return text.trim()
    } catch (error) {
      console.error('Transcription error:', error)
      throw error
    }
  }

  async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    try {
      const prompt = `Translate the following text from ${this.getLanguageName(sourceLanguage)} to ${this.getLanguageName(targetLanguage)}. Only provide the translation, no explanations or additional text:\n\n${text}`

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PROXY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: {
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: 'You are a professional translator. Provide accurate translations preserving the original meaning and tone.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 1000
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error('Translation error:', error)
      throw error
    }
  }

  private getLanguageName(code: string): string {
    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      hi: 'Hindi',
      nl: 'Dutch',
      pl: 'Polish',
      tr: 'Turkish',
      sv: 'Swedish',
      da: 'Danish',
      no: 'Norwegian',
      fi: 'Finnish',
      el: 'Greek',
      he: 'Hebrew',
      th: 'Thai',
      vi: 'Vietnamese',
      id: 'Indonesian',
      ms: 'Malay',
      cs: 'Czech',
      hu: 'Hungarian',
      ro: 'Romanian',
      uk: 'Ukrainian',
      bg: 'Bulgarian',
      hr: 'Croatian',
      sk: 'Slovak',
      sl: 'Slovenian',
      et: 'Estonian',
      lv: 'Latvian',
      lt: 'Lithuanian',
      fa: 'Persian',
      ur: 'Urdu',
      bn: 'Bengali',
      ta: 'Tamil',
      te: 'Telugu',
      mr: 'Marathi',
      gu: 'Gujarati',
      kn: 'Kannada',
      ml: 'Malayalam',
      pa: 'Punjabi',
      ne: 'Nepali',
      si: 'Sinhala',
      my: 'Burmese',
      km: 'Khmer',
      lo: 'Lao'
    }
    return languageNames[code] || code
  }
}

export const openAIService = new OpenAIService()
