import { useState, useEffect } from 'react'
import { Volume2, Copy, ArrowLeftRight, X, Mic, Languages, Users, MessageSquare } from 'lucide-react'
import { translateText, detectLanguage } from './services/translationService'
import { languages } from './data/languages'
import ConversationMode from './components/ConversationMode'
import APIStatus from './components/APIStatus'

function App() {
  const [mode, setMode] = useState('text')
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('vi')
  const [isLoading, setIsLoading] = useState(false)
  const [detectedLang, setDetectedLang] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (sourceText.trim()) {
        handleTranslate()
      } else {
        setTranslatedText('')
        setDetectedLang(null)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [sourceText, sourceLang, targetLang])

  const handleTranslate = async () => {
    if (!sourceText.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const from = sourceLang === 'auto' ? await detectLanguage(sourceText) : sourceLang
      if (sourceLang === 'auto') {
        setDetectedLang(from)
      }

      const result = await translateText(sourceText, from, targetLang)
      setTranslatedText(result)
    } catch (err) {
      setError('Translation failed. Please try again.')
      console.error('Translation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return
    
    const temp = sourceLang
    setSourceLang(targetLang)
    setTargetLang(temp)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }

  const handleClear = () => {
    setSourceText('')
    setTranslatedText('')
    setDetectedLang(null)
    setError(null)
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
  }

  const handleSpeak = (text, lang) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      speechSynthesis.speak(utterance)
    }
  }

  if (mode === 'conversation') {
    return <ConversationMode onBack={() => setMode('text')} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Languages className="w-10 h-10 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-800">Translator</h1>
            </div>
            <p className="text-gray-600">Translate text between languages instantly</p>
            
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setMode('text')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  mode === 'text'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                Text Translation
              </button>
              <button
                onClick={() => setMode('conversation')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  mode === 'conversation'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="w-5 h-5" />
                Conversation Mode
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="auto">Detect Language</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSwapLanguages}
                disabled={sourceLang === 'auto'}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Swap languages"
              >
                <ArrowLeftRight className="w-5 h-5 text-gray-600" />
              </button>

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 divide-x">
              <div className="relative">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {detectedLang && sourceLang === 'auto' 
                        ? `Detected: ${languages.find(l => l.code === detectedLang)?.name || detectedLang}`
                        : 'Source Text'}
                    </span>
                    {sourceText && (
                      <button
                        onClick={handleClear}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        title="Clear"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="w-full h-64 p-4 text-lg resize-none focus:outline-none"
                    maxLength={5000}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {sourceText.length} / 5000
                    </span>
                    <div className="flex gap-2">
                      {sourceText && (
                        <>
                          <button
                            onClick={() => handleSpeak(sourceText, sourceLang === 'auto' ? detectedLang : sourceLang)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            title="Listen"
                          >
                            <Volume2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleCopy(sourceText)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative bg-gray-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Translation</span>
                  </div>
                  <div className="w-full h-64 p-4 text-lg overflow-y-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : error ? (
                      <div className="text-red-500">{error}</div>
                    ) : (
                      <p className="text-gray-800">{translatedText}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <div className="flex gap-2">
                      {translatedText && (
                        <>
                          <button
                            onClick={() => handleSpeak(translatedText, targetLang)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            title="Listen"
                          >
                            <Volume2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleCopy(translatedText)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Powered by Multiple Translation APIs with Auto-Fallback</p>
          </div>
        </div>
      </div>
      <APIStatus />
    </div>
  )
}

export default App
