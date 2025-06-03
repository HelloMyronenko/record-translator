import React from 'react'

interface AudioVisualizerProps {
  audioLevel: number
  isRecording: boolean
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioLevel, isRecording }) => {
  const bars = 20
  const barWidth = 100 / bars

  return (
    <div className="mb-8">
      <div className="h-24 bg-white/5 rounded-lg p-4 flex items-center justify-center">
        <div className="flex items-end gap-1 h-full w-full">
          {Array.from({ length: bars }).map((_, i) => {
            const height = isRecording 
              ? Math.max(20, Math.random() * audioLevel * 100 + Math.sin(Date.now() / 100 + i) * 20)
              : 20
            
            return (
              <div
                key={i}
                className="bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all duration-150"
                style={{
                  width: `${barWidth}%`,
                  height: `${height}%`,
                  opacity: isRecording ? 0.8 + (audioLevel * 0.2) : 0.3
                }}
              />
            )
          })}
        </div>
      </div>
      <p className="text-center text-sm text-purple-300 mt-2">
        {isRecording ? 'Listening...' : 'Click to start recording'}
      </p>
    </div>
  )
}

export default AudioVisualizer
