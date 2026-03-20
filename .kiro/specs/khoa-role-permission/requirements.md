# Tài Liệu Yêu Cầu

## Giới Thiệu

Tính năng này bổ sung vai trò mới **"khoa"** (Ban quản lý Khoa/Ngành) vào hệ thống quản lý sinh viên hiện có. Hệ thống hiện tại có 4 vai trò: `admin`, `giangvien`, `ctsv`, `sinhvien`. Vai trò `khoa` đại diện cho cán bộ quản lý cấp khoa/ngành, được gắn với một khoa cụ thể và chỉ có quyền truy cập dữ liệu sinh viên thuộc khoa đó.

Vai trò `khoa` được chèn vào quy trình duyệt DRL (Điểm Rèn Luyện) như một bước duyệt cấp khoa **sau** khi Giảng viên/CVHT duyệt bước 1 và **trước** khi CTSV duyệt bước cuối. Quy trình DRL mới sẽ là: **Sinh viên tự đánh giá → Giảng viên duyệt bước 1 → Khoa duyệt bước 2 → CTSV duyệt bước cuối**.

---

## Bảng Thuật Ngữ (Glossary)

- **System**: Hệ thống quản lý sinh viên (Node.js/Express + MySQL + React).
- **Khoa_Manager**: Tài khoản người dùng có vai trò `khoa`, đại diện cho ban quản lý một khoa/ngành cụ thể.
- **Admin**: Tài khoản quản trị viên hệ thống, có toàn quyền.
- **CTSV**: Tài khoản phòng Công tác Sinh viên, duyệt DRL bước cuối.
- **Giangvien**: Tài khoản giảng viên/cố vấn học tập (CVHT), duyệt DRL bước 1.
- **Sinhvien**: Tài khoản sinh viên.
- **Khoa**: Đơn vị khoa/ngành học trong trường (ví dụ: CNTT, QTKD). Được xác định bằng `makhoa`.
- **DRL_Phieu**: Phiếu tự đánh giá điểm rèn luyện của sinh viên, lưu trong bảng `drl_tudanhgia`.
- **DRL_Workflow**: Quy trình duyệt điểm rèn luyện gồm nhiều bước tuần tự.
- **Bảng_Users**: Bảng `users` trong MySQL, lưu thông tin tài khoản cán bộ (admin, giangvien, ctsv, khoa).
- **Bảng_Sinhvien**: Bảng `sinhvien` trong MySQL, lưu thông tin sinh viên với trường `makhoa`.
- **Bảng_DRL**: Bảng `drl_tudanhgia` trong MySQL, lưu phiếu tự đánh giá DRL.
- **Middleware_RequireRole**: File `backend/middleware/requireRole.js`, kiểm tra quyền truy cập theo vai trò.
- **KhoaDashboard**: Trang dashboard dành riêng cho vai trò `khoa` trên frontend.
- **Token**: Chuỗi xác thực phiên đăng nhập, hiện có dạng `staff-{id}-{role}`.
- **makhoa**: Mã khoa/ngành, là khóa ngoại liên kết giữa tài khoản `khoa` và sinh viên thuộc khoa đó.
- **trangthai_drl**: Trạng thái phiếu DRL, hiện có: `choduyet`, `daduyet`, `bituchoi`. Sẽ bổ sung `chokhoaduyet`.

---

## Yêu Cầu

### Yêu Cầu 1: Cấu Trúc Dữ Liệu Cho Vai Trò Khoa

**User Story:** Là Admin, tôi muốn hệ thống hỗ trợ lưu trữ tài khoản vai trò `khoa` gắn với một khoa cụ thể, để có thể tạo và quản lý tài khoản ban quản lý khoa.

#### Tiêu Chí Chấp Nhận

