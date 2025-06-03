import React from 'react'
import { Clock, Loader2 } from 'lucide-react'
import { TranscriptionSegment } from '../types'

interface TranscriptionDisplayProps {
  transcriptions: TranscriptionSegment[]
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ transcriptions }) => {
  if (transcriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-purple-200">
        <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <p className="text-lg font-medium">No transcriptions yet</p>
        <p className="text-sm mt-2 text-center">
          Start recording to see live transcriptions and translations
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {transcriptions.map((segment, index) => (
        <div
          key={segment.id}
          className={`bg-white/5 rounded-lg p-4 border border-white/10 animate-fadeIn ${
            segment.isProcessing ? 'opacity-70' : ''
          }`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center gap-2 text-xs text-purple-300 mb-2">
            <Clock className="w-3 h-3" />
            <span>{segment.timestamp.toLocaleTimeString()}</span>
            {segment.isProcessing && (
              <div className="flex items-center gap-1 ml-auto">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Translating...</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-purple-300 mb-1">Original ({segment.sourceLanguage.toUpperCase()})</p>
              <p className="text-white">{segment.text}</p>
            </div>
            
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs text-purple-300 mb-1">Translation ({segment.targetLanguage.toUpperCase()})</p>
              <p className="text-purple-100">
                {segment.isProcessing ? (
                  <span className="italic text-purple-100/60">Translating...</span>
                ) : (
                  segment.translation
                )}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TranscriptionDisplay
