# Danh Sách Nhiệm Vụ

## Feature: student-reminder-and-drl-navigation

---

## Phase 1: Database Migration

- [x] 1.1 Viết migration SQL mở rộng ENUM loai của bảng thongbao (thêm nhacnho_drl, nhacnho_hoso)
- [x] 1.2 Viết migration SQL thêm cột nguoi_nhan JSON vào bảng thongbao
- [x] 1.3 Cập nhật model ThongBao.js để nhận và lưu trường nguoi_nhan

---

## Phase 2: Backend – API Nhắc Nhở

- [x] 2.1 Thêm route GET /api/drl-self/students-by-status vào drlSelfRoutes.js
  - Hỗ trợ trangthai: chua_nop, choduyet, chokhoaduyet, bituchoi, daduyet
  - Phân quyền: admin, ctsv, giangvien, khoa
  - Giới hạn theo makhoa cho role giangvien và khoa
- [x] 2.2 Thêm route GET /api/users/students/incomplete-profile vào userRoutes.js
  - Lọc SV thiếu: hoten, ngaysinh, gioitinh, malop, makhoa
  - Phân quyền: admin, ctsv
- [x] 2.3 Thêm route POST /api/thongbao/reminder vào thongBaoRoutes.js
  - Validate tiêu đề (không rỗng, tối đa 255 ký tự)
  - Lưu mssv_list vào nguoi_nhan dạng JSON
  - Phân quyền: admin, ctsv, giangvien
- [x] 2.4 Thêm route GET /api/thongbao/reminder-history vào thongBaoRoutes.js
  - Lọc theo loai nhacnho_drl hoặc nhacnho_hoso
  - Phân quyền: admin, ctsv, giangvien
- [x] 2.5 Cập nhật ThongBao.getForStudent() để trả về thông báo nhacnho_drl/nhacnho_hoso khi MSSV sinh viên nằm trong nguoi_nhan

---

## Phase 3: Frontend – Component Dùng Chung

- [x] 3.1 Tạo component DrlNavigationButton (frontend/src/components/DrlNavigationButton.jsx)
  - Mapping role → URL đích với ?mssv=
  - Hiển thị tooltip khi hover
  - Ẩn hoàn toàn nếu role không hợp lệ
  - Vô hiệu hóa nếu mssv null/rỗng
- [x] 3.2 Tạo hook useUrlMssv (frontend/src/utils/useUrlMssv.js)
  - Đọc ?mssv= từ useSearchParams
  - Cung cấp setter đồng bộ URL

---

## Phase 4: Frontend – Tích Hợp Điều Hướng DRL

- [x] 4.1 Thêm DrlNavigationButton vào AdminUsers (tab sinh viên)
  - Thêm cột "Hành động" vào bảng danh sách sinh viên
- [x] 4.2 Thêm DrlNavigationButton vào KhoaStudentList
  - Thêm cột "Hành động" vào bảng danh sách sinh viên
- [x] 4.3 Thêm DrlNavigationButton vào TeacherClassStudents
  - Thêm cột "Hành động" vào bảng danh sách sinh viên
- [x] 4.4 Tích hợp useUrlMssv vào CTSVDrlManager
  - Khởi tạo filterMssv từ URL param
  - Tự động gọi loadData khi có mssv từ URL
  - Hiển thị thông báo khi không tìm thấy phiếu
- [x] 4.5 Tích hợp useUrlMssv vào DrlClassReview
  - Thêm ô tìm kiếm MSSV, đồng bộ với URL
  - Tự động load khi có mssv từ URL
- [x] 4.6 Tích hợp useUrlMssv vào KhoaDrlReview
  - Thêm ô tìm kiếm MSSV, đồng bộ với URL
  - Tự động load khi có mssv từ URL

---

## Phase 5: Frontend – Nâng Cấp CTSVNhacNho

