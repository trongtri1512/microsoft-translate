# 🚀 Hướng dẫn Deployment - Production

## 📋 Tổng quan

Ứng dụng sử dụng **Vite** với cấu hình tối ưu cho production:
- **Development**: Port `5173`
- **Preview**: Port `4173`
- **Build output**: Thư mục `dist/`

## 🔧 Ports Configuration

### Development Mode
```bash
npm run dev
# Chạy tại: http://localhost:5173
```

### Production Preview
```bash
npm run build
npm run preview
# Chạy tại: http://localhost:4173
```

### Thay đổi Port

Chỉnh sửa `vite.config.js`:
```javascript
server: {
  port: 5173,  // Port cho development
  host: true   // Cho phép truy cập từ network
},
preview: {
  port: 4173,  // Port cho production preview
  host: true
}
```

## 🏗️ Build cho Production

### 1. Build ứng dụng

```bash
npm run build
```

**Output:**
- Thư mục: `dist/`
- Files được minify và optimize
- Sourcemaps: Tắt (để giảm kích thước)
- Code splitting: Tự động (vendor, utils chunks)

### 2. Test Production Build

```bash
npm run preview
```

Truy cập: http://localhost:4173

### 3. Kiểm tra Build

```bash
# Xem kích thước files
ls -lh dist/

# Xem cấu trúc
tree dist/
```

## 🌐 Deployment Options

### Option 1: Netlify (Khuyến nghị) ⭐

**Bước 1: Tạo file `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

**Bước 2: Deploy**

```bash
# Cài Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

**Hoặc:** Kết nối GitHub repo với Netlify dashboard

### Option 2: Vercel

**Bước 1: Tạo file `vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Bước 2: Deploy**

```bash
# Cài Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 3: GitHub Pages

**Bước 1: Cập nhật `vite.config.js`**

```javascript
export default defineConfig({
  base: '/microsoft-translate/', // Tên repo của bạn
  // ... rest of config
})
```

**Bước 2: Thêm script vào `package.json`**

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

**Bước 3: Deploy**

```bash
npm install -g gh-pages
npm run deploy
```

### Option 4: Docker

**Tạo `Dockerfile`:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Tạo `nginx.conf`:**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Build & Run:**

```bash
# Build image
docker build -t translator-app .

# Run container
docker run -d -p 8080:80 translator-app
```

### Option 5: VPS/Server (Ubuntu)

**Bước 1: Cài đặt dependencies**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Cài PM2
sudo npm install -g pm2
```

**Bước 2: Upload code**

```bash
# Clone repo
git clone https://github.com/your-username/microsoft-translate.git
cd microsoft-translate

# Install & build
npm install
npm run build
```

**Bước 3: Serve với PM2**

```bash
# Cài serve
npm install -g serve

# Chạy với PM2
pm2 start "serve -s dist -l 4173" --name translator-app

# Auto-start on reboot
pm2 startup
pm2 save
```

**Bước 4: Nginx Reverse Proxy**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Environment Variables

Tạo file `.env.production`:

```bash
# API Keys (nếu có)
VITE_MYMEMORY_API_KEY=your-key-here

# Analytics (tùy chọn)
VITE_GA_ID=your-google-analytics-id
```

**Lưu ý:** Vite chỉ expose biến bắt đầu với `VITE_`

## ⚡ Performance Optimization

### 1. Code Splitting (Đã config)

```javascript
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom'],
      utils: ['axios', 'lucide-react']
    }
  }
}
```

### 2. Lazy Loading Components

```javascript
// Trong App.jsx
const ConversationMode = lazy(() => import('./components/ConversationMode'))

// Wrap với Suspense
<Suspense fallback={<div>Loading...</div>}>
  <ConversationMode />
</Suspense>
```

### 3. Compression

Thêm vào `vite.config.js`:

```bash
npm install vite-plugin-compression -D
```

```javascript
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    })
  ]
})
```

## 📊 Build Analysis

```bash
# Cài plugin
npm install rollup-plugin-visualizer -D

# Thêm vào vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  react(),
  visualizer({
    open: true,
    gzipSize: true,
    brotliSize: true
  })
]

# Build và xem report
npm run build
```

## 🔍 Testing Production Build

### 1. Lighthouse Audit

```bash
# Chrome DevTools
1. Mở http://localhost:4173
2. F12 → Lighthouse tab
3. Generate report
```

### 2. Performance Check

```bash
# Sử dụng Chrome DevTools
1. Network tab → Disable cache
2. Performance tab → Record
3. Kiểm tra load time, bundle size
```

## 📝 Checklist trước khi Deploy

- [ ] `npm run build` chạy thành công
- [ ] `npm run preview` hoạt động đúng
- [ ] Test tất cả tính năng trên preview
- [ ] Kiểm tra Console không có errors
- [ ] Test trên mobile/tablet
- [ ] Kiểm tra API fallback hoạt động
- [ ] Test Speech Recognition & TTS
- [ ] Verify Chrome Extension (nếu dùng)
- [ ] Update README với production URL
- [ ] Backup code lên GitHub

## 🚨 Troubleshooting

### Build fails

```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Preview không chạy

```bash
# Kiểm tra port đã được dùng chưa
lsof -i :4173

# Kill process nếu cần
kill -9 <PID>
```

### API không hoạt động

- Kiểm tra CORS settings
- Verify API endpoints accessible
- Check browser console for errors

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs: `npm run build` output
2. Xem browser console (F12)
3. Test từng API trong `API-GUIDE.md`
4. Verify network connectivity

---

**Chúc bạn deploy thành công! 🎉**
