# Tài Liệu Yêu Cầu

## Giới Thiệu

Tài liệu này mô tả yêu cầu cho hai tính năng mới trong hệ thống quản lý sinh viên:

1. **Hệ thống nhắc nhở sinh viên chưa hoàn thiện hồ sơ/điểm rèn luyện**: Cho phép admin, CTSV và giảng viên gửi thông báo nhắc nhở có mục tiêu đến sinh viên chưa nộp phiếu tự đánh giá DRL, chưa hoàn thiện hồ sơ, hoặc đang ở trạng thái chờ xử lý trong quy trình duyệt DRL.

2. **Điều hướng từ trang quản lý sinh viên sang trang quản lý DRL**: Khi admin, CTSV, giảng viên hoặc quản lý khoa bấm nút "Xem điểm" trên trang danh sách sinh viên, hệ thống điều hướng trực tiếp đến trang quản lý điểm rèn luyện tương ứng với sinh viên đó.

Hệ thống hiện có:
- Backend Node.js (Express) với module `ThongBao` (loại: `truong`, `lop`, `nhacnho`, `lichthi`, `deadline_hocphi`, `khac`)
- Module DRL với bảng `drl_tudanhgia`, trạng thái: `choduyet` → `chokhoaduyet` → `daduyet` (có thể `bituchoi`)
- Phân quyền: `admin`, `giangvien`, `ctsv`, `khoa`, `sinhvien`
- Trang `CTSVNhacNho` hiện chỉ gửi thông báo thủ công, không lọc theo trạng thái DRL

---

## Bảng Thuật Ngữ

- **He_Thong**: Hệ thống quản lý sinh viên (backend Node.js + frontend React)
- **ThongBao_Module**: Module thông báo hiện có, quản lý bảng `thongbao` với các loại thông báo
- **DRL_Module**: Module điểm rèn luyện, quản lý bảng `drl_tudanhgia` và quy trình duyệt
- **Phieu_TuDanhGia**: Bản ghi trong bảng `drl_tudanhgia` đại diện cho phiếu tự đánh giá DRL của một sinh viên trong một học kỳ
- **NguoiGui**: Người dùng có quyền gửi nhắc nhở (admin, ctsv, giangvien)
- **SinhVien**: Người dùng có role `sinhvien`, có mã số sinh viên (MSSV)
- **NguoiXemDiem**: Người dùng có quyền xem và điều hướng đến trang DRL (admin, ctsv, giangvien, khoa)
- **Trang_QuanLySinhVien**: Các trang liệt kê sinh viên: `AdminUsers` (tab sinh viên), `KhoaStudentList`, `TeacherClassStudents`
- **Trang_QuanLyDRL**: Các trang quản lý DRL tương ứng theo role: `CTSVDrlManager` (/ctsv/quan-ly-diem-ren-luyen), `DrlClassReview` (/giangvien/diem-ren-luyen-tu-danh-gia hoặc /ctsv/diem-ren-luyen-tu-danh-gia), `KhoaDrlReview` (/khoa/drl-review)
- **TrangThai_DRL**: Trạng thái của Phieu_TuDanhGia: `choduyet`, `chokhoaduyet`, `daduyet`, `bituchoi`
- **HocKy**: Học kỳ, xác định bởi `mahocky`
- **Loai_NhacNho**: Loại thông báo nhắc nhở trong bảng `thongbao`: `nhacnho_drl`, `nhacnho_hoso`

---

## Yêu Cầu

### Yêu Cầu 1: Gửi Nhắc Nhở Theo Trạng Thái DRL

**User Story:** Là CTSV hoặc admin, tôi muốn gửi thông báo nhắc nhở đến các sinh viên chưa nộp phiếu tự đánh giá DRL trong một học kỳ cụ thể, để đảm bảo tất cả sinh viên hoàn thành đúng hạn.

#### Tiêu Chí Chấp Nhận

1. WHEN NguoiGui yêu cầu danh sách sinh viên chưa nộp Phieu_TuDanhGia trong một HocKy, THE He_Thong SHALL trả về danh sách MSSV của các SinhVien chưa có bản ghi trong bảng `drl_tudanhgia` cho HocKy đó.

2. WHEN NguoiGui gửi yêu cầu nhắc nhở với danh sách MSSV mục tiêu, tiêu đề, nội dung và mahocky, THE ThongBao_Module SHALL tạo một bản ghi thông báo với loại `nhacnho_drl` và lưu danh sách MSSV mục tiêu vào trường `nguoi_nhan`.

3. WHEN NguoiGui gửi nhắc nhở mà không chỉ định danh sách MSSV cụ thể, THE He_Thong SHALL gửi thông báo đến tất cả SinhVien trong phạm vi (toàn trường hoặc theo lớp/khoa được chỉ định).

