# Microsoft Translator Clone

Ứng dụng dịch thuật tương tự Microsoft Translator với giao diện hiện đại và tính năng đầy đủ.

## ✨ Tính năng

### 📝 Text Translation Mode
- 🌍 **Dịch đa ngôn ngữ**: Hỗ trợ hơn 30 ngôn ngữ phổ biến
- 🔍 **Tự động nhận diện ngôn ngữ**: Tự động phát hiện ngôn ngữ nguồn
- 🔄 **Hoán đổi ngôn ngữ**: Nhanh chóng đổi ngôn ngữ nguồn và đích
- 🔊 **Text-to-Speech**: Nghe phát âm văn bản bằng giọng nói tự nhiên
- 📋 **Sao chép nhanh**: Copy kết quả dịch chỉ với một click
- ⚡ **Dịch real-time**: Tự động dịch khi bạn gõ

### 👥 Conversation Mode (Chế độ hội thoại)
- 🎤 **Speech Recognition**: Nhận diện giọng nói tự động bằng Web Speech API
- 🤚 **Hands-Free Mode**: Chế độ rảnh tay - chỉ cần nói, không cần nhấn nút!
- 🗣️ **Multi-user Support**: Hỗ trợ nhiều người tham gia cùng lúc
- 🌐 **Real-time Translation**: Dịch và phát âm tự động cho từng người
- 🔊 **Auto Text-to-Speech**: Tự động đọc bản dịch cho người nghe
- ⚙️ **Settings Panel**: Tùy chỉnh tốc độ giọng nói, bật/tắt auto-speak
- 🏠 **Room Management**: Tạo và tham gia phòng với mã code
- 👤 **Participant Tracking**: Theo dõi người tham gia và ngôn ngữ của họ
- 💬 **Message History**: Lưu lịch sử hội thoại với bản dịch đa ngôn ngữ

### 🌐 Google Meet Integration (Chrome Extension)
- 🎯 **Overlay trực tiếp**: Phụ đề dịch ngay trên Google Meet
- 🎤 **Real-time Captions**: Nhận diện và dịch trong cuộc họp
- 🔊 **Auto Speech Output**: Phát âm bản dịch tự động
- 🎨 **Beautiful UI**: Gradient overlay, không che video

### 🎨 Giao diện
- **Thiết kế hiện đại**: UI đẹp mắt với TailwindCSS
- 📱 **Responsive**: Hoạt động tốt trên mọi thiết bị

## 🚀 Cài đặt

### Yêu cầu

- Node.js 16+ 
- npm hoặc yarn

### Các bước cài đặt

1. Clone repository hoặc tải về source code

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy ứng dụng ở chế độ development:
```bash
npm run dev
```

4. Mở trình duyệt và truy cập: `http://localhost:3000`

### Cài đặt Google Meet Extension (Tùy chọn)

1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật "Developer mode" ở góc trên bên phải
3. Click "Load unpacked"
4. Chọn thư mục `chrome-extension` trong project
5. Extension sẽ xuất hiện trên thanh công cụ Chrome
6. Tham gia Google Meet và click icon extension để kích hoạt!

## 🏗️ Build cho production

```bash
npm run build
```

Sau khi build, các file sẽ được tạo trong thư mục `dist/`

## 📦 Công nghệ sử dụng

- **React 18**: Framework UI
- **Vite**: Build tool nhanh và hiện đại
- **TailwindCSS**: Styling
- **Lucide React**: Icons đẹp mắt
- **Axios**: HTTP client
- **MyMemory Translation API**: API dịch thuật miễn phí

## 🎯 Cách sử dụng

### Text Translation Mode

1. **Nhập văn bản**: Gõ hoặc paste văn bản cần dịch vào ô bên trái
2. **Chọn ngôn ngữ**: 
   - Ngôn ngữ nguồn: Chọn "Detect Language" để tự động nhận diện
   - Ngôn ngữ đích: Chọn ngôn ngữ bạn muốn dịch sang
3. **Xem kết quả**: Kết quả dịch sẽ hiển thị tự động ở ô bên phải
4. **Tính năng bổ sung**:
   - Click icon 🔊 để nghe phát âm
   - Click icon 📋 để copy văn bản
   - Click icon ↔️ để hoán đổi ngôn ngữ
   - Click icon ✕ để xóa văn bản

### Conversation Mode (Chế độ hội thoại nhiều người)

1. **Tạo phòng mới**:
   - Nhập tên của bạn
   - Chọn ngôn ngữ của bạn
   - Click "Tạo phòng mới"
   - Chia sẻ mã phòng với người khác

2. **Tham gia phòng**:
   - Nhập tên của bạn
   - Chọn ngôn ngữ của bạn
   - Nhập mã phòng (6 ký tự)
   - Click "Tham gia phòng"

3. **Sử dụng trong phòng**:
   
   **Chế độ thường:**
   - Click nút microphone (🎤) để bắt đầu nói
   - Nói bằng ngôn ngữ của bạn
   - Click lại để dừng lắng nghe
   
   **Chế độ rảnh tay (Hands-Free) - KHUYÊN DÙNG:**
   - Click "🎤 Bật chế độ rảnh tay"
   - Chỉ cần nói - không cần nhấn gì!
   - Ứng dụng tự động:
     - Nhận diện giọng nói của bạn
     - Dịch sang ngôn ngữ của người khác trong phòng
     - Phát âm bản dịch cho họ nghe
   - Xem lịch sử hội thoại với tất cả bản dịch
   - Click "🤚 Tắt chế độ rảnh tay" khi muốn dừng

4. **Quản lý phòng**:
   - Click icon 📋 để copy mã phòng
   - Click icon 🗑️ để xóa lịch sử
   - Click "Rời phòng" để thoát

**Lưu ý**: Cho phép truy cập microphone khi trình duyệt yêu cầu để sử dụng tính năng nhận diện giọng nói.

## 🌐 Ngôn ngữ được hỗ trợ

English, Tiếng Việt, Español, Français, Deutsch, Italiano, Português, Русский, 日本語, 한국어, 中文, العربية, हिन्दी, ไทย, Türkçe, Nederlands, Polski, Svenska, Dansk, Suomi, Norsk, Čeština, Ελληνικά, עברית, Bahasa Indonesia, Bahasa Melayu, Română, Українська, Magyar và nhiều ngôn ngữ khác.

## 📝 Lưu ý

- API MyMemory có giới hạn 5000 ký tự mỗi lần dịch
- Để sử dụng không giới hạn, bạn có thể đăng ký API key miễn phí tại [MyMemory](https://mymemory.translated.net/)
- Tính năng Text-to-Speech và Speech Recognition sử dụng Web Speech API có sẵn trong trình duyệt
- **Conversation Mode** yêu cầu:
  - Trình duyệt hỗ trợ Web Speech API (Chrome, Edge, Safari)
  - Quyền truy cập microphone
  - Kết nối internet ổn định
- Hiện tại Conversation Mode chỉ hoạt động local (không có backend real-time). Để sử dụng thực tế với nhiều người, cần tích hợp WebSocket/Socket.io

## 🔧 Tùy chỉnh

Bạn có thể dễ dàng thay đổi:
- Thêm/bớt ngôn ngữ trong file `src/data/languages.js`
- Thay đổi API dịch thuật trong `src/services/translationService.js`
- Tùy chỉnh giao diện trong `src/App.jsx`

## 📄 License

MIT License - Tự do sử dụng cho mục đích cá nhân và thương mại.