- [x] 5.1 Thêm FilterPanel vào CTSVNhacNho (HocKy, TrangThai DRL, Khoa, Lớp)
- [x] 5.2 Thêm nút "Xem trước" gọi API students-by-status và hiển thị PreviewTable
  - Hiển thị cảnh báo và vô hiệu hóa nút gửi khi danh sách rỗng
- [x] 5.3 Thêm chọn mẫu nhắc nhở nhanh (nhắc nộp DRL, nhắc hoàn thiện hồ sơ)
- [x] 5.4 Cập nhật form gửi để gọi POST /api/thongbao/reminder với mssv_list
  - Hiển thị xác nhận với số lượng người nhận sau khi gửi
- [x] 5.5 Thêm HistoryTable hiển thị lịch sử nhắc nhở (gọi GET /api/thongbao/reminder-history)

---

## Phase 6: Kiểm Thử

- [x] 6.1 Viết unit tests cho route GET /api/drl-self/students-by-status
  - Test trangthai=chua_nop trả về đúng danh sách
  - Test phân quyền 403 cho role không hợp lệ
- [x] 6.2 Viết unit tests cho route POST /api/thongbao/reminder
  - Test tiêu đề rỗng trả về 400
  - Test tiêu đề > 255 ký tự trả về 400
  - Test role sinhvien trả về 403
- [x] 6.3 Viết unit tests cho DrlNavigationButton
  - Test URL đúng cho từng role
  - Test ẩn nút khi role không hợp lệ
  - Test disabled khi mssv rỗng
- [x] 6.4 Viết unit tests cho useUrlMssv
  - Test đọc đúng giá trị từ URL
  - Test cập nhật URL khi set
- [x] 6.5 Viết property-based test cho Property 1: Danh sách chua_nop disjoint với đã nộp
  - Sử dụng fast-check, tối thiểu 100 iterations
  - Tag: Feature: student-reminder-and-drl-navigation, Property 1
- [x] 6.6 Viết property-based test cho Property 2: Lọc trangthai trả về đúng trạng thái
  - Sử dụng fast-check, tối thiểu 100 iterations
  - Tag: Feature: student-reminder-and-drl-navigation, Property 2
- [x] 6.7 Viết property-based test cho Property 3: GV/Khoa chỉ thấy SV khoa mình
  - Sử dụng fast-check, tối thiểu 100 iterations
  - Tag: Feature: student-reminder-and-drl-navigation, Property 3
- [x] 6.8 Viết property-based test cho Property 4+5: Tiêu đề không hợp lệ bị từ chối 400
  - Sinh chuỗi whitespace-only và chuỗi > 255 ký tự
  - Sử dụng fast-check, tối thiểu 100 iterations
  - Tag: Feature: student-reminder-and-drl-navigation, Property 4
- [x] 6.9 Viết property-based test cho Property 6: Role không hợp lệ bị từ chối 403
  - Sử dụng fast-check, tối thiểu 100 iterations
  - Tag: Feature: student-reminder-and-drl-navigation, Property 6
- [x] 6.10 Viết property-based test cho Property 7: SV trong nguoi_nhan thấy thông báo
  - Sử dụng fast-check, tối thiểu 100 iterations
  - Tag: Feature: student-reminder-and-drl-navigation, Property 7
- [x] 6.11 Viết property-based test cho Property 8: URL điều hướng đúng theo role
  - Sử dụng fast-check, tối thiểu 100 iterations
  - Tag: Feature: student-reminder-and-drl-navigation, Property 8
- [x] 6.12 Viết property-based test cho Property 9: Trang DRL đọc/đồng bộ mssv từ URL
  - Sử dụng fast-check, tối thiểu 100 iterations
  - Tag: Feature: student-reminder-and-drl-navigation, Property 9
- [x] 6.13 Viết property-based test cho Property 10: SV thiếu hồ sơ có trường null/rỗng
  - Sử dụng fast-check, tối thiểu 100 iterations
  - Tag: Feature: student-reminder-and-drl-navigation, Property 10
