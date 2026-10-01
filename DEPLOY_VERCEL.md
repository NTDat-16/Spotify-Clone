# 🚀 Hướng dẫn chi tiết Deploy Spotify Clone lên Vercel

Dự án Spotify Clone gồm 2 phần độc lập: **Frontend (React + Vite)** và **Backend (Django REST Framework)**. Trên Vercel, chúng ta sẽ tạo **2 Project riêng biệt** từ cùng 1 repository GitHub.

---

## 📑 Mục lục
1. [Chuẩn bị Database PostgreSQL (Supabase hoặc Neon)](#1-chuẩn-bị-database-postgresql)
2. [Migrate Schema & Import Dữ liệu vào Database](#2-migrate-schema--import-dữ-liệu-vào-database)
3. [Deploy Backend lên Vercel](#3-deploy-backend-lên-vercel)
4. [Deploy Frontend lên Vercel](#4-deploy-frontend-lên-vercel)
5. [Cập nhật CORS & Biến môi trường sau khi có URL](#5-cập-nhật-cors--biến-môi-trường)

---

## 1. Chuẩn bị Database PostgreSQL

Vì Vercel là môi trường Serverless (không lưu trữ file MySQL localhost), bạn cần 1 database PostgreSQL trên đám mây (miễn phí):

### Cách 1: Dùng Supabase (Khuyên dùng)
1. Đăng ký tài khoản tại [supabase.com](https://supabase.com) và tạo 1 Project mới.
2. Vào **Project Settings** → **Database** → kéo xuống mục **Connection string** → chọn tab **URI** và chọn chế độ **Transaction pooler (port 6543)**.
3. Chuỗi kết nối có dạng:
   ```text
   postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
   *(Thay `YOUR_PASSWORD` bằng mật khẩu database bạn đã đặt, URL-encode nếu mật khẩu có ký tự đặc biệt).*

### Cách 2: Dùng Neon PostgreSQL (Cực nhanh và nhẹ)
1. Đăng ký tại [neon.tech](https://neon.tech) và tạo project.
2. Copy chuỗi `postgresql://...` từ Dashboard (chọn pooled connection).

---

## 2. Migrate Schema & Import Dữ liệu vào Database

Từ máy tính cá nhân của bạn, hãy chạy migrate và import toàn bộ 22 bài hát, 29 nghệ sĩ, album sang database đám mây mới:

```powershell
cd backend

# Kích hoạt virtualenv
.\venv\Scripts\activate

# Đặt tạm thời DATABASE_URL trỏ đến Supabase/Neon của bạn:
$env:DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Chạy tạo toàn bộ bảng trong PostgreSQL
python manage.py migrate

# Nạp toàn bộ dữ liệu mẫu (bài hát, nghệ sĩ, album, tài khoản) đã xuất sẵn trong app_data.json
python manage.py loaddata app_data.json

# (Tùy chọn) Tạo tài khoản admin Django nếu cần
python manage.py createsuperuser
```

---

## 3. Deploy Backend lên Vercel

1. Đăng nhập [Vercel](https://vercel.com) → bấm **Add New...** → **Project**.
2. Chọn repository **Spotify-Clone**.
3. Cấu hình Project Backend:
   - **Project Name**: `spotify-clone-backend` (hoặc tên bạn muốn)
   - **Framework Preset**: `Other`
   - **Root Directory**: Bấm `Edit` và chọn thư mục `backend`
4. Mở rộng mục **Environment Variables** và thêm các biến sau:
   - `DJANGO_SECRET_KEY`: `django-insecure-your-random-production-secret-key-spotify`
   - `DEBUG`: `False`
   - `DATABASE_URL`: *(Dán chuỗi kết nối PostgreSQL Supabase/Neon từ Bước 1)*
   - `ALLOWED_HOSTS`: `.vercel.app,localhost`
   - `CORS_ALLOWED_ORIGINS`: `http://localhost:5173` *(Sẽ thêm domain frontend sau khi deploy frontend)*
   - `CSRF_TRUSTED_ORIGINS`: `http://localhost:5173`
   - `PAYPAL_CLIENT_ID`: `AY5SLnZXMLzSQwqlHiq1fI3x5HhGR994zmFQqXxUOkFng9WV50Lg3hZerAv9pa5NFvmgLliOqTTowgmW`
   - `PAYPAL_CLIENT_SECRET`: `EEBtnlJndYV3VXNtw2dBRZx8WvOJLubTvn5PI6WnhQpyKqrgBdiiUw2fTrt3D9ZQ8hlIkQYFaI1AZgqV`
   - `PAYPAL_MODE`: `sandbox`
5. Bấm **Deploy**.
6. Sau khi deploy xong, lưu lại domain backend được cấp (Ví dụ: `https://spotify-clone-backend-xyz.vercel.app`).
   - Kiểm tra endpoint hoạt động: `https://spotify-clone-backend-xyz.vercel.app/health/` -> trả về `{"status":"ok"}`.

---

## 4. Deploy Frontend lên Vercel

1. Trong Vercel Dashboard, bấm **Add New...** → **Project** một lần nữa.
2. Chọn lại repository **Spotify-Clone**.
3. Cấu hình Project Frontend:
   - **Project Name**: `spotify-clone-frontend`
   - **Framework Preset**: `Vite` (Vercel tự nhận diện)
   - **Root Directory**: Bấm `Edit` và chọn thư mục `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Mở rộng mục **Environment Variables** và thêm:
   - `VITE_API_URL`: `https://spotify-clone-backend-xyz.vercel.app` *(Domain backend lấy từ Bước 3, KHÔNG có dấu gạch chéo `/` ở cuối)*
   - `VITE_PAYPAL_CLIENT_ID`: *(Tùy chọn, mặc định đã có Sandbox Client ID)*
5. Bấm **Deploy**.
6. Sau khi deploy xong, bạn sẽ có URL frontend (Ví dụ: `https://spotify-clone-frontend-xyz.vercel.app`).

---

## 5. Cập nhật CORS & Biến môi trường

1. Quay lại Vercel Dashboard → chọn Project **spotify-clone-backend**.
2. Vào **Settings** → **Environment Variables**:
   - Chỉnh sửa `CORS_ALLOWED_ORIGINS`:
     ```text
     http://localhost:5173,https://spotify-clone-frontend-xyz.vercel.app
     ```
   - Chỉnh sửa `CSRF_TRUSTED_ORIGINS`:
     ```text
     http://localhost:5173,https://spotify-clone-frontend-xyz.vercel.app
     ```
3. Vào tab **Deployments** của backend → bấm biểu tượng `...` ở bản build mới nhất → chọn **Redeploy** (để Vercel áp dụng biến môi trường mới).

---

## 🎉 Hoàn tất!
Bây giờ ứng dụng Spotify Clone của bạn đã chạy 100% online trên Vercel:
- Phát nhạc trực tuyến
- Bảng xếp hạng, Album, Nghệ sĩ
- Danh sách yêu thích (Loved Songs)
- Quản lý Playlist cá nhân
- Đăng nhập, Hồ sơ cá nhân, Đổi mật khẩu
- Nâng cấp Premium qua cổng PayPal
- Chat giữa người dùng
- Trang Admin (`/admin`)