4. IF NguoiGui không có role `admin`, `ctsv`, hoặc `giangvien`, THEN THE He_Thong SHALL trả về lỗi HTTP 403 với thông báo "Bạn không có quyền gửi nhắc nhở".

5. IF tiêu đề thông báo nhắc nhở rỗng hoặc vượt quá 255 ký tự, THEN THE He_Thong SHALL trả về lỗi HTTP 400 với thông báo mô tả lỗi cụ thể.

6. WHEN SinhVien truy cập trang thông báo, THE ThongBao_Module SHALL hiển thị các thông báo có loại `nhacnho_drl` dành cho SinhVien đó cùng với các thông báo loại `truong` và `lop`.

---

### Yêu Cầu 2: Lọc Sinh Viên Theo Trạng Thái DRL Để Nhắc Nhở

**User Story:** Là CTSV hoặc giảng viên, tôi muốn lọc sinh viên theo trạng thái DRL (chưa nộp, đang chờ duyệt, bị từ chối) để gửi nhắc nhở đúng đối tượng, tránh gửi nhầm cho sinh viên đã hoàn thành.

#### Tiêu Chí Chấp Nhận

1. WHEN NguoiGui yêu cầu danh sách sinh viên theo trạng thái DRL với tham số `mahocky` và `trangthai`, THE DRL_Module SHALL trả về danh sách SinhVien có Phieu_TuDanhGia khớp với trạng thái được chỉ định.

2. WHEN NguoiGui yêu cầu danh sách sinh viên với `trangthai = 'chua_nop'`, THE DRL_Module SHALL trả về danh sách SinhVien chưa có bản ghi `drl_tudanhgia` nào cho HocKy đó.

3. WHILE NguoiGui có role `giangvien` hoặc `khoa`, THE He_Thong SHALL chỉ trả về danh sách SinhVien thuộc khoa (`makhoa`) của NguoiGui đó.

4. WHILE NguoiGui có role `ctsv` hoặc `admin`, THE He_Thong SHALL trả về danh sách SinhVien của toàn trường hoặc theo bộ lọc khoa/lớp được chỉ định.

5. THE He_Thong SHALL hỗ trợ các giá trị `trangthai` lọc sau: `chua_nop`, `choduyet`, `chokhoaduyet`, `bituchoi`, `daduyet`.

---

### Yêu Cầu 3: Giao Diện Gửi Nhắc Nhở Nâng Cao

**User Story:** Là CTSV, tôi muốn có giao diện cho phép xem trước danh sách sinh viên sẽ nhận nhắc nhở trước khi gửi, để tránh gửi nhầm và kiểm soát được phạm vi thông báo.

#### Tiêu Chí Chấp Nhận

1. WHEN NguoiGui chọn bộ lọc (HocKy, trạng thái DRL, khoa, lớp) trên trang nhắc nhở, THE He_Thong SHALL hiển thị danh sách SinhVien sẽ nhận thông báo trước khi NguoiGui xác nhận gửi.

2. WHEN NguoiGui xác nhận gửi nhắc nhở, THE He_Thong SHALL tạo thông báo và hiển thị thông báo xác nhận với số lượng SinhVien đã nhận.

3. IF danh sách SinhVien mục tiêu rỗng (không có sinh viên nào khớp bộ lọc), THEN THE He_Thong SHALL hiển thị thông báo "Không có sinh viên nào phù hợp với bộ lọc đã chọn" và vô hiệu hóa nút gửi.

4. WHEN NguoiGui nhập nội dung nhắc nhở, THE He_Thong SHALL cho phép chọn mẫu nhắc nhở có sẵn (nhắc nộp DRL, nhắc hoàn thiện hồ sơ) để điền nhanh tiêu đề và nội dung.

5. THE He_Thong SHALL hiển thị lịch sử các lần nhắc nhở đã gửi, bao gồm thời gian gửi, số lượng người nhận và người gửi.

---

### Yêu Cầu 4: Điều Hướng Từ Trang Quản Lý Sinh Viên Sang Trang DRL

**User Story:** Là admin hoặc CTSV, khi tôi đang xem danh sách sinh viên, tôi muốn bấm một nút để chuyển thẳng sang trang quản lý DRL được lọc theo sinh viên đó, để tiết kiệm thời gian tra cứu thủ công.

#### Tiêu Chí Chấp Nhận

1. WHEN NguoiXemDiem bấm nút "Xem điểm DRL" trên một hàng sinh viên trong Trang_QuanLySinhVien, THE He_Thong SHALL điều hướng đến Trang_QuanLyDRL tương ứng với role của NguoiXemDiem.

2. WHEN He_Thong điều hướng đến Trang_QuanLyDRL, THE He_Thong SHALL truyền MSSV của SinhVien được chọn qua URL query parameter `?mssv={mssv}` để trang DRL tự động lọc theo sinh viên đó.

