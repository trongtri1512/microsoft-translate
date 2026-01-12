# 🎤 Voice Chat Fix - Tin nhắn thoại & Âm thanh

## ✅ Đã fix hoàn toàn

### ❌ Vấn đề
- Tin nhắn thoại không hiện giữa các tabs
- Không có âm thanh khi nhận tin nhắn
- Messages chỉ lưu local, không sync

### ✅ Giải pháp
- ✅ **localStorage Storage Event** - Sync messages giữa tabs
- ✅ **Auto text-to-speech** - Phát âm tin nhắn nhận được
- ✅ **Message broadcasting** - Gửi tin nhắn đến tất cả tabs
- ✅ **Translation cho speaker** - Dịch cả ngôn ngữ của người nói

## 🔧 Thay đổi đã thực hiện

### 1. **Message Broadcasting (localStorage)**

`src/services/localStorageSync.js`

```javascript
// Storage event listener - Tự động nhận messages từ tabs khác
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('conversation_messages')) {
    const messages = JSON.parse(e.newValue)
    const latestMessage = messages[messages.length - 1]
    // Trigger callback cho tất cả listeners
    this.messageListeners.forEach(callback => callback(latestMessage))
  }
})

// Broadcast message đến tất cả tabs
broadcastMessage(roomCode, message) {
  const messagesKey = `conversation_messages_${roomCode}`
  let messages = JSON.parse(localStorage.getItem(messagesKey) || '[]')
  messages.push(message)
  localStorage.setItem(messagesKey, JSON.stringify(messages))
}
```

### 2. **Auto Text-to-Speech cho tin nhắn nhận**

`src/components/ConversationMode.jsx`

```javascript
// Khi nhận message từ tab khác
const handleNewMessage = (message) => {
  if (message.speaker !== userName) {  // Không phát âm tin nhắn của mình
    setMessages(prev => [...prev, message])
    
    // Lấy bản dịch theo ngôn ngữ của mình
    const textToSpeak = message.translations[userLanguage] || message.originalText
    
    // ✅ Auto text-to-speech
    if (textToSpeak && autoSpeak) {
      speakText(textToSpeak, userLanguage)
    }
  }
}

localStorageSync.onMessage(handleNewMessage)
```

### 3. **Translation cho ngôn ngữ của speaker**

```javascript
// Trước: Chỉ dịch sang ngôn ngữ khác
for (const lang of uniqueLanguages) {
  if (lang !== userLanguage) {
    message.translations[lang] = await translateText(...)
  }
}

// Sau: Dịch cả ngôn ngữ của speaker
for (const lang of uniqueLanguages) {
  if (lang !== userLanguage) {
    message.translations[lang] = await translateText(...)
  } else {
    message.translations[lang] = transcript  // ✅ Thêm original text
  }
}
```

## 🧪 Test Voice Chat

### Scenario 1: 2 Tabs - Cùng ngôn ngữ

**Tab 1 (User A - Tiếng Việt):**
1. Tạo phòng ABC123
2. Bật mic 🎤
3. Nói: "Xin chào"
4. ✅ Thấy message của mình

**Tab 2 (User B - Tiếng Việt):**
1. Join phòng ABC123
2. ✅ **Thấy message "Xin chào"** (từ Tab 1)
3. ✅ **Nghe âm thanh "Xin chào"** (text-to-speech)

### Scenario 2: 2 Tabs - Khác ngôn ngữ

**Tab 1 (User A - Tiếng Việt):**
1. Tạo phòng XYZ789
2. Nói: "Chào buổi sáng"

**Tab 2 (User B - English):**
1. Join phòng XYZ789
2. ✅ Thấy: "Good morning" (đã dịch)
3. ✅ Nghe: "Good morning" (English voice)

**Tab 1:**
1. Nói: "Bạn khỏe không?"

**Tab 2:**
1. ✅ Thấy: "How are you?"
2. ✅ Nghe: "How are you?"

### Scenario 3: Hands-Free Mode

**Tab 1:**
1. Bật "Hands-Free" 🎙️
2. Nói liên tục: "Hello... How are you... Nice to meet you"
3. ✅ Mỗi câu tự động gửi

**Tab 2:**
1. ✅ Nhận từng message real-time
2. ✅ Text-to-speech tự động phát

## 🔍 Debug Voice Chat

### Check Console Logs

**Tab 1 (Người gửi):**
```
[Voice] Message sent: Xin chào
[LocalSync] Broadcast message: 1736662800000
```

**Tab 2 (Người nhận):**
```
[LocalSync] Received message from: User A
🔊 Speaking: Xin chào
```

### Check localStorage

