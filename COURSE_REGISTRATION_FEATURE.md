# ✅ Tính Năng Đăng Ký Môn Học - Tài Liệu Triển Khai

## 📋 Tổng Quan
Đã thêm hoàn chỉnh tính năng đăng ký môn học cho sinh viên với khả năng quản lý từ phía admin.

---

## 🎯 Tính Năng Chính

### 1. **Trang Đăng Ký Môn Học Cho Sinh Viên** 
📍 `frontend/src/pages/CourseRegistration.jsx`

**Chức năng:**
- ✅ Xem danh sách môn học có sẵn để đăng ký
- ✅ Lọc theo học kỳ
- ✅ Xem chi tiết môn học (tên, số tín chỉ, học phí, giảng viên, phòng)
- ✅ Xem sức chứa lớp (thanh tiến trình)
- ✅ Đăng ký môn học
- ✅ Hủy đăng ký môn học đã chọn
- ✅ Xem danh sách môn học đã đăng ký

**Dữ liệu hiển thị:**
- Mã lớp học phần
- Tên môn học
- Số tín chỉ
- Học phí (định dạng VND)
- Giảng viên
- Lịch học
- Phòng học
- Số lượng đã đăng ký / tổng sỗ

**API sử dụng:**
- `GET /api/courses/available-for-registration/:mahocky`
- `POST /api/enrollments/register`
- `POST /api/enrollments/:madangky/cancel`
- `GET /api/enrollments/student/:mssv`

### 2. **Trang Quản Lý Mở/Đóng Đăng Ký Môn Học (Admin)**
📍 `frontend/src/pages/AdminCourseAvailability.jsx`

**Chức năng:**
- ✅ Xem tất cả lớp học phần
- ✅ Lọc theo trạng thái (Đang mở, Đã đóng, Đã hủy)
- ✅ Tìm kiếm theo tên môn học hoặc mã lớp
- ✅ Cập nhật trạng thái mở/đóng đăng ký
- ✅ Hiển thị thống kê
- ✅ Chọn học kỳ để quản lý

**Các trạng thái:**
- 🟢 **Đang Mở (dangmo)** - Sinh viên có thể đăng ký
- 🔴 **Đã Đóng (dong)** - Sinh viên không thể đăng ký
- ⚪ **Đã Hủy (huy)** - Lớp đã bị hủy

**API sử dụng:**
- `GET /api/courses` (lấy tất cả môn học)
- `PUT /api/class-sections/:malophoc` (cập nhật trạng thái)

---

## 🔧 Cấu Hình Backend

### Backend Routes
✅ Đã có sẵn các endpoint cần thiết:
- `GET /api/courses/available-for-registration/:mahocky` (mới)
- `PUT /api/class-sections/:malophoc` (cập nhật lophoc.trangthai)
- `POST /api/enrollments/register` (đăng ký)
- `POST /api/enrollments/:id/cancel` (hủy đăng ký)
- `GET /api/enrollments/student/:mssv` (danh sách đăng ký)

### Backend Models
✅ Các model được sử dụng:
- **Course.js** - Có method `getAvailableForRegistration(mahocky)`
- **ClassSection.js** - Có method `update()` để cập nhật trangthai
- **Enrollment.js** - Có đầy đủ các method CRUD

### Database Columns
```
lophoc.trangthai ENUM('dangmo', 'dong', 'huy') DEFAULT 'dangmo'
lophoc.soluongtoida INT - sức chứa tối đa
lophoc.soluongdadangky INT DEFAULT 0 - số lượng đã đăng ký
monhoc.hocphi DECIMAL(12,0) - học phí
```

---

## 🎨 Cấu Hình Frontend

### API Modules
✅ **enrollmentAPI.js** - Wrapper cho các API liên quan đến đăng ký
```javascript
- register(data) - POST /enrollments/register
- getByStudent(mssv, mahocky) - GET /enrollments/student/:mssv
- getTimetable(mssv, mahocky) - GET /enrollments/student/:mssv/timetable/:mahocky
- cancel(madangky) - POST /enrollments/:madangky/cancel
- getByClassSection(malophoc) - GET /enrollments/class-section/:malophoc
```

✅ **classSectionAPI.js** - Cập nhật để sử dụng VITE_API_BASE chung
```javascript
- getAll() - GET /class-sections
- getById(id) - GET /class-sections/:id
- update(id, data) - PUT /class-sections/:id (cho cập nhật trangthai)
- ...các method khác...
```