1. THE System SHALL mở rộng cột `role` trong bảng `users` để chấp nhận giá trị `'khoa'` (thêm vào ENUM hiện có: `'admin'`, `'giangvien'`, `'ctsv'`).
2. THE System SHALL thêm cột `makhoa VARCHAR(50) DEFAULT NULL` vào bảng `users` để lưu mã khoa mà tài khoản `khoa` được gắn với.
3. WHEN một tài khoản có `role = 'khoa'` được tạo, THE System SHALL yêu cầu trường `makhoa` không được NULL và phải tương ứng với một giá trị `makhoa` tồn tại trong bảng `sinhvien`.
4. WHEN một tài khoản có `role != 'khoa'` được tạo hoặc cập nhật, THE System SHALL cho phép trường `makhoa` trong bảng `users` là NULL.
5. THE System SHALL thêm cột `diem_khoa INT DEFAULT NULL`, `nhan_xet_khoa TEXT NULL`, `nguoi_duyet_khoa VARCHAR(50) NULL`, `ngay_duyet_khoa DATETIME NULL` vào bảng `drl_tudanhgia` để lưu kết quả duyệt của vai trò `khoa`.
6. THE System SHALL mở rộng giá trị `trangthai` trong bảng `drl_tudanhgia` để chấp nhận thêm trạng thái `'chokhoaduyet'` (chờ khoa duyệt, sau khi giảng viên đã duyệt bước 1).

---

### Yêu Cầu 2: Xác Thực và Phân Quyền Vai Trò Khoa

**User Story:** Là cán bộ quản lý khoa, tôi muốn đăng nhập vào hệ thống bằng tài khoản vai trò `khoa`, để có thể truy cập các chức năng dành riêng cho khoa.

#### Tiêu Chí Chấp Nhận

1. WHEN một người dùng gửi yêu cầu đăng nhập tới endpoint `/api/auth/login-staff` với `username` và `password` hợp lệ của tài khoản có `role = 'khoa'`, THE System SHALL trả về thông tin người dùng bao gồm `id`, `username`, `hoten`, `role`, `makhoa`, `status` và `access_token` có dạng `staff-{id}-khoa`.
2. WHEN endpoint `/api/auth/me` nhận token hợp lệ của tài khoản `khoa`, THE System SHALL trả về thông tin người dùng bao gồm trường `makhoa`.
3. THE Middleware_RequireRole SHALL chấp nhận `'khoa'` là một giá trị vai trò hợp lệ khi được truyền vào danh sách `roles`.
4. WHEN một yêu cầu HTTP tới endpoint được bảo vệ bởi Middleware_RequireRole với danh sách không bao gồm `'khoa'`, THE Middleware_RequireRole SHALL trả về HTTP 403 với thông báo lỗi rõ ràng.
5. IF một tài khoản `khoa` gửi yêu cầu tới endpoint chỉ dành cho `admin` hoặc `ctsv`, THEN THE System SHALL trả về HTTP 403.

---

### Yêu Cầu 3: Quản Lý Tài Khoản Khoa Bởi Admin

**User Story:** Là Admin, tôi muốn tạo, xem, cập nhật và xóa tài khoản vai trò `khoa`, để quản lý danh sách ban quản lý các khoa trong hệ thống.

#### Tiêu Chí Chấp Nhận

