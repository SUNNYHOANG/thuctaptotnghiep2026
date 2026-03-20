# Tasks: khoa-role-permission

## Task 1: Database Migration

- [x] 1.1 Tạo file `backend/database/06_khoa_role.sql` với các ALTER TABLE:
  - Thêm cột `makhoa VARCHAR(50) DEFAULT NULL` vào bảng `users`
  - Mở rộng ENUM `role` trong bảng `users` để chấp nhận `'khoa'`
  - Thêm các cột `diem_khoa`, `nhan_xet_khoa`, `nguoi_duyet_khoa`, `ngay_duyet_khoa` vào bảng `drl_tudanhgia`
  - Mở rộng ENUM `trangthai` trong bảng `drl_tudanhgia` để chấp nhận `'chokhoaduyet'`

## Task 2: Backend - Auth và Middleware

- [x] 2.1 Cập nhật `backend/routes/authRoutes.js`:
  - Thêm `makhoa` vào SELECT trong `selectStaffByUsernameAndPassword`, `selectStaffByUsernameForFaceLogin`, `selectStaffById`
  - Endpoint `/api/auth/me` trả về `makhoa` trong response
- [x] 2.2 Cập nhật `backend/middleware/requireRole.js`:
  - Expose `req.user.makhoa` từ header hoặc token parse
  - Đảm bảo `'khoa'` được chấp nhận là giá trị role hợp lệ

## Task 3: Backend - User Routes

- [x] 3.1 Cập nhật `GET /api/users` để trả về `makhoa` trong danh sách, hỗ trợ filter `role=khoa`
- [x] 3.2 Cập nhật `POST /api/users` để validate `makhoa` bắt buộc khi `role='khoa'`, trả về HTTP 400 nếu thiếu
- [x] 3.3 Cập nhật `PUT /api/users/:id` để hỗ trợ cập nhật `makhoa`, validate `makhoa` tồn tại trong bảng `sinhvien`
- [x] 3.4 Cập nhật `GET /api/users/students/all` để filter theo `makhoa` của user khi `role='khoa'`
- [x] 3.5 Cập nhật `GET /api/users/students/profile/:mssv` để kiểm tra `makhoa` và trả về HTTP 403 nếu Khoa_Manager xem sinh viên khoa khác

## Task 4: Backend - DRL Routes và Model

- [x] 4.1 Cập nhật `SelfEvaluation.reviewByRole` trong `backend/models/SelfEvaluation.js`:
  - Thêm case `role === 'khoa'`: cập nhật `diem_khoa`, `nhan_xet_khoa`, `nguoi_duyet_khoa`, `ngay_duyet_khoa`
  - Khi GV duyệt: chuyển `trangthai` sang `'chokhoaduyet'` thay vì `'daduyet'`
- [x] 4.2 Cập nhật `SelfEvaluation.getPendingByClassAndSemester` để JOIN với bảng `sinhvien` lấy `makhoa`, hỗ trợ filter theo `makhoa`
- [x] 4.3 Cập nhật `GET /class/:malop/semester/:mahocky` trong `drlSelfRoutes.js`:
  - Thêm `'khoa'` vào `requireRole`
  - Thêm filter logic cho role `khoa`: chỉ trả về `trangthai='chokhoaduyet'` và `makhoa` khớp
  - Cập nhật filter CTSV: thêm điều kiện `nguoi_duyet_khoa IS NOT NULL` (với tương thích ngược cho phiếu cũ)
- [x] 4.4 Cập nhật `PUT /:id/review` trong `drlSelfRoutes.js`:
  - Thêm `'khoa'` vào `requireRole`
  - Thêm kiểm tra `makhoa` của phiếu vs `makhoa` của Khoa_Manager, trả về HTTP 403 nếu không khớp
  - Kiểm tra thứ tự workflow: CTSV không được duyệt phiếu chưa qua bước khoa (trừ phiếu cũ tương thích ngược)
- [x] 4.5 Thêm logging hành động duyệt/từ chối của Khoa_Manager (console.log hoặc bảng log riêng)

## Task 5: Frontend - Cập Nhật AdminUsers

- [x] 5.1 Thêm `'khoa'` vào dropdown vai trò trong form tạo/sửa tài khoản
- [x] 5.2 Hiển thị field `makhoa` bắt buộc khi chọn role `'khoa'` trong form
- [x] 5.3 Thêm `'khoa'` vào dropdown filter vai trò
- [x] 5.4 Hiển thị cột `makhoa` trong bảng danh sách khi filter role='khoa'

## Task 6: Frontend - Cập Nhật DrlSelfEvaluation

- [x] 6.1 Cập nhật hàm `statusLabel` để xử lý `'chokhoaduyet'` → hiển thị `'Chờ Khoa duyệt'`
- [x] 6.2 Cập nhật điều kiện `isLocked` và `canEdit` để xử lý trạng thái `'chokhoaduyet'`
- [x] 6.3 Hiển thị `diem_khoa` và `nhan_xet_khoa` trong phần thông tin phiếu khi có
- [x] 6.4 Cập nhật `statusLabel` cho trường hợp `trangthai='daduyet'` và `nguoi_duyet_khoa IS NOT NULL` và `nguoi_duyet_ctsv IS NULL` → `'Chờ Phòng CTSV duyệt cuối'`
- [x] 6.5 Hiển thị thông báo `'Bị Khoa từ chối'` kèm `nhan_xet_khoa` khi `trangthai='bituchoi'` và `nguoi_duyet_khoa IS NOT NULL`

