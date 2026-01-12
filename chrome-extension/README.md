# Google Meet Translator - Chrome Extension

Chrome Extension để tích hợp real-time translation trực tiếp vào Google Meet.

## ✨ Tính năng

- 🎯 **Overlay trực tiếp trên Google Meet**: Hiển thị phụ đề dịch ngay trên màn hình Meet
- 🎤 **Speech Recognition**: Tự động nhận diện giọng nói trong cuộc họp
- 🌐 **Dịch real-time**: Dịch và hiển thị ngay lập tức
- 🔊 **Text-to-Speech**: Phát âm bản dịch tự động
- 🎨 **UI đẹp mắt**: Overlay trong suốt, không che khuất video
- ⚙️ **Tùy chỉnh ngôn ngữ**: Chọn ngôn ngữ của bạn dễ dàng

## 🚀 Cài đặt

### Bước 1: Load Extension vào Chrome

1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật "Developer mode" ở góc trên bên phải
3. Click "Load unpacked"
4. Chọn thư mục `chrome-extension`

### Bước 2: Sử dụng

1. Tham gia một cuộc họp Google Meet
2. Click vào icon extension trên thanh công cụ
3. Click "Activate Translator"
4. Overlay sẽ xuất hiện ở góc dưới bên phải
5. Chọn ngôn ngữ của bạn
6. Click nút microphone để bắt đầu lắng nghe
7. Nói và xem bản dịch xuất hiện real-time!

## 📋 Cách hoạt động

```
Google Meet Call
    ↓
Speech Recognition (Web Speech API)
    ↓
Detect Language
    ↓
Translate (MyMemory API)
    ↓
Display Caption + Text-to-Speech
```

## 🎯 Use Cases

### 1. Họp đa quốc gia
- Mỗi người nói ngôn ngữ của mình
- Extension tự động dịch và hiển thị phụ đề
- Tất cả đều hiểu nhau!

### 2. Học ngoại ngữ
- Tham gia cuộc họp bằng ngôn ngữ đang học
- Xem phụ đề tiếng mẹ đẻ để hiểu
- Cải thiện kỹ năng nghe

### 3. Hội nghị quốc tế
- Không cần thông dịch viên
- Tiết kiệm chi phí
- Giao tiếp trực tiếp

## ⚙️ Tùy chỉnh

### Thay đổi vị trí overlay
Sửa trong `overlay.css`:
```css
#meet-translator-overlay {
  bottom: 20px;  /* Thay đổi vị trí dọc */
  right: 20px;   /* Thay đổi vị trí ngang */
}
```

### Thêm ngôn ngữ
Sửa trong `content.js`, thêm vào select options:
```html
<option value="th">ไทย</option>
<option value="id">Bahasa Indonesia</option>
```

## 🔧 Cấu trúc Files

```
chrome-extension/
├── manifest.json          # Extension config
├── content.js            # Main logic, injected vào Meet
├── overlay.css           # Styling cho overlay
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── background.js         # Background service worker
└── icons/               # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🌟 Tính năng nâng cao (có thể thêm)

- [ ] Lưu lịch sử cuộc họp
- [ ] Export transcript
- [ ] Nhiều người cùng lúc với ngôn ngữ khác nhau
- [ ] Tích hợp với backend để sync giữa các người dùng
- [ ] Nhận diện người nói (speaker identification)
- [ ] Phụ đề cho video đã ghi

## 📝 Lưu ý

- Extension cần quyền truy cập microphone
- Chỉ hoạt động trên `meet.google.com`
- Sử dụng MyMemory API (miễn phí, có giới hạn)
- Để production, nên có backend riêng

## 🔗 Tích hợp với Web App

Extension có thể mở full web app (localhost:3000) để:
- Tạo phòng conversation mode
- Quản lý nhiều người tham gia
- Tính năng nâng cao hơn

## 📄 License

MIT License