1. WHEN Admin gửi yêu cầu POST tới `/api/users` với `role = 'khoa'` và `makhoa` hợp lệ, THE System SHALL tạo tài khoản mới trong bảng `users` với đầy đủ thông tin và trả về HTTP 201.
2. IF Admin gửi yêu cầu POST tới `/api/users` với `role = 'khoa'` nhưng thiếu hoặc để trống `makhoa`, THEN THE System SHALL trả về HTTP 400 với thông báo lỗi `'Tài khoản vai trò khoa phải có makhoa'`.
3. WHEN Admin gửi yêu cầu GET tới `/api/users` với query `role=khoa`, THE System SHALL trả về danh sách tất cả tài khoản có `role = 'khoa'` kèm theo trường `makhoa`.
4. WHEN Admin gửi yêu cầu PUT tới `/api/users/:id` để cập nhật tài khoản `khoa`, THE System SHALL cho phép cập nhật các trường `hoten`, `email`, `status`, `makhoa`.
5. IF Admin gửi yêu cầu PUT tới `/api/users/:id` để thay đổi `makhoa` của tài khoản `khoa` thành một giá trị không tồn tại trong bảng `sinhvien`, THEN THE System SHALL trả về HTTP 400 với thông báo lỗi phù hợp.
6. WHEN Admin truy cập trang AdminUsers trên frontend, THE AdminUsers_Page SHALL hiển thị tùy chọn vai trò `'khoa'` trong dropdown chọn vai trò khi tạo hoặc chỉnh sửa tài khoản.
7. WHEN Admin chọn vai trò `'khoa'` trong form tạo/sửa tài khoản, THE AdminUsers_Page SHALL hiển thị thêm trường nhập `makhoa` bắt buộc.
8. WHEN Admin lọc danh sách người dùng theo vai trò, THE AdminUsers_Page SHALL hiển thị tùy chọn lọc `'khoa'` trong dropdown vai trò.

---

### Yêu Cầu 4: Phạm Vi Truy Cập Dữ Liệu Sinh Viên Của Khoa

**User Story:** Là cán bộ quản lý khoa, tôi muốn chỉ xem được danh sách và thông tin sinh viên thuộc khoa của mình, để đảm bảo tính bảo mật và phân quyền dữ liệu.

#### Tiêu Chí Chấp Nhận

1. WHEN Khoa_Manager gửi yêu cầu GET tới `/api/users/students/all`, THE System SHALL chỉ trả về danh sách sinh viên có `makhoa` trùng với `makhoa` của tài khoản Khoa_Manager đang đăng nhập.
2. WHEN Khoa_Manager gửi yêu cầu GET tới `/api/users/students/profile/:mssv`, THE System SHALL kiểm tra `makhoa` của sinh viên đó; IF `makhoa` của sinh viên không trùng với `makhoa` của Khoa_Manager, THEN THE System SHALL trả về HTTP 403.
3. WHEN Admin gửi yêu cầu GET tới `/api/users/students/all`, THE System SHALL trả về toàn bộ danh sách sinh viên không phân biệt khoa.
4. WHEN CTSV gửi yêu cầu GET tới `/api/users/students/all`, THE System SHALL trả về toàn bộ danh sách sinh viên không phân biệt khoa.
5. THE System SHALL áp dụng bộ lọc `makhoa` tự động dựa trên thông tin tài khoản đăng nhập, không cho phép Khoa_Manager tự truyền tham số `makhoa` khác để vượt qua giới hạn phạm vi.

---

### Yêu Cầu 5: Quy Trình DRL Mới Với Bước Duyệt Của Khoa

**User Story:** Là cán bộ quản lý khoa, tôi muốn xem và duyệt phiếu DRL của sinh viên thuộc khoa mình sau khi giảng viên đã duyệt, để thực hiện kiểm soát chất lượng cấp khoa trước khi chuyển lên CTSV.

#### Tiêu Chí Chấp Nhận