```javascript
// Mở Console (F12)
const roomCode = 'ABC123'
const key = `conversation_messages_${roomCode}`
console.log(JSON.parse(localStorage.getItem(key)))

// Output:
[
  {
    id: 1736662800000,
    speaker: "User A",
    originalText: "Xin chào",
    translations: {
      vi: "Xin chào",
      en: "Hello"
    }
  }
]
```

### Verify Text-to-Speech

```javascript
// Check speech synthesis
console.log('speechSynthesis' in window)  // true
console.log(window.speechSynthesis.speaking)  // true khi đang nói

// Test manual
const utterance = new SpeechSynthesisUtterance("Hello")
utterance.lang = 'en-US'
window.speechSynthesis.speak(utterance)
```

## ⚙️ Settings

### Tắt/Bật Auto-Speak

**UI:**
- Click ⚙️ Settings
- Toggle "Tự động phát âm"
- ✅ ON: Tự động phát âm tin nhắn nhận được
- ❌ OFF: Không phát âm (chỉ hiển thị text)

**Code:**
```javascript
const [autoSpeak, setAutoSpeak] = useState(true)

// Chỉ phát âm khi autoSpeak = true
if (textToSpeak && autoSpeak) {
  speakText(textToSpeak, userLanguage)
}
```

### Điều chỉnh tốc độ đọc

**UI:**
- Settings → Tốc độ đọc
- 0.5x - 2.0x
- Mặc định: 0.9x

**Code:**
```javascript
const [speechSpeed, setSpeechSpeed] = useState(0.9)

utterance.rate = speechSpeed  // 0.9
```

## 🎯 Flow hoạt động

### Message Flow (Offline Mode)

```
Tab 1 (User A)
    ↓
  Nói: "Hello"
    ↓
  Speech Recognition → transcript
    ↓
  Translate → {vi: "Xin chào", en: "Hello"}
    ↓
  setMessages([...prev, message])  ← Hiển thị trong Tab 1
    ↓
  localStorageSync.broadcastMessage(roomCode, message)
    ↓
  localStorage.setItem('conversation_messages_ABC123', [...])
    ↓
  ⚡ Storage Event triggered
    ↓
Tab 2 (User B) - Storage listener
    ↓
  handleNewMessage(message)
    ↓
  setMessages([...prev, message])  ← Hiển thị trong Tab 2
    ↓
  speakText(message.translations['vi'], 'vi')  ← 🔊 Phát âm
```

## 🐛 Troubleshooting

### Messages không sync giữa tabs?

**Check 1: Verify offline mode**
```javascript
// Console
console.log(useOfflineMode)  // true
```

**Check 2: Check storage event**
```javascript
// Add debug log
window.addEventListener('storage', (e) => {
  console.log('Storage event:', e.key, e.newValue)
})
```

**Check 3: Different browser?**
- Storage event chỉ hoạt động giữa tabs **cùng browser**
- Chrome Tab 1 + Chrome Tab 2 ✅
- Chrome + Firefox ❌

### Không có âm thanh?

**Check 1: autoSpeak enabled?**
```javascript
// Settings → Tự động phát âm = ON
```

**Check 2: Browser permissions?**
- Một số browser yêu cầu user interaction trước
- Click vào page trước khi test

**Check 3: Volume?**
```javascript
// Check system volume
// Check browser tab not muted
```

**Check 4: Language support?**
```javascript
// Check available voices
window.speechSynthesis.getVoices().forEach(voice => {
  console.log(voice.lang, voice.name)
})
```

### Messages bị duplicate?

**Nguyên nhân:**
- Storage event trigger cho tất cả tabs **trừ** tab gửi
- Tab gửi đã add message vào state rồi

**Fix:**
```javascript
// Chỉ add message nếu không phải người gửi
if (message.speaker !== userName) {
  setMessages(prev => [...prev, message])
}
```

## 📊 Performance

### Message Limit

```javascript
// Chỉ giữ 100 messages gần nhất
if (messages.length > 100) {
  messages = messages.slice(-100)
}
```

### localStorage Size

```javascript
// Check size
const key = `conversation_messages_${roomCode}`
const size = new Blob([localStorage.getItem(key)]).size
console.log(`Messages size: ${size} bytes`)

// Limit: ~5-10MB per domain
```

## 🎉 Summary

### ✅ Đã fix

1. **Messages sync giữa tabs** - Dùng storage event
2. **Auto text-to-speech** - Phát âm tin nhắn nhận được
3. **Translation đầy đủ** - Bao gồm ngôn ngữ của speaker
4. **Real-time updates** - Instant message delivery

### 🧪 Test ngay

```bash
npm run dev
```

1. Mở 2 tabs
2. Tab 1: Tạo phòng, bật mic
3. Tab 2: Join phòng
4. Tab 1: Nói "Xin chào"
5. ✅ Tab 2 thấy message + nghe âm thanh!

**Voice chat hoạt động hoàn hảo! 🎤🔊**
