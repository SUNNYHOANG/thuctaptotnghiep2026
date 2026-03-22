# Kế hoạch triển khai: Nhập điểm sinh viên và xét học bổng tự động

## Tổng quan

Mở rộng hệ thống hiện có (`Grade.js`, `HocBong.js`, `gradeRoutes.js`, `hocBongRoutes.js`) để hỗ trợ:
- Phân quyền nhập điểm theo lớp học phần (giảng viên vs CTSV)
- Tính GPA đúng công thức, validation điểm [0,10]
- Import điểm hàng loạt qua Excel
- Khóa/mở khóa bảng điểm
- Xét học bổng tự động theo GPA + DRL
- Duyệt/từ chối học bổng, xuất Excel

## Tasks

- [x] 1. Database migration – thêm cột thiếu vào `sinhvien_hocbong`
  - Viết migration SQL thêm `mucxeploai ENUM(...)`, `nguoiduyet`, `ngayduyet` vào bảng `sinhvien_hocbong` (dùng `ADD COLUMN IF NOT EXISTS`)
  - Tạo file `backend/scripts/migrate_scholarship_columns.js` chạy migration
  - _Requirements: 5.2, 6.1, 6.2_

- [x] 2. Mở rộng `Grade.js` – validation, GPA đúng công thức, phân quyền
  - [x] 2.1 Sửa `_tinhDiemTongKet` để validate input [0,10]; throw error nếu ngoài khoảng
    - Trả về `null` cho `gpa` khi `diemtongket` ngoài [0,10]
    - Tính `gpa = round((diemtongket / 10) * 4, 2)` thay vì gán bằng `diemtongket`
    - _Requirements: 1.2, 1.3, 1.5, 4.1, 4.3, 4.4_

  - [ ]* 2.2 Viết property test cho `_tinhDiemTongKet` và tính GPA
    - **Property 2: Tính điểm đúng công thức**
    - **Property 3: Validation điểm ngoài khoảng**
    - **Validates: Requirements 1.2, 1.3, 1.5, 4.1, 4.3, 4.4**

  - [x] 2.3 Thêm method `getByClassSectionWithAuth(malophocphan, userId, role)` vào `Grade.js`
    - Nếu `role === 'giangvien'`: query `lophocphan.magiaovien` và so sánh với `userId`; throw 403 nếu không khớp
    - Nếu `role === 'ctsv'` hoặc `admin`: cho phép truy cập mọi lớp
    - _Requirements: 1.1, 1.4, 2.1_

  - [ ]* 2.4 Viết property test cho phân quyền nhập điểm
    - **Property 1: Phân quyền nhập điểm**
    - **Validates: Requirements 1.1, 1.4, 2.1**

  - [x] 2.5 Sửa `updateGrade` để ghi log đầy đủ và kiểm tra khóa
    - Đảm bảo throw error khi `trangthai = 'dakhoa'`
    - Ghi log vào `log_suadiem` cho mọi trường thay đổi (đã có, kiểm tra lại)
    - _Requirements: 1.6, 2.2_

  - [ ]* 2.6 Viết property test cho bảng điểm khóa và ghi log
    - **Property 4: Bảng điểm khóa không thể sửa**
    - **Property 5: Ghi log khi sửa điểm**
    - **Validates: Requirements 1.6, 2.2**

  - [x] 2.7 Thêm method `unlock(malophocphan)` vào `Grade.js`
    - Update `trangthai = 'dangnhap'` cho tất cả bản ghi của lớp đó
    - _Requirements: 2.5_

  - [ ]* 2.8 Viết property test cho lock/unlock round-trip
    - **Property 7: Mở khóa bảng điểm round-trip**
    - **Validates: Requirements 2.5**

- [x] 3. Thêm import Excel vào `Grade.js`
  - [x] 3.1 Thêm method `importFromExcel(rows, userId, role)` vào `Grade.js`
    - Validate từng dòng: kiểm tra `mssv` tồn tại, `malophocphan` tồn tại, điểm trong [0,10]
    - Lưu các dòng hợp lệ bằng `createOrUpdate`; thu thập lỗi từng dòng
    - Trả về `{ total, success, errors: [{ row, mssv, message }] }`
    - _Requirements: 2.3, 2.4, 8.2, 8.3, 8.4_

  - [ ]* 3.2 Viết property test cho import Excel
    - **Property 6: Import Excel xử lý đúng**
    - **Property 13: Round-trip import Excel**
    - **Validates: Requirements 2.3, 2.4, 8.2, 8.3, 8.4, 8.5**

