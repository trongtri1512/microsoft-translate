let translatorOverlay = null;
let isTranslatorActive = false;
let userLanguage = 'vi';
let recognition = null;
let isListening = false;

const API_URL = 'https://api.mymemory.translated.net/get';

async function translateText(text, sourceLang, targetLang) {
  try {
    const response = await fetch(`${API_URL}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
    const data = await response.json();
    return data.responseData.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

function createOverlay() {
  if (translatorOverlay) return;

  translatorOverlay = document.createElement('div');
  translatorOverlay.id = 'meet-translator-overlay';
  translatorOverlay.innerHTML = `
    <div class="translator-header">
      <div class="translator-title">
        <span class="translator-icon">🌐</span>
        <span>Live Translation</span>
      </div>
      <div class="translator-controls">
        <select id="translator-language" class="translator-select">
          <option value="en">English</option>
          <option value="vi" selected>Tiếng Việt</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
          <option value="zh-CN">中文</option>
        </select>
        <button id="translator-toggle-listen" class="translator-btn" title="Toggle listening">
          <span class="mic-icon">🎤</span>
        </button>
        <button id="translator-close" class="translator-btn-close" title="Close">✕</button>
      </div>
    </div>
    <div class="translator-content">
      <div id="translator-captions" class="translator-captions">
        <div class="translator-placeholder">Captions will appear here...</div>
      </div>
    </div>
  `;

  document.body.appendChild(translatorOverlay);
  attachEventListeners();
  initSpeechRecognition();
}

function attachEventListeners() {
  const languageSelect = document.getElementById('translator-language');
  const toggleBtn = document.getElementById('translator-toggle-listen');
  const closeBtn = document.getElementById('translator-close');

  languageSelect.addEventListener('change', (e) => {
    userLanguage = e.target.value;
    chrome.storage.local.set({ userLanguage });
  });

  toggleBtn.addEventListener('click', () => {
    if (isListening) {
      stopListening();
      toggleBtn.classList.remove('listening');
    } else {
      startListening();
      toggleBtn.classList.add('listening');
    }
  });

  closeBtn.addEventListener('click', () => {
    removeOverlay();
  });
}

function initSpeechRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = async (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      if (isFinal) {
        await displayTranslation(transcript, 'auto', userLanguage);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };
  }
}

function startListening() {
  if (recognition) {
    try {
      recognition.start();
      isListening = true;
      addCaption('System', 'Listening started...', 'system');
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  }
}

function stopListening() {
  if (recognition) {
    recognition.stop();
    isListening = false;
    addCaption('System', 'Listening stopped', 'system');
  }
}

async function displayTranslation(text, sourceLang, targetLang) {
  const translated = await translateText(text, sourceLang, targetLang);
  addCaption('Speaker', text, 'original');
  addCaption('Translation', translated, 'translated');
  
  speakText(translated, targetLang);
}

function addCaption(speaker, text, type) {
  const captionsDiv = document.getElementById('translator-captions');
  const placeholder = captionsDiv.querySelector('.translator-placeholder');
  if (placeholder) {
    placeholder.remove();
  }

  const captionEl = document.createElement('div');
  captionEl.className = `translator-caption ${type}`;
  captionEl.innerHTML = `
    <div class="caption-speaker">${speaker}</div>
    <div class="caption-text">${text}</div>
    <div class="caption-time">${new Date().toLocaleTimeString()}</div>
  `;

  captionsDiv.appendChild(captionEl);
  captionsDiv.scrollTop = captionsDiv.scrollHeight;

  setTimeout(() => {
    if (captionEl.parentNode) {
      captionEl.style.opacity = '0.5';
    }
  }, 5000);
}

function speakText(text, lang) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

function removeOverlay() {
  if (recognition && isListening) {
    stopListening();
  }
  if (translatorOverlay) {
    translatorOverlay.remove();
    translatorOverlay = null;
  }
  isTranslatorActive = false;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleTranslator') {
    if (isTranslatorActive) {
      removeOverlay();
    } else {
      createOverlay();
      isTranslatorActive = true;
    }
    sendResponse({ status: 'success' });
  }
});

chrome.storage.local.get(['userLanguage'], (result) => {
  if (result.userLanguage) {
    userLanguage = result.userLanguage;
  }
});