✅ **adminAPI.js** - Thêm method mới
```javascript
- getAvailableCoursesForRegistration(mahocky)
```

### Routes (App.jsx)
✅ Đã thêm route:
```
/dang-ky-mon-hoc - CourseRegistration page (sinhvien)
/admin/course-availability - AdminCourseAvailability page (admin)
```

### Navigation
✅ **Header.jsx** - Thêm link "Đăng Ký Môn Học" vào menu sinh viên
✅ **RoleBasedNavigation.jsx** - Thêm "Mở/Đóng Đăng Ký" vào admin menu

---

## 🗄️ Database Schema

### Bảng liên quan
```
monhoc (courses)
├── mamonhoc - mã môn học
├── tenmonhoc - tên môn học
├── sotinchi - số tín chỉ
└── hocphi - học phí (mới thêm)

lophoc (class_sections)
├── malophoc - mã lớp học phần
├── mamonhoc - mã môn (FK)
├── mahocky - mã học kỳ
├── magiaovien - mã giảng viên
├── maphong - mã phòng
├── lichhoc - lịch học
├── soluongtoida - sức chứa
├── soluongdadangky - đã đăng ký
└── trangthai - ENUM('dangmo','dong','huy') ⭐

hocky (semesters)
├── mahocky - mã học kỳ
├── tenhocky - tên học kỳ
└── namhoc - năm học

dangkyhocphan (enrollments)
├── madangky - mã đăng ký
├── mssv - mã sinh viên
├── malophoc - mã lớp
├── ngaydangky - ngày đăng ký
└── trangthai - trạng thái

giangvien (teachers)
└── ...

phonghoc (rooms)
└── ...
```

---

## 🎬 Quy Trình Hoạt Động

### Từ Phía Admin
1. **Quản Lý Mở/Đóng Đăng Ký**
   - Vào `/admin/course-availability`
   - Chọn học kỳ
   - Xem danh sách lớp học phần
   - Nhấn "🔓 Mở Đk" hoặc "🔒 Đóng Đk" để cập nhật trạng thái
   - Hệ thống gửi `PUT /api/class-sections/:malophoc` với `{trangthai: 'dangmo'/'dong'}`
   - Cập nhật ngay lập tức trong bảng

### Từ Phía Sinh Viên
1. **Đăng Ký Môn Học**
   - Vào `/dang-ky-mon-hoc` (menu > "Đăng Ký Môn Học")
   - Chọn học kỳ
   - Xem danh sách môn học có sẵn (trangthai = 'dangmo')
   - Nhấn "Đăng Ký" trên môn muốn học
   - Hệ thống gửi `POST /api/enrollments/register` với `{malophoc, mssv}`
   - Backend kiểm tra:
     - Lớp đang mở (trangthai = 'dangmo')
     - Còn chỗ trống (soluongdadangky < soluongtoida)
     - Chưa đăng ký lớp này trước đó
   - Nếu ok, thêm bản ghi vào bảng dangkyhocphan và cập nhật soluongdadangky

2. **Hủy Đăng Ký**
   - Nhấn "Hủy Đăng Ký" trên môn đã chọn
   - Hệ thống gửi `POST /api/enrollments/:madangky/cancel`
   - Backend xóa bản ghi và cập nhật soluongdadangky

3. **Xem Danh Sách Đã Đăng Ký**
   - Tự động hiển thị ở phía trên
   - Lấy từ `GET /api/enrollments/student/:mssv`
   - Hiển thị các môn đã đăng ký với nút hủy

---

## 📊 Dữ Liệu Ví Dụ

### Lớp Học Phần
| malophoc | tenmonhoc | sotinchi | hocphi | trangthai | soluongtoida | soluongdadangky |
|----------|-----------|----------|--------|-----------|--------------|-----------------|
| LP01     | Lập Trình C++ | 3 | 500000 | dangmo | 60 | 45 |
| LP02     | Cơ Sở Dữ Liệu | 4 | 600000 | dong | 50 | 50 |
| LP03     | Mạng Máy Tính | 3 | 500000 | dangmo | 40 | 20 |

### Đăng Ký Học Phần (Enrollment)
| madangky | mssv | malophoc | ngaydangky | trangthai |
|----------|------|----------|------------|-----------|
| DK001 | SV001 | LP01 | 2024-01-15 | hoatdong |
| DK002 | SV001 | LP03 | 2024-01-16 | hoatdong |

---

## ⚙️ Yêu Cầu Triển Khai

