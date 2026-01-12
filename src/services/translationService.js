import axios from 'axios'

const MYMEMORY_API = 'https://api.mymemory.translated.net'

export const translateText = async (text, sourceLang, targetLang) => {
  try {
    const response = await axios.get(`${MYMEMORY_API}/get`, {
      params: {
        q: text,
        langpair: `${sourceLang}|${targetLang}`
      }
    })

    if (response.data && response.data.responseData) {
      return response.data.responseData.translatedText
    }
    
    throw new Error('Translation failed')
  } catch (error) {
    console.error('Translation error:', error)
    throw error
  }
}

export const detectLanguage = async (text) => {
  try {
    const response = await axios.get(`${MYMEMORY_API}/get`, {
      params: {
        q: text.substring(0, 100),
        langpair: 'auto|en'
      }
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
    return 'en'
  }
}