1. WHEN Giangvien duyệt phiếu DRL của sinh viên (đặt `trangthai = 'daduyet'` ở bước 1), THE System SHALL tự động chuyển `trangthai` của phiếu đó sang `'chokhoaduyet'` thay vì giữ nguyên `'daduyet'`.
2. WHEN Khoa_Manager gửi yêu cầu GET tới `/api/drl-self/class/:malop/semester/:mahocky`, THE System SHALL chỉ trả về các phiếu có `trangthai = 'chokhoaduyet'` và `makhoa` của sinh viên trùng với `makhoa` của Khoa_Manager.
3. WHEN Khoa_Manager gửi yêu cầu PUT tới `/api/drl-self/:id/review` với `trangthai = 'daduyet'`, THE System SHALL cập nhật phiếu với `diem_khoa`, `nhan_xet_khoa`, `nguoi_duyet_khoa`, `ngay_duyet_khoa` và chuyển `trangthai` sang `'daduyet'` (chờ CTSV duyệt cuối).
4. WHEN Khoa_Manager gửi yêu cầu PUT tới `/api/drl-self/:id/review` với `trangthai = 'bituchoi'`, THE System SHALL cập nhật `trangthai = 'bituchoi'` và lưu `nhan_xet_khoa`, cho phép sinh viên chỉnh sửa và gửi lại.
5. IF Khoa_Manager gửi yêu cầu duyệt phiếu DRL của sinh viên có `makhoa` khác với `makhoa` của Khoa_Manager, THEN THE System SHALL trả về HTTP 403.
6. WHEN CTSV gửi yêu cầu GET tới `/api/drl-self/class/:malop/semester/:mahocky`, THE System SHALL chỉ trả về các phiếu có `trangthai = 'daduyet'` và `nguoi_duyet_ctsv IS NULL` (đã qua bước khoa, chờ CTSV duyệt cuối).
7. WHEN Giangvien gửi yêu cầu GET tới `/api/drl-self/class/:malop/semester/:mahocky`, THE System SHALL chỉ trả về các phiếu có `trangthai = 'choduyet'` hoặc `'bituchoi'` (chưa qua bước giảng viên).
8. THE System SHALL đảm bảo thứ tự duyệt tuần tự: Sinh viên → Giảng viên → Khoa → CTSV; IF một bước bị bỏ qua, THEN THE System SHALL trả về HTTP 400 với thông báo lỗi phù hợp.

---

### Yêu Cầu 6: Giao Diện Dashboard Cho Vai Trò Khoa

**User Story:** Là cán bộ quản lý khoa, tôi muốn có một trang dashboard riêng sau khi đăng nhập, để nhanh chóng truy cập các chức năng quản lý sinh viên và duyệt DRL của khoa mình.

#### Tiêu Chí Chấp Nhận

1. WHEN Khoa_Manager đăng nhập thành công, THE System SHALL điều hướng tới trang `/khoa/dashboard` thay vì các trang dashboard của vai trò khác.
2. THE KhoaDashboard SHALL hiển thị tên khoa và mã khoa (`makhoa`) của tài khoản đang đăng nhập.
3. THE KhoaDashboard SHALL cung cấp liên kết điều hướng tới trang danh sách sinh viên của khoa.
4. THE KhoaDashboard SHALL cung cấp liên kết điều hướng tới trang duyệt phiếu DRL của khoa.
5. THE KhoaDashboard SHALL hiển thị số lượng phiếu DRL đang chờ duyệt (`trangthai = 'chokhoaduyet'`) của khoa trong học kỳ hiện tại.
6. WHEN Khoa_Manager truy cập bất kỳ route nào không thuộc phạm vi quyền của vai trò `khoa`, THE System SHALL điều hướng về trang `/khoa/dashboard` hoặc hiển thị thông báo không có quyền truy cập.

---

### Yêu Cầu 7: Trang Duyệt DRL Cho Vai Trò Khoa

**User Story:** Là cán bộ quản lý khoa, tôi muốn xem danh sách phiếu DRL chờ duyệt và thực hiện duyệt/từ chối từng phiếu, để hoàn thành bước kiểm duyệt cấp khoa trong quy trình DRL.

#### Tiêu Chí Chấp Nhận