### Backend
- Node.js 16+ với Express
- MySQL 8.0+ với pool connection
- Các route đã được định nghĩa
- Database migration cho hocphi và trangthai (nếu chưa có)

### Frontend
- React 18+
- Axios cho HTTP requests
- React Router v6
- CSS Modules/CSS cho styling

### Environment Variables
```
VITE_API_BASE=http://localhost:5000/api
```

---

## 🔍 Validation & Constraints

### Backend Validation (Enrollment.register)
```
✅ Kiểm tra lớp phải đang mở (trangthai = 'dangmo')
✅ Kiểm tra còn chỗ trống (soluongdadangky < soluongtoida)
✅ Kiểm tra sinh viên chưa đăng ký lớp này
✅ Kiểm tra sinh viên và lớp tồn tại
```

### Frontend Validation
```
✅ Không hiển thị "Đăng Ký" nếu lớp đầy
✅ Không hiển thị "Đăng Ký" nếu đã đăng ký
✅ Xác nhận trước khi hủy đăng ký
✅ Hiển thị thông báo lỗi từ server
```

---

## 🎨 UI/UX Features

### CourseRegistration.jsx
- 📱 Responsive design (desktop, tablet, mobile)
- 🎯 Tìm kiếm nhanh theo tên/mã
- 📊 Thanh tiến trình sức chứa lớp
- 🔄 Tự động cập nhật sau mỗi hành động
- ⏱️ Loading state & error handling
- 🎨 Color coding cho danh sách đã đăng ký vs có sẵn

### AdminCourseAvailability.jsx
- 📊 Bảng chi tiết với sort/filter
- 🔄 Toggle nhanh mở/đóng đăng ký
- 📈 Thống kê tổng hợp
- 🎨 Mã màu theo trạng thái
- 📱 Responsive table layout

---

## 🚀 Các Tập Tin Được Tạo/Sửa Đổi

### Tạo Mới:
```
✅ frontend/src/pages/CourseRegistration.jsx
✅ frontend/src/pages/CourseRegistration.css
✅ frontend/src/pages/AdminCourseAvailability.jsx
✅ frontend/src/pages/AdminCourseAvailability.css
✅ frontend/src/api/enrollmentAPI.js (tạo mới hoàn chỉnh)
```

### Sửa Đổi:
```
✅ frontend/src/App.jsx (add routes & imports)
✅ frontend/src/components/Header.jsx (add nav link)
✅ frontend/src/components/RoleBasedNavigation.jsx (add admin menu)
✅ backend/models/Course.js (add getAvailableForRegistration method)
✅ backend/routes/courseRoutes.js (add available-for-registration route)
✅ frontend/src/api/adminAPI.js (add getAvailableCoursesForRegistration)
✅ frontend/src/api/classSectionAPI.js (fix API base URL)
```

---

## ✨ Tính Năng Bổ Sung

### Kế Tiếp (Optional):
- [ ] Thông báo email khi lớp hết chỗ
- [ ] Ưu tiên đăng ký theo GPA hoặc năm thứ mấy
- [ ] Xem lịch biểu chi tiết (ngày giờ)
- [ ] Download thời khóa biểu PDF
- [ ] Quản lý tiền điều kiện môn học
- [ ] Cảnh báo xung đột thời gian biểu

---

## 🧪 Testing Checklist

### Admin
- [ ] Mở trang /admin/course-availability
- [ ] Lọc theo học kỳ
- [ ] Cập nhật trạng thái lớp
- [ ] Tìm kiếm môn học
- [ ] Xem thống kê

### Student
- [ ] Truy cập /dang-ky-mon-hoc
- [ ] Xem danh sách môn có sẵn
- [ ] Lọc theo học kỳ
- [ ] Đăng ký môn học
- [ ] Hủy đăng ký
- [ ] Xem danh sách đã đăng ký

### Edge Cases
- [ ] Đăng ký khi lớp đầy
- [ ] Đăng ký môn đã đăng ký
- [ ] Admin đóng lớp khi sinh viên đang đăng ký
- [ ] Xóa lớp khi có sinh viên đang đăng ký

---

## 📞 Support & Troubleshooting

### Common Issues:
1. **API 404 Error** → Kiểm tra server.js có route `/api/class-sections` không
2. **Port mismatch** → Kiểm tra VITE_API_BASE environment variable
3. **CORS Error** → Kiểm tra express CORS configuration
4. **Token Error** → Kiểm tra token trong localStorage

---

**Status:** ✅ HOÀN THÀNH
**Date:** 27/02/2025
**Version:** 1.0