- [x] 4. Mở rộng `gradeRoutes.js` – thêm endpoint mới và phân quyền
  - [x] 4.1 Thêm `GET /api/grades/class/:malophocphan` với middleware kiểm tra quyền giảng viên
    - Gọi `Grade.getByClassSectionWithAuth`; trả 403 nếu không có quyền
    - _Requirements: 1.1, 1.4, 2.1_

  - [x] 4.2 Sửa `PUT /api/grades/:id` để kiểm tra quyền giảng viên trước khi update
    - Query `lophocphan.magiaovien` từ `mabangdiem`; so sánh với `x-user-id` nếu role là `giangvien`
    - _Requirements: 1.4, 2.1_

  - [x] 4.3 Thêm `POST /api/grades/import-excel` với `multer` upload + parse Excel (`xlsx`)
    - Validate định dạng file (cột bắt buộc: `mssv`, `malophocphan`, `diemcuoiky`)
    - Gọi `Grade.importFromExcel`; trả về kết quả `{ total, success, errors }`
    - _Requirements: 2.3, 2.4, 8.1, 8.2, 8.3, 8.4_

  - [x] 4.4 Thêm `POST /api/grades/unlock/:malophocphan` với `requireRole(['ctsv'])`
    - Gọi `Grade.unlock`
    - _Requirements: 2.5_

  - [x] 4.5 Sửa `GET /api/grades/student/:mssv` để lọc chỉ trả `trangthai = 'dakhoa'` khi role là `sinhvien`
    - Kiểm tra `x-user-role`; nếu là `sinhvien` thì thêm `AND b.trangthai = 'dakhoa'` vào query
    - Kiểm tra `x-user-mssv` khớp với `mssv` param; trả 403 nếu không khớp
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 4.6 Viết unit test cho các route phân quyền và lọc dữ liệu sinh viên
    - **Property 8: Cách ly dữ liệu theo người dùng**
    - **Property 9: Sinh viên không thấy điểm đang nhập**
    - **Validates: Requirements 3.1, 3.3_

- [ ] 5. Checkpoint – Đảm bảo tất cả tests backend GradeSystem pass
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có vấn đề.

- [x] 6. Tạo `Scholarship.js` model mới
  - [x] 6.1 Implement `classifyMucHocBong(gpa, drl)` theo đúng tiêu chí
    - `null/null` → `khong_du_dieu_kien`; `gpa >= 3.6 && drl >= 80` → `xuat_sac`; v.v.
    - _Requirements: 5.2, 5.4, 5.5_

  - [ ]* 6.2 Viết property test cho `classifyMucHocBong`
    - **Property 10: Phân loại học bổng đúng tiêu chí**
    - **Validates: Requirements 5.2, 5.4, 5.5**

  - [x] 6.3 Implement `evaluateSemester(mahocky)` – xét học bổng toàn bộ SV trong học kỳ
    - Query GPA học kỳ (trung bình có trọng số tín chỉ, chỉ `dakhoa`) từ `bangdiem`
    - Query DRL từ `diemrenluyen` theo `mahocky`
    - Gọi `classifyMucHocBong` cho từng SV; upsert vào `sinhvien_hocbong`
    - Trả về danh sách sắp xếp theo mức giảm dần
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.4 Viết property test cho thứ tự sắp xếp kết quả xét học bổng
    - **Property 11: Kết quả xét học bổng sắp xếp đúng thứ tự**
    - **Validates: Requirements 5.3**

  - [x] 6.5 Implement `getResults(mahocky)` – lấy kết quả đã xét, phân nhóm theo mức
    - _Requirements: 6.3_

  - [x] 6.6 Implement `approve(id, nguoiduyet, trangthai, ghichu)` – duyệt hoặc từ chối
    - Validate: `trangthai = 'tuchoi'` phải có `ghichu`; throw 400 nếu thiếu
    - Update `sinhvien_hocbong`: `trangthai`, `nguoiduyet`, `ngayduyet`, `ghichu`
    - _Requirements: 6.1, 6.2_

  - [ ]* 6.7 Viết property test cho duyệt/từ chối học bổng
    - **Property 12: Duyệt/từ chối cập nhật trạng thái đúng**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 6.8 Implement `getByStudent(mssv, mahocky)` – SV xem kết quả của mình
    - Join `sinhvien_hocbong` với `hocbong`, `hocky`; filter theo `mssv` và `mahocky`
    - Trả về `[]` nếu chưa có kết quả (không throw error)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 6.9 Implement `exportExcel(mahocky)` – xuất danh sách học bổng ra buffer Excel
    - Dùng thư viện `xlsx`; các cột: MSSV, họ tên, lớp, GPA, DRL, mức học bổng, trạng thái
    - _Requirements: 6.4_