## Task 7: Frontend - Cập Nhật DrlClassReview

- [x] 7.1 Cập nhật `statusLabel`: sau khi GV duyệt (`trangthai='chokhoaduyet'`) → hiển thị `'Chờ Khoa duyệt'`
- [x] 7.2 Thêm cột `Điểm Khoa` trong bảng danh sách phiếu khi `user.role === 'ctsv'` hoặc `'admin'`
- [x] 7.3 Hiển thị `diem_khoa` và `nhan_xet_khoa` trong form chi tiết phiếu khi CTSV xem

## Task 8: Frontend - Tạo KhoaDashboard

- [x] 8.1 Tạo file `frontend/src/pages/KhoaDashboard.jsx`:
  - Hiển thị tên khoa và `makhoa` của tài khoản đang đăng nhập
  - Hiển thị số phiếu DRL đang chờ duyệt (`trangthai='chokhoaduyet'`) của khoa
  - Links điều hướng tới `/khoa/students` và `/khoa/drl-review`

## Task 9: Frontend - Tạo KhoaDrlReview

- [x] 9.1 Tạo file `frontend/src/pages/KhoaDrlReview.jsx`:
  - Bộ lọc chọn học kỳ và lớp (chỉ lớp thuộc khoa)
  - Danh sách phiếu `trangthai='chokhoaduyet'` thuộc khoa
  - Chi tiết phiếu: thông tin SV, điểm từng mục, nhận xét SV, điểm và nhận xét CVHT
  - Form duyệt: trạng thái (duyệt/từ chối), `diem_khoa` (0-100), `nhan_xet_khoa`
  - Submit gọi `PUT /api/drl-self/:id/review`

## Task 10: Frontend - Tạo KhoaStudentList

- [x] 10.1 Tạo file `frontend/src/pages/KhoaStudentList.jsx`:
  - Danh sách sinh viên thuộc khoa (gọi `GET /api/users/students/all`)
  - Hiển thị cột: MSSV, họ tên, lớp, tình trạng học tập
  - Tìm kiếm theo MSSV hoặc họ tên
  - Click vào sinh viên → xem hồ sơ chi tiết (chỉ đọc)

## Task 11: Frontend - Routing và Navigation

- [x] 11.1 Thêm routes mới vào `frontend/src/App.jsx`:
  - `/khoa/dashboard` → `KhoaDashboard` (requiredRole="khoa")
  - `/khoa/drl-review` → `KhoaDrlReview` (requiredRole="khoa")
  - `/khoa/students` → `KhoaStudentList` (requiredRole="khoa")
- [x] 11.2 Cập nhật logic redirect sau đăng nhập (Home.jsx hoặc AuthContext) để role `'khoa'` → `/khoa/dashboard`
- [x] 11.3 Cập nhật `ProtectedRoute` hoặc `AppShell` để xử lý role `'khoa'` trong navigation menu

## Task 12: Kiểm Thử

- [x] 12.1 Viết unit tests cho `SelfEvaluation.reviewByRole` case 'khoa'
- [x] 12.2 Viết unit tests cho `userRoutes` POST với role='khoa' thiếu makhoa
- [x] 12.3 Viết unit tests cho `drlSelfRoutes` filter theo role
- [x] 12.4 Viết property-based tests (fast-check) cho Property 1: tài khoản khoa phải có makhoa
- [x] 12.5 Viết property-based tests cho Property 8: Khoa_Manager chỉ thấy sinh viên của khoa mình
- [x] 12.6 Viết property-based tests cho Property 11: GV duyệt chuyển trangthai sang chokhoaduyet
- [x] 12.7 Viết property-based tests cho Property 12: mỗi role thấy đúng tập phiếu DRL
- [x] 12.8 Viết property-based tests cho Property 14: Khoa_Manager bị 403 khi duyệt phiếu khoa khác
- [x] 12.9 Viết property-based tests cho Property 19: tương thích ngược với phiếu DRL cũ

## Task 13: Điểm Tổng Chính Thức Khi CTSV Chốt

- [x] 13.1 Cập nhật `backend/routes/drlSelfRoutes.js`: khi CTSV duyệt cuối, ghi `diem_ctsv` vào bảng `diemrenluyen` (Score) thay vì tính lại từ các thành phần
- [x] 13.2 Cập nhật `frontend/src/pages/Score.jsx`: thêm cột "Ghi chú" hiển thị `ghichu` từ bảng điểm rèn luyện
- [x] 13.3 Cập nhật `frontend/src/pages/DrlSelfEvaluation.jsx`: khi `trangthai='daduyet'` và `nguoi_duyet_ctsv != null`, hiển thị `diem_ctsv` là điểm tổng chính thức thay vì điểm tự tính
