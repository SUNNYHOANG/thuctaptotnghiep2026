# Hệ Thống Quản Lý Công Tác Sinh Viên và Điểm Rèn Luyện

Hệ thống quản lý hoạt động sinh viên và tính điểm rèn luyện được xây dựng bằng React (Frontend) và Node.js/Express (Backend).

## Công Nghệ Sử Dụng

### Backend
- Node.js
- Express.js
- MySQL
- MySQL2

### Frontend
- React 18
- React Router DOM
- Axios
- Vite
- CSS3

## Cấu Trúc Dự Án

```
.
├── backend/                 # Backend API
│   ├── config/             # Cấu hình database
│   ├── models/             # Models cho database
│   ├── routes/             # API routes
│   ├── database/          # SQL schema
│   ├── server.js           # Entry point
│   └── package.json
│
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Các trang
│   │   ├── api/            # API client
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   └── package.json
│
└── README.md
```

## Cài Đặt và Chạy

### Backend

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example` và cấu hình:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dkhp1
JWT_SECRET=your-secret-key-here
```

4. Chạy SQL schema để tạo các bảng:
```bash
mysql -u root -p dkhp1 < database/schema.sql
```

5. Chạy server:
```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5000`

### Frontend

1. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy development server:
```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

Tính Năng

 1. Quản Lý Hoạt Động
- Xem danh sách hoạt động
- Lọc hoạt động theo loại và trạng thái
- Xem chi tiết hoạt động
- Đăng ký tham gia hoạt động

 2. Quản Lý Hoạt Động Của Sinh Viên
- Xem danh sách hoạt động đã đăng ký
- Theo dõi trạng thái đăng ký (Chờ duyệt, Được duyệt, Từ chối, Hoàn thành)
- Hủy đăng ký (nếu chưa được duyệt)

 3. Điểm Rèn Luyện
- Tính điểm rèn luyện tự động
- Xem điểm rèn luyện theo học kỳ
- Xem chi tiết điểm từng tiêu chí
- Xếp loại điểm rèn luyện (Xuất sắc, Tốt, Khá, Trung bình, Yếu, Chưa đạt)

API Endpoints

### Activities
- `GET /api/activities` - Lấy danh sách hoạt động
- `GET /api/activities/:id` - Lấy chi tiết hoạt động
- `GET /api/activities/types` - Lấy danh sách loại hoạt động
- `POST /api/activities` - Tạo hoạt động mới
- `PUT /api/activities/:id` - Cập nhật hoạt động
- `DELETE /api/activities/:id` - Xóa hoạt động

### Student Activities
- `POST /api/student-activities/register` - Đăng ký tham gia hoạt động
- `GET /api/student-activities/student/:mssv` - Lấy hoạt động của sinh viên
- `GET /api/student-activities/activity/:mahoatdong` - Lấy danh sách sinh viên tham gia
- `POST /api/student-activities/:id/approve` - Duyệt đăng ký
- `POST /api/student-activities/:id/reject` - Từ chối đăng ký
- `POST /api/student-activities/:id/complete` - Đánh dấu hoàn thành
- `DELETE /api/student-activities/:id` - Hủy đăng ký

### Scores
- `POST /api/scores/calculate` - Tính điểm rèn luyện
- `GET /api/scores/student/:mssv` - Lấy điểm của sinh viên
- `GET /api/scores/student/:mssv/semester/:mahocky` - Lấy điểm theo học kỳ
- `GET /api/scores/semester/:mahocky` - Lấy điểm theo học kỳ (tất cả sinh viên)
- `PUT /api/scores/update` - Cập nhật điểm thủ công

## 📊 Quản Lý Điểm Sinh Viên (Mới)

Hệ thống quản lý điểm toàn diện cho sinh viên và giảng viên:

### Tính Năng Chính
✅ **Sinh Viên**:
- Xem bảng điểm với 5 loại điểm (Chuyên cần, Giữa kỳ, Cuối kỳ, Tổng kết, GPA)
- Lọc theo học kỳ
- Xem GPA, xếp loại học lực
- Cảnh báo học vụ (GPA < 2.0, < 2.4)

✅ **Giảng Viên**:
- Tạo bảng điểm từ danh sách sinh viên đăng ký
- Nhập điểm trực tiếp trong bảng
- Sửa điểm với tự động ghi nhật ký thay đổi
- Xem lịch sử sửa điểm (ai, lúc nào, thay đổi gì)
- Khóa/mở khóa bảng điểm
- Xuất bảng điểm ra Excel/CSV

✅ **Hệ Thống**:
- Tự động tính Điểm Tổng Kết = Chuyên cần×10% + Giữa kỳ×30% + Cuối kỳ×60%
- Tự động tính GPA (thang 0-4)
- Tự động xếp loại: Xuất sắc/Tốt/Khá/Trung bình/Yếu/Kém
- Ghi log tất cả thay đổi để kiểm toán

### Hướng Dẫn Sử Dụng
📖 **[Tài Liệu Chi Tiết](HUONG_DAN_QUAN_LY_DIEM.md)** - Hướng dẫn đầy đủ cho sinh viên và giảng viên

### API Endpoints
```
GET    /api/grades/student/:mssv           - Xem điểm cá nhân
GET    /api/grades/class/:malophocphan     - Xem bảng điểm lớp
POST   /api/grades/init/:malophocphan      - Tạo bảng điểm
POST   /api/grades                         - Nhập/cập nhật điểm
PUT    /api/grades/:mabangdiem             - Sửa điểm (tạo log)
POST   /api/grades/lock/:malophocphan      - Khóa điểm
POST   /api/grades/unlock/:malophocphan    - Mở khóa
GET    /api/grades/export/:malophocphan    - Xuất CSV
GET    /api/grades/:mabangdiem/log         - Xem lịch sử sửa
GET    /api/grades/stats/:mahocky          - Thống kê
```

---

## Database Schema

### Các bảng chính (Backend Node.js):
- `bangdiem` - Bảng điểm chi tiết (Chuyên cần, Giữa kỳ, Cuối kỳ, TK, GPA, xếp loại)
- `log_suadiem` - Nhật ký thay đổi điểm
- `lophocphan` - Lớp học phần (liên kết giảng viên, môn học, học kỳ)
- `sinhvien` - Sinh viên
- `monhoc` - Môn học
- `hocky` - Học kỳ

### Các bảng từ Laravel:
- `users` - Tài khoản (admin, giảng viên)
- `sinhvien` - Thông tin sinh viên
- `giangvien` - Thông tin giảng viên

## Ghi Chú

- Đảm bảo MySQL đang chạy và database `dkhp1` đã được tạo
- Chạy `setup-complete.sql` để tạo tất cả các bảng và dữ liệu mẫu
- Cần có bảng `users` với các tài khoản: admin, giảng viên, sinh viên
- Tính năng phúc khảo và import Excel sẽ được thêm trong phiên bản tiếp theo
- Trong môi trường production, cần thêm validation và authorization hoàn chỉnh

## Phát Triển Thêm

- [ ] ✅ Quản lý điểm sinh viên (Basic)
- [ ] Import Excel bảng điểm
- [ ] Modal xem chi tiết lịch sử sửa
- [ ] Tích hợp phúc khảo
- [ ] Dashboard thống kê điểm
- [ ] PDF export báo cáo
- [ ] Thông báo real-time khi sửa điểm
- [ ] Batch upload điểm từ file
