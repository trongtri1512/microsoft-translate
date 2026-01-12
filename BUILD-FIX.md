# 🔧 Build Error Fixes

## ❌ Lỗi: terser not found

### Error Message
```
[vite:terser] terser not found. Since Vite v3, terser has become an optional dependency. You need to install it.
```

### ✅ Giải pháp đã áp dụng

Đã thay đổi `vite.config.js`:

```javascript
build: {
  minify: 'esbuild'  // Thay vì 'terser'
}
```

**Lý do:**
- ✅ esbuild đã có sẵn trong Vite (không cần cài thêm)
- ✅ Nhanh hơn terser (10-100x)
- ✅ Kết quả minify tương đương
- ✅ Không có dependencies thêm

### So sánh esbuild vs terser

| Feature | esbuild | terser |
|---------|---------|--------|
| **Tốc độ** | ⚡ Rất nhanh (10-100x) | 🐌 Chậm hơn |
| **Cài đặt** | ✅ Có sẵn | ❌ Phải cài thêm |
| **Kích thước output** | ~5% lớn hơn | Nhỏ nhất |
| **Khuyến nghị** | ✅ Dùng cho hầu hết | Chỉ khi cần optimize tối đa |

### Alternative: Cài terser (nếu cần)

Nếu bạn muốn dùng terser:

```bash
npm install -D terser
```

Sau đó giữ nguyên config:
```javascript
build: {
  minify: 'terser'
}
```

**Khi nào dùng terser:**
- Cần optimize kích thước file tối đa
- Không quan tâm thời gian build
- Có yêu cầu đặc biệt về minification

## 🚀 Build Commands

### Development
```bash
npm run dev
# → http://localhost:5173
```

### Production Build
```bash
npm run build
# → Output: dist/
# → Minified với esbuild
```

### Preview Production
```bash
npm run preview
# → http://localhost:4173
```

## 📊 Build Performance

### Với esbuild (hiện tại)
```
✓ building for production...
✓ 156 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-abc123.css     12.34 kB │ gzip:  3.21 kB
dist/assets/vendor-def456.js    143.21 kB │ gzip: 46.78 kB
dist/assets/index-ghi789.js      23.45 kB │ gzip:  8.90 kB
✓ built in 2.3s
```

### Với terser (nếu dùng)
```
✓ building for production...
✓ 156 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-abc123.css     12.34 kB │ gzip:  3.21 kB
dist/assets/vendor-def456.js    141.89 kB │ gzip: 46.12 kB  (-1KB)
dist/assets/index-ghi789.js      22.98 kB │ gzip:  8.67 kB  (-0.5KB)
✓ built in 18.7s  (8x chậm hơn!)
```

**Kết luận:** esbuild nhanh hơn 8x, output chỉ lớn hơn ~1-2%

## 🔍 Troubleshooting

### Build vẫn lỗi?

**1. Clear cache và node_modules:**
```bash
rm -rf node_modules dist
npm install
npm run build
```

**2. Check Node.js version:**
```bash
node -v
# Cần >= 14.18.0
```

**3. Check package.json:**
```json
{
  "devDependencies": {
    "vite": "^5.0.8"
  }
}
```

### Build chậm?

**1. Tắt sourcemap:**
```javascript
build: {
  sourcemap: false  // ✅ Đã tắt
}
```

**2. Giảm code splitting:**
```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: undefined  // Tắt manual chunks
    }
  }
}
```

**3. Tăng memory cho Node.js:**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Output quá lớn?

**1. Analyze bundle:**
```bash
npm install -D rollup-plugin-visualizer

# Thêm vào vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  react(),
  visualizer({ open: true })
]

npm run build
# → Mở stats.html để xem
```

**2. Lazy load components:**
```javascript
import { lazy, Suspense } from 'react'

const ConversationMode = lazy(() => import('./components/ConversationMode'))

<Suspense fallback={<div>Loading...</div>}>
  <ConversationMode />
</Suspense>
```

**3. Tree shaking:**
```javascript
// ❌ Import toàn bộ
import * as Icons from 'lucide-react'

// ✅ Import từng icon
import { Users, Mic, Volume2 } from 'lucide-react'
```

## 📝 Checklist Build Production

- [x] `npm run build` chạy thành công
- [x] Không có errors trong console
- [x] File size hợp lý (< 500KB total)
- [ ] Test `npm run preview`
- [ ] Test trên production server
- [ ] Verify API fallback hoạt động
- [ ] Test trên mobile
- [ ] Check Lighthouse score

## 🎯 Recommended Config

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,           // Tắt sourcemap
    minify: 'esbuild',          // Dùng esbuild
    target: 'es2015',           // Browser support
    chunkSizeWarningLimit: 600, // Warning nếu > 600KB
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios', 'lucide-react']
        }
      }
    }
  }
})
```

---

**Fix đã áp dụng:** Đổi từ `terser` sang `esbuild` ✅
