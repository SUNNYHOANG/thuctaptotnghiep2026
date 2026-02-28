# Hướng Dẫn Chuyển Đổi Từ Flask Sang Django

## 📋 Tổng Quan

Hệ thống đã được chuyển đổi hoàn toàn từ Flask sang Django với các tính năng tương đương.

## 🔄 Những Gì Đã Thay Đổi

### Backend

#### 1. Framework
- ❌ Flask → ✅ Django + Django REST Framework

#### 2. Models
- ❌ Flask-SQLAlchemy → ✅ Django ORM
- Custom User Model với phân quyền
- Tự động migrations

#### 3. Authentication
- ❌ Flask-JWT-Extended → ✅ djangorestframework-simplejwt
- JWT tokens với refresh token
- Token blacklist support

#### 4. API Structure
- ❌ Flask routes → ✅ Django REST Framework views
- Serializers cho validation
- Permission classes

#### 5. Admin Panel
- ❌ Không có → ✅ Django Admin tích hợp sẵn

### Frontend

#### 1. API URL
- ❌ `http://localhost:5001/api` → ✅ `http://localhost:8000/api`

#### 2. Response Format
- Thêm `refresh_token` trong response
- Field name: `access_token` (giữ nguyên)

#### 3. Logout
- Cần gửi `refresh_token` khi logout

## 📁 Cấu Trúc Thư Mục

### Flask (cũ)
```
python-backend/
├── app.py
├── models.py
├── middleware.py
└── routes/
```

### Django (mới)
```
django-backend/
├── manage.py
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── accounts/
    ├── models.py
    ├── views.py
    ├── serializers.py
    ├── urls.py
    └── admin.py
```

## 🚀 Cách Sử Dụng

### Backend Django

1. **Cài đặt:**
```bash
cd django-backend
pip install -r requirements.txt
```

2. **Cấu hình:**
```bash
cp .env.example .env
# Chỉnh sửa .env
```

3. **Migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

4. **Chạy:**
```bash
python manage.py runserver
```

### Frontend

Frontend đã được cập nhật tự động để tương thích với Django API.

## ✅ Tính Năng Tương Đương

| Tính Năng | Flask | Django |
|-----------|-------|--------|
| Đăng ký | ✅ | ✅ |
| Đăng nhập | ✅ | ✅ |
| Đăng xuất | ✅ | ✅ |
| JWT Auth | ✅ | ✅ |
| Phân quyền | ✅ | ✅ |
| Admin Panel | ❌ | ✅ |
| API Docs | ❌ | ✅ (có thể thêm) |

## 🎯 Lợi Ích Django

1. **Admin Panel:** Quản lý users và data dễ dàng
2. **ORM mạnh:** Queries và migrations tự động
3. **Security:** Built-in security features
4. **Scalability:** Phù hợp ứng dụng lớn
5. **Ecosystem:** Nhiều packages và tools

## 📝 Lưu Ý

1. **Port khác:** Django chạy port 8000 (Flask là 5001)
2. **Database:** Cần chạy migrations để tạo bảng
3. **Admin:** Có thể quản lý qua Django Admin
4. **Tokens:** Có refresh token để refresh access token

## 🔧 Troubleshooting

### Lỗi: "ModuleNotFoundError: No module named 'pymysql'"
```bash
pip install PyMySQL
```

### Lỗi: "Table doesn't exist"
```bash
python manage.py migrate
```

### Lỗi: "Can't connect to MySQL"
- Kiểm tra MySQL đang chạy
- Kiểm tra thông tin trong `.env`

---

**Hệ thống đã sẵn sàng sử dụng với Django! 🎉**
