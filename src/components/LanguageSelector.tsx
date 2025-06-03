import React from 'react'
import { Globe } from 'lucide-react'
import { Language } from '../types'

interface LanguageSelectorProps {
  label: string
  value: string
  onChange: (value: string) => void
  languages: Language[]
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ label, value, onChange, languages }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-purple-200 mb-2">
        {label}
      </label>
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white 
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                   appearance-none cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-gray-800">
              {lang.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default LanguageSelector