1. THE KhoaDrlReview_Page SHALL hiển thị bộ lọc chọn học kỳ và chọn lớp (chỉ hiển thị các lớp thuộc khoa của Khoa_Manager).
2. WHEN Khoa_Manager chọn học kỳ và nhấn tải danh sách, THE KhoaDrlReview_Page SHALL hiển thị danh sách phiếu DRL có `trangthai = 'chokhoaduyet'` thuộc khoa của Khoa_Manager, bao gồm: MSSV, họ tên, lớp, tổng điểm sinh viên tự đánh giá, điểm CVHT, trạng thái.
3. WHEN Khoa_Manager chọn một phiếu trong danh sách, THE KhoaDrlReview_Page SHALL hiển thị chi tiết phiếu bao gồm: thông tin sinh viên, điểm từng mục tự đánh giá, nhận xét của sinh viên, điểm và nhận xét của giảng viên/CVHT.
4. THE KhoaDrlReview_Page SHALL cung cấp form duyệt với các trường: trạng thái (duyệt/từ chối), điểm khoa (`diem_khoa`, từ 0 đến 100), nhận xét của khoa (`nhan_xet_khoa`).
5. WHEN Khoa_Manager nhấn "Lưu duyệt phiếu", THE KhoaDrlReview_Page SHALL gửi yêu cầu PUT tới `/api/drl-self/:id/review` với thông tin duyệt của khoa.
6. WHEN duyệt thành công, THE KhoaDrlReview_Page SHALL cập nhật trạng thái phiếu trong danh sách và hiển thị thông báo thành công.
7. IF Khoa_Manager cố gắng duyệt phiếu không thuộc khoa của mình, THEN THE KhoaDrlReview_Page SHALL hiển thị thông báo lỗi từ server.

---

### Yêu Cầu 8: Trang Danh Sách Sinh Viên Cho Vai Trò Khoa

**User Story:** Là cán bộ quản lý khoa, tôi muốn xem danh sách sinh viên thuộc khoa mình với thông tin cơ bản, để nắm bắt tổng quan về sinh viên trong khoa.

#### Tiêu Chí Chấp Nhận

1. THE KhoaStudentList_Page SHALL hiển thị danh sách sinh viên có `makhoa` trùng với `makhoa` của Khoa_Manager đang đăng nhập.
2. THE KhoaStudentList_Page SHALL hiển thị các cột: MSSV, họ tên, lớp, tình trạng học tập.
3. THE KhoaStudentList_Page SHALL cung cấp chức năng tìm kiếm sinh viên theo MSSV hoặc họ tên trong phạm vi khoa.
4. WHEN Khoa_Manager nhấn vào một sinh viên trong danh sách, THE KhoaStudentList_Page SHALL hiển thị trang hồ sơ chi tiết của sinh viên đó (chỉ đọc).
5. THE KhoaStudentList_Page SHALL KHÔNG hiển thị sinh viên thuộc khoa khác.

---

### Yêu Cầu 9: Hiển Thị Trạng Thái DRL Cho Sinh Viên

**User Story:** Là sinh viên, tôi muốn thấy trạng thái phiếu DRL của mình được cập nhật chính xác theo từng bước duyệt, để biết phiếu đang ở bước nào trong quy trình.

#### Tiêu Chí Chấp Nhận

1. WHEN phiếu DRL của sinh viên có `trangthai = 'chokhoaduyet'`, THE DrlSelfEvaluation_Page SHALL hiển thị trạng thái là `'Chờ Khoa duyệt'`.
2. WHEN phiếu DRL của sinh viên có `trangthai = 'daduyet'` và `nguoi_duyet_khoa IS NOT NULL` và `nguoi_duyet_ctsv IS NULL`, THE DrlSelfEvaluation_Page SHALL hiển thị trạng thái là `'Chờ Phòng CTSV duyệt cuối'`.
3. WHEN phiếu DRL của sinh viên có `diem_khoa IS NOT NULL`, THE DrlSelfEvaluation_Page SHALL hiển thị điểm và nhận xét của khoa trong phần thông tin phiếu.
4. WHEN phiếu DRL của sinh viên có `trangthai = 'bituchoi'` do khoa từ chối, THE DrlSelfEvaluation_Page SHALL hiển thị thông báo `'Bị Khoa từ chối'` kèm nhận xét của khoa và cho phép sinh viên chỉnh sửa và gửi lại.

---

### Yêu Cầu 10: Cập Nhật Trang DrlClassReview Cho Giảng Viên và CTSV

