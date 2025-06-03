import React, { useState } from 'react'
import { X, Key, AlertCircle, ExternalLink } from 'lucide-react'

interface ApiKeyModalProps {
  onClose: () => void
  onSave: () => void
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('')
  const [showInstructions, setShowInstructions] = useState(true)

  const handleSave = () => {
    if (apiKey.trim()) {
      // In a real app, you would save this securely
      // For this demo, we'll just show an alert
      alert('API Key configuration saved! Please update the .env file with your key.')
      onSave()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-purple-500/20">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Key className="w-6 h-6" />
              Configure OpenAI API Key
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {showInstructions && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-blue-300 font-medium mb-2">How to get your OpenAI API Key:</h3>
                  <ol className="text-blue-200 text-sm space-y-2">
                    <li>1. Visit <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                      platform.openai.com <ExternalLink className="w-3 h-3" />
                    </a></li>
                    <li>2. Sign in or create an account</li>
                    <li>3. Navigate to API Keys section</li>
                    <li>4. Create a new secret key</li>
                    <li>5. Copy the key and paste it below</li>
                  </ol>
                  <p className="text-yellow-300 text-xs mt-3">
                    Note: Keep your API key secure and never share it publicly!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white 
                         placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 
                         focus:border-transparent"
              />
              <p className="text-xs text-purple-300 mt-2">
                Your API key will be used to access OpenAI's Whisper (speech-to-text) and GPT-4 (translation) services.
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-300 text-sm">
                <strong>Important:</strong> After clicking save, you need to manually update the <code className="bg-black/30 px-1 rounded">.env</code> file in your project with:
              </p>
              <pre className="mt-2 bg-black/30 p-3 rounded text-yellow-200 text-xs overflow-x-auto">
{`VITE_OPENAI_API_KEY=${apiKey || 'your_api_key_here'}`}
              </pre>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="text-purple-300 font-medium mb-2">Pricing Information:</h4>
              <ul className="text-purple-200 text-sm space-y-1">
                <li>• Whisper API: $0.006 per minute of audio</li>
                <li>• GPT-4 Turbo: ~$0.01 per 1K tokens</li>
                <li>• Average cost: ~$0.02-0.05 per minute of recording</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 
                       disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiKeyModal
