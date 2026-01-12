# 🌐 Multi-API Translation System - Hướng dẫn chi tiết

## 🎯 Giải pháp cho vấn đề giới hạn API

### Vấn đề
MyMemory API có giới hạn:
- **1000 requests/ngày** cho IP không đăng ký
- **10,000 requests/ngày** với API key miễn phí
- Khi hết hạn mức → dịch thuật bị lỗi

### ✅ Giải pháp: Auto-Fallback System

Hệ thống tự động chuyển đổi giữa **4 API miễn phí** khi gặp lỗi hoặc hết hạn mức!

## 🔄 Các API được tích hợp

### 1. **MyMemory Translation API** (Mặc định)
- **URL**: https://api.mymemory.translated.net
- **Giới hạn**: 1000 requests/ngày (IP), 10K với API key
- **Ưu điểm**: Chất lượng tốt, nhiều ngôn ngữ
- **Đăng ký**: https://mymemory.translated.net/doc/

```javascript
// Ví dụ request
GET https://api.mymemory.translated.net/get?q=Hello&langpair=en|vi
```

### 2. **LibreTranslate** (Fallback #1)
- **URL**: https://libretranslate.de
- **Giới hạn**: Không giới hạn (self-hosted)
- **Ưu điểm**: Open source, miễn phí hoàn toàn
- **GitHub**: https://github.com/LibreTranslate/LibreTranslate

```javascript
// Ví dụ request
POST https://libretranslate.de/translate
{
  "q": "Hello",
  "source": "en",
  "target": "vi",
  "format": "text"
}
```

### 3. **Lingva Translate** (Fallback #2)
- **URL**: https://lingva.ml
- **Giới hạn**: Không giới hạn
- **Ưu điểm**: Proxy Google Translate, không cần API key
- **GitHub**: https://github.com/thedaviddelta/lingva-translate

```javascript
// Ví dụ request
GET https://lingva.ml/api/v1/en/vi/Hello
```

### 4. **Argos Translate** (Fallback #3)
- **URL**: https://translate.argosopentech.com
- **Giới hạn**: Không giới hạn
- **Ưu điểm**: Open source, offline-capable
- **GitHub**: https://github.com/argosopentech/argos-translate

```javascript
// Ví dụ request
POST https://translate.argosopentech.com/translate
{
  "q": "Hello",
  "source": "en",
  "target": "vi"
}
```

## 🔧 Cách hoạt động

### Auto-Fallback Logic

```
Request Translation
    ↓
Try API #1 (MyMemory)
    ↓
Success? → Return result
    ↓
Fail? → Try API #2 (LibreTranslate)
    ↓
Success? → Return result
    ↓
Fail? → Try API #3 (Lingva)
    ↓
Success? → Return result
    ↓
Fail? → Try API #4 (Argos)
    ↓
All failed? → Return error
```

### Code Implementation

```javascript
// src/services/translationService.js
export const translateText = async (text, sourceLang, targetLang) => {
  let lastError = null
  
  // Thử từng API theo thứ tự
  for (let attempt = 0; attempt < TRANSLATION_APIS.length; attempt++) {
    const apiIndex = (currentAPIIndex + attempt) % TRANSLATION_APIS.length
    const api = TRANSLATION_APIS[apiIndex]
    
    try {
      console.log(`Trying ${api.name} API...`)
      const result = await api.translate(text, sourceLang, targetLang)
      
      // Thành công → Lưu API hiện tại
      currentAPIIndex = apiIndex
      console.log(`✅ Success with ${api.name}`)
      
      return result
    } catch (error) {
      console.warn(`❌ ${api.name} failed:`, error.message)
      lastError = error
      
      // Chờ 500ms trước khi thử API tiếp theo
      if (attempt < TRANSLATION_APIS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }
  
  throw lastError
}
```

## 📊 API Status Monitor

Ứng dụng có **API Status Widget** hiển thị:
- ✅ API hiện đang sử dụng
- 📊 Số lượng requests cho mỗi API
- 🔄 Danh sách tất cả API available

### Xem trạng thái API

```javascript
import { getAPIStats } from './services/translationService'

const stats = getAPIStats()
console.log(stats)
// {
//   currentAPI: 'MyMemory',
//   usage: {
//     MyMemory: 150,
//     LibreTranslate: 20,
//     Lingva: 5
//   },
//   availableAPIs: ['MyMemory', 'LibreTranslate', 'Lingva', 'Argos']
// }
```

## 🚀 Nâng cấp với API Key (Tùy chọn)

### MyMemory API Key (Miễn phí)

1. Đăng ký tại: https://mymemory.translated.net/doc/
2. Nhận API key miễn phí
3. Thêm vào code:

```javascript
// src/services/translationService.js
const MYMEMORY_API_KEY = 'your-api-key-here'

translate: async (text, sourceLang, targetLang) => {
  const response = await axios.get('https://api.mymemory.translated.net/get', {
    params: {
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
      key: MYMEMORY_API_KEY  // Thêm API key
    }
  })
  // ...
}
```

**Lợi ích:**
- Tăng từ 1K → 10K requests/ngày
- Ưu tiên xử lý nhanh hơn
- Chất lượng dịch tốt hơn

### LibreTranslate Self-Hosted (Không giới hạn)

Deploy server riêng:

```bash
# Docker
docker run -ti --rm -p 5000:5000 libretranslate/libretranslate

# Python
pip install libretranslate
libretranslate
```

Cập nhật URL trong code:
```javascript
{
  name: 'LibreTranslate',
  translate: async (text, sourceLang, targetLang) => {
    const response = await axios.post('http://localhost:5000/translate', {
      // Dùng server riêng của bạn
      q: text,
      source: sourceLang,
      target: targetLang
    })
    // ...
  }
}
```

## 💡 Best Practices

### 1. Caching để giảm API calls

```javascript
const translationCache = new Map()

export const translateText = async (text, sourceLang, targetLang) => {
  const cacheKey = `${text}|${sourceLang}|${targetLang}`
  
  // Check cache trước
  if (translationCache.has(cacheKey)) {
    console.log('✅ Cache hit!')
    return translationCache.get(cacheKey)
  }
  
  // Gọi API nếu chưa có trong cache
  const result = await translateTextFromAPI(text, sourceLang, targetLang)
  
  // Lưu vào cache
  translationCache.set(cacheKey, result)
  
  return result
}
```

### 2. Rate Limiting

```javascript
import pLimit from 'p-limit'

const limit = pLimit(5) // Tối đa 5 requests đồng thời

const translations = await Promise.all(
  texts.map(text => 
    limit(() => translateText(text, 'en', 'vi'))
  )
)
```

### 3. Retry với Exponential Backoff

```javascript
async function translateWithRetry(text, sourceLang, targetLang, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await translateText(text, sourceLang, targetLang)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

## 🔍 Troubleshooting

### API không hoạt động?

**Kiểm tra console:**
```javascript
// Mở DevTools (F12) và xem logs
// Bạn sẽ thấy:
// "Trying MyMemory API..."
// "❌ MyMemory failed: Network error"
// "Trying LibreTranslate API..."
// "✅ Success with LibreTranslate"
```

**Test API thủ công:**
```bash
# Test MyMemory
curl "https://api.mymemory.translated.net/get?q=hello&langpair=en|vi"

# Test LibreTranslate
curl -X POST "https://libretranslate.de/translate" \
  -H "Content-Type: application/json" \
  -d '{"q":"hello","source":"en","target":"vi","format":"text"}'

# Test Lingva
curl "https://lingva.ml/api/v1/en/vi/hello"
```

### Tất cả API đều fail?

**Nguyên nhân có thể:**
1. Không có internet
2. CORS blocked (chỉ xảy ra trên browser)
3. Firewall/VPN chặn
4. API servers đang down

**Giải pháp:**
- Kiểm tra kết nối internet
- Thử trên trình duyệt khác
- Tắt VPN/proxy
- Đợi và thử lại sau

## 📈 Monitoring & Analytics

### Track API Usage

```javascript
// Thêm vào translationService.js
export const getUsageReport = () => {
  const total = Object.values(apiUsageCount).reduce((a, b) => a + b, 0)
  
  return {
    total,
    byAPI: apiUsageCount,
    mostUsed: Object.entries(apiUsageCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
  }
}

// Sử dụng
const report = getUsageReport()
console.log(`Total translations: ${report.total}`)
console.log(`Most used API: ${report.mostUsed}`)
```

## 🌟 Tương lai

### APIs có thể thêm:

1. **Google Cloud Translation API** (Paid)
   - Chất lượng tốt nhất
   - $20/1M ký tự

2. **DeepL API** (Paid)
   - Chất lượng cao
   - 500K ký tự miễn phí/tháng

3. **Microsoft Translator** (Paid)
   - 2M ký tự miễn phí/tháng

4. **Amazon Translate** (Paid)
   - 2M ký tự miễn phí/tháng (12 tháng đầu)

## 📝 Tóm tắt

✅ **4 API miễn phí** tích hợp sẵn
✅ **Auto-fallback** khi gặp lỗi
✅ **API Status Monitor** real-time
✅ **Không cần API key** để bắt đầu
✅ **Có thể nâng cấp** với API key miễn phí
✅ **Self-hosted option** cho unlimited usage

**Kết quả:** Ứng dụng luôn hoạt động, không bao giờ bị gián đoạn do hết hạn mức API! 🎉