**User Story:** Là giảng viên và CTSV, tôi muốn trang duyệt DRL hiển thị đúng trạng thái và nhãn phù hợp với quy trình mới có thêm bước khoa, để không bị nhầm lẫn trong quá trình duyệt.

#### Tiêu Chí Chấp Nhận

1. WHEN Giangvien duyệt phiếu và đặt `trangthai = 'daduyet'`, THE DrlClassReview_Page SHALL hiển thị nhãn trạng thái là `'Chờ Khoa duyệt'` thay vì `'Chờ CTSV duyệt cuối'`.
2. WHEN CTSV xem danh sách phiếu, THE DrlClassReview_Page SHALL chỉ hiển thị các phiếu đã qua bước duyệt của khoa (`nguoi_duyet_khoa IS NOT NULL`).
3. THE DrlClassReview_Page SHALL hiển thị cột `Điểm Khoa` trong bảng danh sách phiếu khi người dùng là CTSV hoặc Admin.
4. WHEN CTSV xem chi tiết phiếu, THE DrlClassReview_Page SHALL hiển thị thêm thông tin điểm và nhận xét của khoa (`diem_khoa`, `nhan_xet_khoa`).

---

### Yêu Cầu 11: Bảo Mật và Kiểm Soát Truy Cập API

**User Story:** Là Admin hệ thống, tôi muốn tất cả các API endpoint liên quan đến dữ liệu khoa được bảo vệ đúng cách, để ngăn chặn truy cập trái phép giữa các khoa và vai trò.

#### Tiêu Chí Chấp Nhận

1. THE Middleware_RequireRole SHALL được cập nhật để hỗ trợ kiểm tra `makhoa` của người dùng đăng nhập khi cần lọc dữ liệu theo khoa.
2. IF một yêu cầu HTTP tới endpoint duyệt DRL không có thông tin xác thực hợp lệ, THEN THE System SHALL trả về HTTP 401.
3. IF một Khoa_Manager gửi yêu cầu tới endpoint duyệt DRL của khoa khác, THEN THE System SHALL trả về HTTP 403.
4. THE System SHALL ghi log mỗi hành động duyệt/từ chối phiếu DRL của Khoa_Manager bao gồm: `id phiếu`, `mssv sinh viên`, `username người duyệt`, `makhoa`, `thời gian`, `kết quả`.
5. WHEN Admin xem log hệ thống, THE System SHALL cho phép lọc log theo `makhoa` và `username` của Khoa_Manager.

---

### Yêu Cầu 12: Tính Toàn Vẹn Dữ Liệu Và Tương Thích Ngược

**User Story:** Là Admin hệ thống, tôi muốn việc thêm vai trò `khoa` không làm ảnh hưởng đến dữ liệu và chức năng hiện có, để hệ thống tiếp tục hoạt động ổn định sau khi nâng cấp.

#### Tiêu Chí Chấp Nhận

1. THE System SHALL thực hiện migration database bằng các câu lệnh `ALTER TABLE` không phá vỡ dữ liệu hiện có (sử dụng `ADD COLUMN ... DEFAULT NULL` và `MODIFY COLUMN` với giá trị mặc định an toàn).
2. WHEN migration được chạy trên database có dữ liệu DRL hiện tại, THE System SHALL giữ nguyên tất cả phiếu DRL hiện có với `trangthai` không thay đổi.
3. THE System SHALL đảm bảo các phiếu DRL hiện có với `trangthai = 'daduyet'` và `nguoi_duyet_ctsv IS NULL` vẫn được CTSV xem và duyệt bình thường (không bị chặn bởi logic mới yêu cầu `nguoi_duyet_khoa`).
4. WHEN hệ thống được nâng cấp, THE System SHALL cung cấp script migration SQL riêng biệt trong thư mục `backend/database/` với tên `06_khoa_role.sql`.
5. THE System SHALL đảm bảo tất cả API endpoint hiện có của `admin`, `giangvien`, `ctsv`, `sinhvien` tiếp tục hoạt động đúng sau khi thêm vai trò `khoa`.
