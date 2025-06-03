import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Languages, Volume2, Copy, Download, Loader2, Globe, Headphones, AlertCircle, Info } from 'lucide-react'
import AudioVisualizer from './components/AudioVisualizer'
import LanguageSelector from './components/LanguageSelector'
import TranscriptionDisplay from './components/TranscriptionDisplay'
import { languages } from './utils/languages'
import { translationService } from './services/translation'
import { TranscriptionSegment } from './types'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [sourceLanguage, setSourceLanguage] = useState('en')
  const [targetLanguage, setTargetLanguage] = useState('es')
  const [transcriptions, setTranscriptions] = useState<TranscriptionSegment[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [isBrowserSupported, setIsBrowserSupported] = useState(true)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pendingTranscriptRef = useRef<string>('')

  useEffect(() => {
    // Check browser support
    setIsBrowserSupported(translationService.isSupported())
    
    return () => {
      // Cleanup on unmount
      cleanupAudioResources()
    }
  }, [])

  const cleanupAudioResources = () => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Close audio context only if it's not already closed
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // Clear analyser reference
    analyserRef.current = null
  }

  const startRecording = async () => {
    if (!isBrowserSupported) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)
      
      // Start visualization
      visualizeAudio()
      
      setIsRecording(true)
      pendingTranscriptRef.current = ''
      
      // Start speech recognition
      translationService.startListening(
        sourceLanguage,
        async (text, isFinal) => {
          if (isFinal) {
            // Process final transcript
            if (text.trim()) {
              await processTranscript(text)
            }
            pendingTranscriptRef.current = ''
            setCurrentTranscript('')
          } else {
            // Update interim transcript
            pendingTranscriptRef.current = text
            setCurrentTranscript(text)
          }
        },
        (error) => {
          setError(error)
          console.error('Speech recognition error:', error)
        }
      )
      
    } catch (err) {
      setError('Failed to access microphone. Please ensure you have granted permission.')
      console.error('Error accessing microphone:', err)
      cleanupAudioResources()
    }
  }

  const stopRecording = () => {
    if (isRecording) {
      // Stop speech recognition
      translationService.stopListening()
      
      // Process any pending transcript
      if (pendingTranscriptRef.current.trim()) {
        processTranscript(pendingTranscriptRef.current)
      }
      
      // Clean up audio resources
      cleanupAudioResources()
      
      setIsRecording(false)
      setAudioLevel(0)
      setCurrentTranscript('')
    }
  }

  const visualizeAudio = () => {
    if (!analyserRef.current || !audioContextRef.current) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const animate = () => {
      // Check if we should continue animating
      if (!analyserRef.current || !isRecording || audioContextRef.current?.state === 'closed') {
        return
      }
      
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average / 255)
      
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animate()
  }

  const processTranscript = async (text: string) => {
    const tempId = Date.now().toString()
    
    // Add a processing segment
    const processingSegment: TranscriptionSegment = {
      id: tempId,
      text: text,
      translation: 'Translating...',
      timestamp: new Date(),
      sourceLanguage,
      targetLanguage,
      isProcessing: true
    }
    
    setTranscriptions(prev => [...prev, processingSegment])
    setIsProcessing(true)
    
    try {
      // Translate text
      const translatedText = await translationService.translateText(text, sourceLanguage, targetLanguage)
      
      // Update the segment with actual translation
      setTranscriptions(prev => prev.map(t => 
        t.id === tempId 
          ? {
              ...t,
              translation: translatedText,
              isProcessing: false
            }
          : t
      ))
    } catch (error) {
      console.error('Error translating text:', error)
      
      // Update with error message
      setTranscriptions(prev => prev.map(t => 
        t.id === tempId 
          ? {
              ...t,
              translation: 'Translation failed',
              isProcessing: false
            }
          : t
      ))
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTranscript = () => {
    const content = transcriptions
      .filter(t => !t.isProcessing)
      .map(t => 
        `[${t.timestamp.toLocaleTimeString()}]\n${t.sourceLanguage.toUpperCase()}: ${t.text}\n${t.targetLanguage.toUpperCase()}: ${t.translation}\n\n`
      ).join('')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript_${new Date().toISOString()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    const content = transcriptions
      .filter(t => !t.isProcessing)
      .map(t => 
        `${t.text}\n${t.translation}`
      ).join('\n\n')
    
    navigator.clipboard.writeText(content)
  }

  const clearTranscriptions = () => {
    setTranscriptions([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-600 rounded-full">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Live Recording Translator
            </h1>
          </div>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Record, transcribe, and translate speech in real-time - 100% free!
          </p>
          
          {/* Browser Support Status */}
          <div className="mt-4">
            {isBrowserSupported ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-green-300 text-sm">Browser Speech Recognition Available</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full">
                <AlertCircle className="w-4 h-4 text-yellow-300" />
                <span className="text-yellow-300 text-sm">Please use Chrome or Edge for speech recognition</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Control Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Headphones className="w-6 h-6" />
                Recording Controls
              </h2>
            </div>

            {/* Language Selectors */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <LanguageSelector
                label="Source Language"
                value={sourceLanguage}
                onChange={setSourceLanguage}
                languages={languages.filter(lang => 
                  translationService.getSupportedLanguages().includes(lang.code)
                )}
              />
              <LanguageSelector
                label="Target Language"
                value={targetLanguage}
                onChange={setTargetLanguage}
                languages={languages}
              />
            </div>

            {/* Audio Visualizer */}
            <AudioVisualizer audioLevel={audioLevel} isRecording={isRecording} />

            {/* Current Transcript */}
            {currentTranscript && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-purple-300 mb-1">Listening...</p>
                <p className="text-white text-sm italic">{currentTranscript}</p>
              </div>
            )}

            {/* Recording Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isBrowserSupported}
                className={`
                  relative group px-8 py-4 rounded-full font-semibold text-lg
                  transition-all duration-300 transform hover:scale-105
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  ${isRecording 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/50' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/50'
                  }
                `}
              >
                <span className="flex items-center gap-3">
                  {isRecording ? (
                    <>
                      <MicOff className="w-6 h-6" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6" />
                      Start Recording
                    </>
                  )}
                </span>
                {isRecording && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-medium mb-1">How it works:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Speech Recognition: Browser's built-in API</li>
                    <li>• Translation: Client-side dictionary (no API needed)</li>
                    <li>• Common phrases and words supported</li>
                    <li>• 100% free, works offline!</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {transcriptions.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={downloadTranscript}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={clearTranscriptions}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  title="Clear all"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Transcription Display */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <Languages className="w-6 h-6" />
              Live Transcription
            </h2>
            
            <TranscriptionDisplay transcriptions={transcriptions} />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Browser Speech API</h3>
            <p className="text-purple-200 text-sm">Built-in speech recognition - no API keys needed</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Processing</h3>
            <p className="text-purple-200 text-sm">Instant transcription as you speak</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Offline Translation</h3>
            <p className="text-purple-200 text-sm">Dictionary-based translation - works offline!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
