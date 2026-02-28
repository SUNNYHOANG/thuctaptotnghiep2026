# 🚀 Django Backend - Quick Start

## Cài Đặt Nhanh (5 phút)

### 1️⃣ Cài đặt và chạy Django

```bash
cd django-backend

# Tạo virtual environment
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate    # Linux/Mac

# Cài đặt packages
pip install -r requirements.txt

# Tạo file .env
copy .env.example .env    # Windows
# cp .env.example .env    # Linux/Mac

# ⚠️ CHỈNH SỬA file .env với thông tin MySQL

# Chạy migrations
python manage.py makemigrations
python manage.py migrate

# Tạo admin
python create_admin.py

# Chạy server
python manage.py runserver
```

✅ Django chạy tại: `http://localhost:8000`

### 2️⃣ Truy cập Django Admin

- URL: `http://localhost:8000/admin`
- Username: `admin`
- Password: `admin123`

### 3️⃣ Cập nhật Frontend

Frontend đã được cập nhật để sử dụng Django API tại port 8000.

Chạy frontend như bình thường:
```bash
cd frontend
npm install
npm run dev
```

---

## 📝 Khác Biệt Chính với Flask

1. **Port:** Django chạy tại `8000` (thay vì `5001`)
2. **API URL:** `http://localhost:8000/api`
3. **Admin Panel:** Có sẵn tại `/admin`
4. **Response Format:** Có thêm `refresh_token`

---

## ✅ Checklist

- [ ] Virtual environment đã được tạo
- [ ] Packages đã được cài đặt
- [ ] File `.env` đã được cấu hình
- [ ] Migrations đã được chạy
- [ ] Admin đã được tạo
- [ ] Server đang chạy tại port 8000
- [ ] Django Admin có thể truy cập
- [ ] Frontend đã được cập nhật

---

**Chúc bạn thành công! 🎉**