- [x] 7. Tạo `scholarshipRoutes.js` và đăng ký vào `server.js`
  - [x] 7.1 Tạo `backend/routes/scholarshipRoutes.js` với các endpoint theo design
    - `POST /api/scholarship/evaluate/:mahocky` – `requireRole(['ctsv'])`
    - `GET /api/scholarship/results/:mahocky` – `requireRole(['ctsv'])`
    - `PUT /api/scholarship/approve/:id` – `requireRole(['ctsv'])`
    - `GET /api/scholarship/my/:mahocky` – `requireRole(['sinhvien'])`, kiểm tra `x-user-mssv`
    - `GET /api/scholarship/export/:mahocky` – `requireRole(['ctsv'])`, trả về file Excel
    - _Requirements: 5.1, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

  - [x] 7.2 Đăng ký route trong `server.js`: `app.use('/api/scholarship', scholarshipRoutes)`
    - _Requirements: 5.1_

- [ ] 8. Checkpoint – Đảm bảo tất cả tests backend ScholarshipEngine pass
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có vấn đề.

- [x] 9. Mở rộng `api.js` frontend – thêm `gradeAPI` và `scholarshipAPI`
  - Thêm `gradeAPI` object với các method: `getByClass`, `update`, `importExcel` (multipart), `lock`, `unlock`
  - Thêm `scholarshipAPI` object với các method: `evaluate`, `getResults`, `approve`, `getMy`, `exportExcel` (blob)
  - _Requirements: 1.1, 2.3, 5.1, 6.1, 7.1_

- [x] 10. Cập nhật `TeacherGrades.jsx` – phân quyền và import Excel
  - [x] 10.1 Sửa fetch lớp học phần: giảng viên chỉ thấy lớp mình phụ trách (dùng `gradeAPI.getByClass`)
    - Hiển thị badge trạng thái `dangnhap` / `dakhoa` trên bảng điểm
    - _Requirements: 1.1_

  - [x] 10.2 Thêm chức năng import Excel vào `TeacherGrades.jsx` (chỉ hiện với role `ctsv`)
    - Upload file → preview response `{ total, success, errors }` → hiển thị báo cáo lỗi từng dòng
    - _Requirements: 2.3, 8.1, 8.2_

  - [x] 10.3 Thêm nút "Mở khóa" (chỉ hiện với role `ctsv`) gọi `gradeAPI.unlock`
    - _Requirements: 2.5_

- [x] 11. Cập nhật `StudentGrades.jsx` – chỉ hiển thị điểm đã khóa
  - Sửa API call sang `gradeAPI.getByClass` hoặc endpoint student; đảm bảo chỉ hiển thị `dakhoa`
  - Hiển thị đầy đủ: tên môn, số tín chỉ, chuyên cần, giữa kỳ, cuối kỳ, tổng kết, GPA, xếp loại
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 12. Tạo `ScholarshipEvaluator.jsx` – CTSV xét và duyệt học bổng
  - Dropdown chọn học kỳ → nút "Xét học bổng" gọi `scholarshipAPI.evaluate`
  - Hiển thị bảng kết quả phân nhóm theo mức (Xuất sắc → Không đủ điều kiện)
  - Nút duyệt/từ chối từng sinh viên (modal nhập lý do khi từ chối)
  - Nút "Xuất Excel" gọi `scholarshipAPI.exportExcel` và trigger download
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_

- [x] 13. Cập nhật `HocBong.jsx` – hiển thị mức xếp loại và lý do từ chối
  - Thêm cột `mucxeploai` vào bảng lịch sử học bổng với badge màu theo mức
  - Hiển thị lý do từ chối (`ghichu`) khi `trangthai = 'tuchoi'`
  - Dùng `scholarshipAPI.getMy` để lấy kết quả học bổng của sinh viên
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 14. Checkpoint cuối – Đảm bảo tất cả tests pass và tính năng hoạt động end-to-end
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có vấn đề.

## Ghi chú

- Tasks đánh dấu `*` là optional, có thể bỏ qua để ra MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để truy vết
- Thư viện cần cài thêm: `fast-check` (PBT), `xlsx` (đã có hoặc cần thêm), `multer` (upload)
- Property tests đặt trong `backend/tests/grade-scholarship.pbt.test.js`
