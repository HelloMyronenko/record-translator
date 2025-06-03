import { TranscriptionSegment } from '../types'

export class TranslationService {
  private recognition: SpeechRecognition | null = null
  private isListening = false

  // Replace with your actual Lingvanex API key
  private lingvanexApiKey: string = 'a_FvBmQ2sCBjlG0VqZVBGa6mCzsCpbS7ZVgY1upKTB5702hQx4Kt0WABkFxdTwN96xiwj4TkKrbioHWEsi'

  constructor() {
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
      if (event.error === 'no-speech') return
      onError(`Speech recognition error: ${event.error}`)
    }

    this.recognition.onend = () => {
      if (this.isListening) {
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

    // First try dictionary-based translation
    const dictionaryTranslation = this.enhancedDictionaryTranslate(text, sourceLanguage, targetLanguage)
    if (!dictionaryTranslation.startsWith('[')) {
      return dictionaryTranslation
    }

    // Fallback to API-based translation
    return this.lingvanexTranslate(text, sourceLanguage, targetLanguage)
  }

  // private async lingvanexTranslate(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  //   const url = 'https://translate-api.lingvanex.com/translate'
  //   const params = new URLSearchParams({
  //     from: sourceLanguage,
  //     to: targetLanguage,
  //     text: text
  //   })

  //   const response = await fetch(`${url}?${params.toString()}`, {
  //     method: 'GET',
  //     headers: {
  //       'Authorization': `Bearer ${this.lingvanexApiKey}`
  //     }
  //   })

  //   if (!response.ok) {
  //     throw new Error(`Translation failed: ${response.statusText}`)
  //   }

  //   const data = await response.json()
  //   return data.translation || `[${sourceLanguage}→${targetLanguage}] ${text}`
  // }

	private async lingvanexTranslate(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  const url = 'https://api-b2b.backenster.com/b1/api/v3/translate';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.lingvanexApiKey}`
    },
    body: JSON.stringify({
      from: sourceLanguage,
      to: targetLanguage,
      data: text,
      platform: 'api' // required by Lingvanex
    })
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.result) {
    throw new Error('Invalid response from translation API.');
  }

  return data.result;
}

	
  // ... (your enhancedDictionaryTranslate and getLanguageCode implementations remain unchanged)
  // Paste your existing `enhancedDictionaryTranslate()` here
	  private enhancedDictionaryTranslate(text: string, sourceLanguage: string, targetLanguage: string): string {
    // Expanded dictionary with more phrases and words
    const dictionary: Record<string, Record<string, string>> = {
      // Greetings
      'hello': {
        'es': 'hola', 'fr': 'bonjour', 'de': 'hallo', 'it': 'ciao', 'pt': 'olá',
        'ru': 'привет', 'zh': '你好', 'ja': 'こんにちは', 'ko': '안녕하세요',
        'ar': 'مرحبا', 'hi': 'नमस्ते', 'nl': 'hallo', 'pl': 'cześć', 'tr': 'merhaba'
      },
      'good morning': {
        'es': 'buenos días', 'fr': 'bonjour', 'de': 'guten Morgen', 'it': 'buongiorno',
        'pt': 'bom dia', 'ru': 'доброе утро', 'zh': '早上好', 'ja': 'おはよう',
        'ko': '좋은 아침', 'ar': 'صباح الخير', 'hi': 'सुप्रभात', 'nl': 'goedemorgen',
        'pl': 'dzień dobry', 'tr': 'günaydın'
      },
      'good night': {
        'es': 'buenas noches', 'fr': 'bonne nuit', 'de': 'gute Nacht', 'it': 'buonanotte',
        'pt': 'boa noite', 'ru': 'спокойной ночи', 'zh': '晚安', 'ja': 'おやすみ',
        'ko': '잘자요', 'ar': 'تصبح على خير', 'hi': 'शुभ रात्रि', 'nl': 'goedenacht',
        'pl': 'dobranoc', 'tr': 'iyi geceler'
      },
      'goodbye': {
        'es': 'adiós', 'fr': 'au revoir', 'de': 'auf wiedersehen', 'it': 'arrivederci',
        'pt': 'adeus', 'ru': 'до свидания', 'zh': '再见', 'ja': 'さようなら',
        'ko': '안녕히 가세요', 'ar': 'وداعا', 'hi': 'अलविदा', 'nl': 'tot ziens',
        'pl': 'do widzenia', 'tr': 'hoşça kal'
      },
      
      // Common phrases
      'thank you': {
        'es': 'gracias', 'fr': 'merci', 'de': 'danke', 'it': 'grazie', 'pt': 'obrigado',
        'ru': 'спасибо', 'zh': '谢谢', 'ja': 'ありがとう', 'ko': '감사합니다',
        'ar': 'شكرا', 'hi': 'धन्यवाद', 'nl': 'dank je', 'pl': 'dziękuję', 'tr': 'teşekkür ederim'
      },
      'please': {
        'es': 'por favor', 'fr': 's\'il vous plaît', 'de': 'bitte', 'it': 'per favore',
        'pt': 'por favor', 'ru': 'пожалуйста', 'zh': '请', 'ja': 'お願いします',
        'ko': '제발', 'ar': 'من فضلك', 'hi': 'कृपया', 'nl': 'alsjeblieft',
        'pl': 'proszę', 'tr': 'lütfen'
      },
      'sorry': {
        'es': 'lo siento', 'fr': 'désolé', 'de': 'entschuldigung', 'it': 'scusa',
        'pt': 'desculpe', 'ru': 'извините', 'zh': '对不起', 'ja': 'ごめんなさい',
        'ko': '죄송합니다', 'ar': 'آسف', 'hi': 'माफ़ करें', 'nl': 'sorry',
        'pl': 'przepraszam', 'tr': 'özür dilerim'
      },
      'excuse me': {
        'es': 'disculpe', 'fr': 'excusez-moi', 'de': 'entschuldigung', 'it': 'mi scusi',
        'pt': 'com licença', 'ru': 'извините', 'zh': '打扰一下', 'ja': 'すみません',
        'ko': '실례합니다', 'ar': 'عفوا', 'hi': 'माफ कीजिए', 'nl': 'pardon',
        'pl': 'przepraszam', 'tr': 'pardon'
      },
      'yes': {
        'es': 'sí', 'fr': 'oui', 'de': 'ja', 'it': 'sì', 'pt': 'sim',
        'ru': 'да', 'zh': '是', 'ja': 'はい', 'ko': '네', 'ar': 'نعم',
        'hi': 'हाँ', 'nl': 'ja', 'pl': 'tak', 'tr': 'evet'
      },
      'no': {
        'es': 'no', 'fr': 'non', 'de': 'nein', 'it': 'no', 'pt': 'não',
        'ru': 'нет', 'zh': '不', 'ja': 'いいえ', 'ko': '아니요', 'ar': 'لا',
        'hi': 'नहीं', 'nl': 'nee', 'pl': 'nie', 'tr': 'hayır'
      },
      
      // Questions
      'how are you': {
        'es': '¿cómo estás?', 'fr': 'comment allez-vous?', 'de': 'wie geht es dir?',
        'it': 'come stai?', 'pt': 'como está?', 'ru': 'как дела?', 'zh': '你好吗？',
        'ja': '元気ですか？', 'ko': '어떻게 지내세요?', 'ar': 'كيف حالك؟',
        'hi': 'आप कैसे हैं?', 'nl': 'hoe gaat het?', 'pl': 'jak się masz?', 'tr': 'nasılsın?'
      },
      'what is your name': {
        'es': '¿cómo te llamas?', 'fr': 'comment vous appelez-vous?', 'de': 'wie heißt du?',
        'it': 'come ti chiami?', 'pt': 'qual é o seu nome?', 'ru': 'как тебя зовут?',
        'zh': '你叫什么名字？', 'ja': 'お名前は？', 'ko': '이름이 뭐예요?',
        'ar': 'ما اسمك؟', 'hi': 'आपका नाम क्या है?', 'nl': 'hoe heet je?',
        'pl': 'jak masz na imię?', 'tr': 'adın ne?'
      },
      'where are you from': {
        'es': '¿de dónde eres?', 'fr': 'd\'où venez-vous?', 'de': 'woher kommst du?',
        'it': 'di dove sei?', 'pt': 'de onde você é?', 'ru': 'откуда ты?',
        'zh': '你从哪里来？', 'ja': 'どこから来ましたか？', 'ko': '어디서 왔어요?',
        'ar': 'من أين أنت؟', 'hi': 'आप कहाँ से हैं?', 'nl': 'waar kom je vandaan?',
        'pl': 'skąd jesteś?', 'tr': 'nerelisin?'
      },
      
      // Numbers
      'one': {
        'es': 'uno', 'fr': 'un', 'de': 'eins', 'it': 'uno', 'pt': 'um',
        'ru': 'один', 'zh': '一', 'ja': '一', 'ko': '하나', 'ar': 'واحد',
        'hi': 'एक', 'nl': 'een', 'pl': 'jeden', 'tr': 'bir'
      },
      'two': {
        'es': 'dos', 'fr': 'deux', 'de': 'zwei', 'it': 'due', 'pt': 'dois',
        'ru': 'два', 'zh': '二', 'ja': '二', 'ko': '둘', 'ar': 'اثنان',
        'hi': 'दो', 'nl': 'twee', 'pl': 'dwa', 'tr': 'iki'
      },
      'three': {
        'es': 'tres', 'fr': 'trois', 'de': 'drei', 'it': 'tre', 'pt': 'três',
        'ru': 'три', 'zh': '三', 'ja': '三', 'ko': '셋', 'ar': 'ثلاثة',
        'hi': 'तीन', 'nl': 'drie', 'pl': 'trzy', 'tr': 'üç'
      },
      
      // Common words
      'water': {
        'es': 'agua', 'fr': 'eau', 'de': 'Wasser', 'it': 'acqua', 'pt': 'água',
        'ru': 'вода', 'zh': '水', 'ja': '水', 'ko': '물', 'ar': 'ماء',
        'hi': 'पानी', 'nl': 'water', 'pl': 'woda', 'tr': 'su'
      },
      'food': {
        'es': 'comida', 'fr': 'nourriture', 'de': 'Essen', 'it': 'cibo', 'pt': 'comida',
        'ru': 'еда', 'zh': '食物', 'ja': '食べ物', 'ko': '음식', 'ar': 'طعام',
        'hi': 'खाना', 'nl': 'eten', 'pl': 'jedzenie', 'tr': 'yemek'
      },
      'help': {
        'es': 'ayuda', 'fr': 'aide', 'de': 'Hilfe', 'it': 'aiuto', 'pt': 'ajuda',
        'ru': 'помощь', 'zh': '帮助', 'ja': '助けて', 'ko': '도움', 'ar': 'مساعدة',
        'hi': 'मदद', 'nl': 'help', 'pl': 'pomoc', 'tr': 'yardım'
      },
      'love': {
        'es': 'amor', 'fr': 'amour', 'de': 'Liebe', 'it': 'amore', 'pt': 'amor',
        'ru': 'любовь', 'zh': '爱', 'ja': '愛', 'ko': '사랑', 'ar': 'حب',
        'hi': 'प्यार', 'nl': 'liefde', 'pl': 'miłość', 'tr': 'aşk'
      },
      'friend': {
        'es': 'amigo', 'fr': 'ami', 'de': 'Freund', 'it': 'amico', 'pt': 'amigo',
        'ru': 'друг', 'zh': '朋友', 'ja': '友達', 'ko': '친구', 'ar': 'صديق',
        'hi': 'दोस्त', 'nl': 'vriend', 'pl': 'przyjaciel', 'tr': 'arkadaş'
      }
    }

    const lowerText = text.toLowerCase().trim()
    
    // Try exact match first
    if (dictionary[lowerText] && dictionary[lowerText][targetLanguage]) {
      return dictionary[lowerText][targetLanguage]
    }
    
    // Try to find partial matches
    for (const [phrase, translations] of Object.entries(dictionary)) {
      if (lowerText.includes(phrase) && translations[targetLanguage]) {
        const translated = lowerText.replace(phrase, translations[targetLanguage])
        return translated
      }
    }
    
    // Word-by-word translation attempt
    const words = lowerText.split(' ')
    const translatedWords = words.map(word => {
      if (dictionary[word] && dictionary[word][targetLanguage]) {
        return dictionary[word][targetLanguage]
      }
      return word
    })
    
    const result = translatedWords.join(' ')
    
    // If no translation was made, return with language indicator
    if (result === lowerText) {
      return `[${sourceLanguage}→${targetLanguage}] ${text}`
    }
    
    return result
  }
	
  // Paste your existing `getLanguageCode()` here
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

  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  getSupportedLanguages(): string[] {
    return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'nl', 'pl', 'tr']
  }
}

export const translationService = new TranslationService()
