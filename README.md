# 🎵 Spotify Clone

Một ứng dụng web nhạc streaming được phát triển nhằm mô phỏng chức năng cơ bản của Spotify với các tính năng như phát nhạc, quản lý playlist, bình luận, và hệ thống thanh toán.

---

## ✨ Tính năng chính

- 🎵 **Phát nhạc trực tuyến** - Nghe nhạc với chất lượng cao
- 📋 **Quản lý Playlist** - Tạo, chỉnh sửa và xóa playlist cá nhân
- ❤️ **Yêu thích bài hát** - Lưu các bài hát yêu thích vào thư viện
- 👤 **Quản lý người dùng** - Đăng ký, đăng nhập, cập nhật hồ sơ
- 💳 **Hệ thống thanh toán** - PayPal integration cho gói Premium
- 🎧 **Lyrics** - Hiển thị lời bài hát
- 💬 **Chat** - Giao tiếp giữa các người dùng
- 👨‍💼 **Admin Dashboard** - Quản lý người dùng, bài hát, album
- ⏲️ **Sleep Timer** - Tự động dừng phát nhạc sau thời gian đặt
- 🔍 **Tìm kiếm** - Tìm kiếm bài hát, album, artist

---

## 🛠 Công nghệ sử dụng

| Phần | Công nghệ | Phiên bản |
|------|-----------|----------|
| **Frontend** | React + TypeScript | - |
| **Backend** | Django + Django REST Framework | Python 3.x |
| **Database** | MySQL | - |
| **UI Framework** | Tailwind CSS | - |
| **Build Tool** | Vite | - |
| **Payment** | PayPal SDK | - |

---

## 📁 Cấu trúc dự án

```
Spotify-Clone/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── routes/          # Route configuration
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                  # Django backend
│   ├── api/                 # Main API app
│   │   ├── models.py
│   │   ├── serializer.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── migrations/
│   ├── app/                 # Music app
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── migrations/
│   ├── payments/            # Payment app
│   ├── backend/             # Project settings
│   ├── manage.py
│   └── settings.py
│
└── README.md
```

---

## 📋 Yêu cầu hệ thống

### Frontend
- Node.js >= 14.x
- npm hoặc yarn

### Backend
- Python >= 3.8
- pip (Python package manager)
- MySQL Server

---

## 🚀 Hướng dẫn cài đặt

### 1. Clone repository

```bash
git clone https://github.com/yourusername/Spotify-Clone.git
cd Spotify-Clone
```

### 2. Cài đặt Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv

# Kích hoạt virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Cài đặt dependencies
pip install -r ../Requirements.txt

# Chạy migrations
python manage.py migrate

# (Optional) Tạo superuser cho admin
python manage.py createsuperuser
```

### 3. Cài đặt Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# (Optional) Cài đặt yarn
# npm install -g yarn
```

---

## ▶️ Chạy ứng dụng

### Backend

```bash
cd backend
python manage.py runserver
```

Ứng dụng backend sẽ chạy tại: `http://localhost:8000`

### Frontend

```bash
cd frontend
npm run dev
```

Ứng dụng frontend sẽ chạy tại: `http://localhost:5173` (Vite default port)

---

## 🔐 Cấu hình Database

1. Tạo database MySQL:
```sql
CREATE DATABASE spotify_clone;
```

2. Cập nhật `backend/backend/settings.py` với thông tin kết nối:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'spotify_clone',
        'USER': 'your_mysql_user',
        'PASSWORD': 'your_mysql_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

---

## 💳 Cấu hình PayPal

1. Đăng ký tài khoản PayPal Developer
2. Lấy Client ID và Secret
3. Thêm vào frontend `.env`:
```
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

---

## 📝 API Documentation

### Endpoints chính

- `GET /api/songs/` - Lấy danh sách bài hát
- `POST /api/auth/login/` - Đăng nhập
- `POST /api/auth/register/` - Đăng ký
- `GET /api/playlist/` - Lấy playlist
- `POST /api/payment/` - Xử lý thanh toán

Để xem chi tiết đầy đủ, truy cập: `http://localhost:8000/api/`

---

## 📦 Dependencies

### Backend
- Django
- Django REST Framework
- MySQL Python connector
- Python-decouple

Xem đầy đủ tại: [Requirements.txt](Requirements.txt)

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios

---

## 🎯 Tính năng đang phát triển

- [ ] Recommendation system
- [ ] Social features
- [ ] Offline mode
- [ ] Podcast support
- [ ] Podcast support
- [ ] Analytics dashboard

---

## 🐛 Báo cáo lỗi

Nếu bạn tìm thấy bug, vui lòng mở issue trên GitHub.

---

## 📄 License

Dự án này được cấp phép dưới [MIT License](LICENSE)

---

## 👨‍💻 Tác giả

**Phát triển bởi:** Spotify Clone Team

---

## 📞 Liên hệ

Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ qua email hoặc mở issue.

---

**Cảm ơn bạn đã sử dụng Spotify Clone! 🎵**