3. WHILE NguoiXemDiem có role `admin` hoặc `ctsv`, THE He_Thong SHALL điều hướng đến `/ctsv/quan-ly-diem-ren-luyen?mssv={mssv}`.

4. WHILE NguoiXemDiem có role `giangvien`, THE He_Thong SHALL điều hướng đến `/giangvien/diem-ren-luyen-tu-danh-gia?mssv={mssv}`.

5. WHILE NguoiXemDiem có role `khoa`, THE He_Thong SHALL điều hướng đến `/khoa/drl-review?mssv={mssv}`.

6. IF NguoiXemDiem không có role hợp lệ (`admin`, `ctsv`, `giangvien`, `khoa`), THEN THE He_Thong SHALL ẩn nút "Xem điểm DRL" và không thực hiện điều hướng.

---

### Yêu Cầu 5: Trang DRL Nhận Và Xử Lý Tham Số Lọc Từ URL

**User Story:** Là CTSV hoặc giảng viên, khi tôi được điều hướng từ trang quản lý sinh viên sang trang DRL, tôi muốn trang DRL tự động hiển thị thông tin của sinh viên được chọn, không cần tìm kiếm lại thủ công.

#### Tiêu Chí Chấp Nhận

1. WHEN Trang_QuanLyDRL được tải với URL query parameter `?mssv={mssv}`, THE He_Thong SHALL tự động điền MSSV vào ô tìm kiếm và hiển thị danh sách Phieu_TuDanhGia của SinhVien đó.

2. WHEN Trang_QuanLyDRL được tải với URL query parameter `?mssv={mssv}` và không tìm thấy Phieu_TuDanhGia nào, THE He_Thong SHALL hiển thị thông báo "Sinh viên {mssv} chưa có phiếu tự đánh giá nào" thay vì danh sách rỗng không có giải thích.

3. WHEN Trang_QuanLyDRL được tải mà không có query parameter, THE He_Thong SHALL hiển thị toàn bộ danh sách theo quyền của NguoiXemDiem (hành vi mặc định hiện tại).

4. THE He_Thong SHALL đồng bộ trạng thái bộ lọc MSSV với URL, để khi NguoiXemDiem chia sẻ URL, người nhận thấy cùng kết quả lọc.

---

### Yêu Cầu 6: Nút "Xem Điểm DRL" Trên Các Trang Quản Lý Sinh Viên

**User Story:** Là quản lý khoa, khi tôi xem danh sách sinh viên trong khoa, tôi muốn có nút truy cập nhanh sang trang duyệt DRL của khoa, để không phải điều hướng thủ công qua menu.

#### Tiêu Chí Chấp Nhận

1. THE Trang_QuanLySinhVien SHALL hiển thị nút "Xem điểm DRL" trên mỗi hàng sinh viên trong bảng danh sách, với điều kiện NguoiXemDiem có role hợp lệ.

2. WHEN NguoiXemDiem di chuột vào nút "Xem điểm DRL", THE He_Thong SHALL hiển thị tooltip cho biết trang đích sẽ được điều hướng đến.

3. THE Trang_QuanLySinhVien SHALL áp dụng nút "Xem điểm DRL" cho tất cả các trang sau: `AdminUsers` (tab sinh viên), `KhoaStudentList`, `TeacherClassStudents`.

4. IF SinhVien đang được hiển thị không có MSSV hợp lệ, THEN THE He_Thong SHALL vô hiệu hóa nút "Xem điểm DRL" cho hàng đó.

---

### Yêu Cầu 7: Nhắc Nhở Sinh Viên Chưa Hoàn Thiện Hồ Sơ

**User Story:** Là admin, tôi muốn gửi nhắc nhở đến sinh viên có hồ sơ thiếu thông tin bắt buộc (thiếu ngày sinh, địa chỉ, v.v.), để đảm bảo dữ liệu sinh viên đầy đủ trong hệ thống.

#### Tiêu Chí Chấp Nhận

1. WHEN NguoiGui yêu cầu danh sách sinh viên có hồ sơ chưa hoàn thiện, THE He_Thong SHALL trả về danh sách SinhVien có ít nhất một trong các trường bắt buộc bị null hoặc rỗng: `hoten`, `ngaysinh`, `gioitinh`, `malop`, `makhoa`.

2. WHEN NguoiGui gửi nhắc nhở hoàn thiện hồ sơ, THE ThongBao_Module SHALL tạo thông báo với loại `nhacnho_hoso` và lưu danh sách MSSV mục tiêu.

3. IF NguoiGui không có role `admin` hoặc `ctsv`, THEN THE He_Thong SHALL trả về lỗi HTTP 403 khi cố gắng truy vấn danh sách sinh viên thiếu hồ sơ.

4. THE He_Thong SHALL cho phép NguoiGui xem trước danh sách sinh viên thiếu hồ sơ trước khi gửi nhắc nhở, tương tự Yêu Cầu 3.
