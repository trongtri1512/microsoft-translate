import axios from 'axios'

let currentAPIIndex = 0
let apiUsageCount = {}
const MAX_RETRIES = 3

const TRANSLATION_APIS = [
  {
    name: 'MyMemory',
    translate: async (text, sourceLang, targetLang) => {
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: `${sourceLang}|${targetLang}`
        },
        timeout: 10000
      })
      if (response.data && response.data.responseData) {
        return response.data.responseData.translatedText
      }
      throw new Error('MyMemory API failed')
    }
  },
  {
    name: 'LibreTranslate',
    translate: async (text, sourceLang, targetLang) => {
      const response = await axios.post('https://libretranslate.de/translate', {
        q: text,
        source: sourceLang === 'auto' ? 'en' : sourceLang,
        target: targetLang,
        format: 'text'
      }, {
        timeout: 10000
      })
      if (response.data && response.data.translatedText) {
        return response.data.translatedText
      }
      throw new Error('LibreTranslate API failed')
    }
  },
  {
    name: 'Lingva',
    translate: async (text, sourceLang, targetLang) => {
      const source = sourceLang === 'auto' ? 'auto' : sourceLang
      const response = await axios.get(`https://lingva.ml/api/v1/${source}/${targetLang}/${encodeURIComponent(text)}`, {
        timeout: 10000
      })
      if (response.data && response.data.translation) {
        return response.data.translation
      }
      throw new Error('Lingva API failed')
    }
  },
  {
    name: 'Translate.argosopentech',
    translate: async (text, sourceLang, targetLang) => {
      const response = await axios.post('https://translate.argosopentech.com/translate', {
        q: text,
        source: sourceLang === 'auto' ? 'en' : sourceLang,
        target: targetLang
      }, {
        timeout: 10000
      })
      if (response.data && response.data.translatedText) {
        return response.data.translatedText
      }
      throw new Error('Argos API failed')
    }
  }
]

export const translateText = async (text, sourceLang, targetLang) => {
  let lastError = null
  
  for (let attempt = 0; attempt < TRANSLATION_APIS.length; attempt++) {
    const apiIndex = (currentAPIIndex + attempt) % TRANSLATION_APIS.length
    const api = TRANSLATION_APIS[apiIndex]
    
    try {
      console.log(`Trying ${api.name} API...`)
      const result = await api.translate(text, sourceLang, targetLang)
      
      if (!apiUsageCount[api.name]) {
        apiUsageCount[api.name] = 0
      }
      apiUsageCount[api.name]++
      
      currentAPIIndex = apiIndex
      console.log(`✅ Success with ${api.name} (used ${apiUsageCount[api.name]} times)`)
      
      return result
    } catch (error) {
      console.warn(`❌ ${api.name} failed:`, error.message)
      lastError = error
      
      if (attempt < TRANSLATION_APIS.length - 1) {
        console.log(`Switching to next API...`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }
  
  console.error('All translation APIs failed')
  throw lastError || new Error('Translation failed')
}

export const getCurrentAPI = () => {
  return TRANSLATION_APIS[currentAPIIndex].name
}

export const getAPIStats = () => {
  return {
    currentAPI: TRANSLATION_APIS[currentAPIIndex].name,
    usage: apiUsageCount,
    availableAPIs: TRANSLATION_APIS.map(api => api.name)
  }
}

export const detectLanguage = async (text) => {
  try {
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text.substring(0, 100),
        langpair: 'auto|en'
      },
      timeout: 5000
    })

    if (response.data && response.data.responseData) {
      const matches = response.data.matches || []
      if (matches.length > 0 && matches[0].source) {
        return matches[0].source
      }
    }
    
    return 'en'
  } catch (error) {
    console.error('Language detection error:', error)
    try {
      const lingvaResponse = await axios.get(`https://lingva.ml/api/v1/auto/en/${encodeURIComponent(text.substring(0, 100))}`, {
        timeout: 5000
      })
      if (lingvaResponse.data && lingvaResponse.data.info && lingvaResponse.data.info.detectedSource) {
        return lingvaResponse.data.info.detectedSource
      }
    } catch (fallbackError) {
      console.error('Fallback language detection failed:', fallbackError)
    }
    return 'en'
  }
}
