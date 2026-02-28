# Django Backend - Authentication & Authorization System

Hệ thống đăng nhập, đăng ký và phân quyền bằng Django REST Framework.

## Cài Đặt

### 1. Cài đặt dependencies
```bash
pip install -r requirements.txt
```

### 2. Cấu hình môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
SECRET_KEY=your-secret-key-change-in-production
DB_NAME=dkhp1
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
```

### 3. Chạy migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Tạo superuser (admin)
```bash
python manage.py createsuperuser
```

Hoặc sử dụng script:
```bash
python create_admin.py
```

### 5. Chạy server
```bash
python manage.py runserver
```

Server sẽ chạy tại `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/token/refresh` - Refresh token

### Protected Routes
- `GET /api/admin/dashboard` - Dashboard admin (chỉ admin)
- `GET /api/giangvien/dashboard` - Dashboard giảng viên (chỉ giảng viên)
- `GET /api/sinhvien/dashboard` - Dashboard sinh viên (chỉ sinh viên)
- `GET /api/users` - Danh sách users (chỉ admin)

## Phân Quyền

### Roles
1. **admin** - Quản trị viên (toàn quyền)
2. **giangvien** - Giảng viên
3. **sinhvien** - Sinh viên

## Request/Response Examples

### Đăng ký
```json
POST /api/auth/register
{
  "username": "student001",
  "password": "password123",
  "password2": "password123",
  "email": "student@example.com",
  "hoten": "Nguyễn Văn A",
  "role": "sinhvien",
  "mssv": "SV001",
  "malop": "L01",
  "makhoa": "K01"
}
```

### Đăng nhập
```json
POST /api/auth/login
{
  "username": "student001",
  "password": "password123"
}

Response:
{
  "message": "Đăng nhập thành công",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "student001",
    "email": "student@example.com",
    "hoten": "Nguyễn Văn A",
    "role": "sinhvien",
    "mssv": "SV001"
  }
}
```

### Sử dụng token
```json
GET /api/auth/me
Headers: {
  "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## Django Admin

Truy cập Django Admin tại: `http://localhost:8000/admin`

Đăng nhập với superuser để quản lý users và các models khác.

## Features

- ✅ Custom User Model với phân quyền
- ✅ JWT Authentication
- ✅ Role-based access control
- ✅ Django Admin integration
- ✅ RESTful API
- ✅ CORS support
- ✅ Password validation
