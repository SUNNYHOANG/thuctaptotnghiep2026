# Tài liệu Yêu cầu

## Giới thiệu

Tính năng **Nhập điểm sinh viên và xét học bổng tự động** cho phép giảng viên nhập điểm môn học theo từng lớp học phần, CTSV quản lý và chỉnh sửa điểm toàn trường, đồng thời hệ thống tự động xét học bổng dựa trên GPA và điểm rèn luyện (DRL) theo từng học kỳ. Tính năng tích hợp với các bảng dữ liệu hiện có (`bangdiem`, `diemrenluyen`, `hocbong`, `sinhvien`, `monhoc`, `hocky`) và mở rộng các API hiện có (`gradeRoutes.js`, `hocBongRoutes.js`, `scoreRoutes.js`).

## Bảng thuật ngữ

- **GradeSystem**: Hệ thống nhập và quản lý điểm môn học
- **ScholarshipEngine**: Hệ thống xét và quản lý học bổng tự động
- **Giangvien**: Người dùng có role `giangvien`, chỉ nhập điểm cho lớp học phần mình phụ trách
- **CTSV**: Người dùng có role `ctsv`, có quyền nhập/chỉnh sửa điểm toàn trường và duyệt học bổng
- **SinhVien**: Người dùng có role `sinhvien`, chỉ xem điểm và kết quả học bổng của bản thân
- **GPA**: Điểm trung bình tích lũy theo thang 4.0
- **DRL**: Điểm rèn luyện theo thang 100, lưu trong bảng `diemrenluyen`
- **BangDiem**: Bảng điểm môn học của sinh viên trong một lớp học phần, lưu trong bảng `bangdiem`
- **HocBong**: Học bổng được xét theo học kỳ, lưu trong bảng `hocbong`
- **LopHocPhan**: Lớp học phần gắn với môn học, học kỳ và giảng viên, lưu trong bảng `lophocphan`
- **MucHocBong**: Mức xếp loại học bổng: Xuất sắc, Giỏi, Khá, Trung bình, Không đủ điều kiện

---

## Yêu cầu

### Yêu cầu 1: Nhập điểm theo lớp học phần (Giảng viên)

**User Story:** Là một giảng viên, tôi muốn nhập điểm cho sinh viên trong lớp học phần mình phụ trách, để cập nhật kết quả học tập chính xác và kịp thời.

#### Tiêu chí chấp nhận

1. WHEN một Giangvien truy cập danh sách lớp học phần, THE GradeSystem SHALL chỉ hiển thị các lớp học phần mà Giangvien đó được phân công phụ trách (theo `magiaovien` trong bảng `lophocphan`)
2. WHEN một Giangvien nhập điểm chuyên cần, giữa kỳ, cuối kỳ cho một sinh viên trong lớp mình phụ trách, THE GradeSystem SHALL tính toán và lưu điểm tổng kết theo công thức: `diemtongket = diemchuyencan * 0.1 + diemgiuaky * 0.3 + diemcuoiky * 0.6`
3. WHEN một Giangvien nhập điểm với giá trị nằm ngoài khoảng [0, 10], THE GradeSystem SHALL từ chối lưu và trả về thông báo lỗi mô tả rõ trường điểm không hợp lệ
4. WHEN một Giangvien cố gắng nhập điểm cho lớp học phần không thuộc quyền phụ trách, THE GradeSystem SHALL từ chối yêu cầu và trả về lỗi 403
5. WHEN điểm tổng kết của một sinh viên được tính, THE GradeSystem SHALL chuyển đổi sang GPA thang 4.0 theo công thức `gpa = (diemtongket / 10) * 4` và lưu vào cột `gpa` trong bảng `bangdiem`
6. WHEN một BangDiem có trạng thái `dakhoa`, THE GradeSystem SHALL từ chối mọi yêu cầu sửa điểm và trả về thông báo lỗi

---

### Yêu cầu 2: Nhập và chỉnh sửa điểm toàn trường (CTSV)

**User Story:** Là nhân viên CTSV, tôi muốn nhập và chỉnh sửa điểm cho bất kỳ sinh viên nào, để xử lý các trường hợp đặc biệt và đảm bảo dữ liệu điểm chính xác.

#### Tiêu chí chấp nhận

1. THE CTSV SHALL có quyền nhập và chỉnh sửa điểm cho bất kỳ sinh viên nào trong bất kỳ lớp học phần nào, không bị giới hạn bởi phân công giảng dạy
2. WHEN CTSV chỉnh sửa điểm đã tồn tại, THE GradeSystem SHALL ghi log vào bảng `log_suadiem` với thông tin: trường điểm thay đổi, giá trị cũ, giá trị mới, người sửa, thời gian sửa
3. WHEN CTSV nhập điểm hàng loạt qua file Excel, THE GradeSystem SHALL đọc file, validate từng dòng, và lưu các dòng hợp lệ; các dòng lỗi SHALL được trả về trong response kèm mô tả lỗi cụ thể
4. WHEN file Excel nhập điểm hàng loạt có định dạng không đúng (thiếu cột bắt buộc: `mssv`, `malophocphan`, `diemcuoiky`), THE GradeSystem SHALL từ chối toàn bộ file và trả về thông báo lỗi định dạng
5. WHEN CTSV mở khóa một BangDiem có trạng thái `dakhoa`, THE GradeSystem SHALL cho phép chỉnh sửa điểm trở lại và cập nhật trạng thái về `dangnhap`

---

### Yêu cầu 3: Xem điểm (Sinh viên)

**User Story:** Là một sinh viên, tôi muốn xem điểm các môn học của mình theo từng học kỳ, để theo dõi kết quả học tập.

#### Tiêu chí chấp nhận

1. WHEN một SinhVien yêu cầu xem điểm, THE GradeSystem SHALL chỉ trả về điểm của chính SinhVien đó (theo `mssv` từ token xác thực), không trả về điểm của sinh viên khác
2. WHEN một SinhVien xem điểm theo học kỳ, THE GradeSystem SHALL trả về danh sách điểm gồm: tên môn học, số tín chỉ, điểm chuyên cần, điểm giữa kỳ, điểm cuối kỳ, điểm tổng kết, GPA, xếp loại
3. WHILE một BangDiem có trạng thái `dangnhap`, THE GradeSystem SHALL không hiển thị điểm đó cho SinhVien (chỉ hiển thị điểm đã khóa `dakhoa`)

---

### Yêu cầu 4: Chuyển đổi thang điểm

**User Story:** Là người dùng hệ thống, tôi muốn xem điểm được hiển thị theo cả thang 10 và thang 4.0, để dễ dàng đối chiếu và sử dụng.

#### Tiêu chí chấp nhận

1. THE GradeSystem SHALL lưu trữ điểm gốc theo thang 10 (`diemtongket`) và GPA thang 4.0 (`gpa`) song song trong bảng `bangdiem`
2. WHEN hiển thị điểm, THE GradeSystem SHALL cung cấp cả hai giá trị: điểm thang 10 và GPA thang 4.0 trong cùng một response
3. THE GradeSystem SHALL tính GPA theo công thức: `gpa = (diemtongket / 10) * 4`, làm tròn đến 2 chữ số thập phân
4. WHEN điểm tổng kết nằm ngoài khoảng [0, 10], THE GradeSystem SHALL trả về `gpa = null` thay vì tính toán sai

---

### Yêu cầu 5: Xét học bổng tự động theo học kỳ

**User Story:** Là nhân viên CTSV, tôi muốn hệ thống tự động xét học bổng dựa trên GPA và DRL của sinh viên, để tiết kiệm thời gian và đảm bảo tính công bằng.

#### Tiêu chí chấp nhận

1. WHEN CTSV kích hoạt xét học bổng cho một học kỳ, THE ScholarshipEngine SHALL tổng hợp GPA trung bình của tất cả môn học trong học kỳ đó và DRL từ bảng `diemrenluyen` cho từng sinh viên
2. THE ScholarshipEngine SHALL phân loại học bổng theo tiêu chí sau:
   - **Xuất sắc**: GPA >= 3.6 VÀ DRL >= 80
   - **Giỏi**: GPA >= 3.2 VÀ DRL >= 80
   - **Khá**: GPA >= 3.2 VÀ DRL >= 65 (và DRL < 80)
   - **Trung bình**: GPA >= 2.5 VÀ DRL >= 50
   - **Không đủ điều kiện**: các trường hợp còn lại
3. WHEN xét học bổng hoàn tất, THE ScholarshipEngine SHALL trả về danh sách sinh viên kèm MucHocBong tương ứng, sắp xếp theo mức từ cao đến thấp
4. WHEN một sinh viên không có DRL trong học kỳ được xét, THE ScholarshipEngine SHALL xếp sinh viên đó vào mức **Không đủ điều kiện**
5. WHEN một sinh viên không có điểm môn học (GPA) trong học kỳ được xét, THE ScholarshipEngine SHALL xếp sinh viên đó vào mức **Không đủ điều kiện**

---

### Yêu cầu 6: Duyệt và quản lý học bổng (CTSV)

**User Story:** Là nhân viên CTSV, tôi muốn duyệt hoặc từ chối học bổng cho từng sinh viên sau khi xét tự động, để xử lý các trường hợp đặc biệt.

#### Tiêu chí chấp nhận

1. WHEN CTSV duyệt học bổng cho một sinh viên, THE ScholarshipEngine SHALL cập nhật trạng thái trong bảng `sinhvien_hocbong` thành `duyet` và ghi nhận người duyệt, ngày duyệt
2. WHEN CTSV từ chối học bổng cho một sinh viên, THE ScholarshipEngine SHALL cập nhật trạng thái thành `tuchoi` và yêu cầu CTSV nhập lý do từ chối (ghi vào cột `ghichu`)
3. WHEN CTSV xem danh sách xét học bổng theo học kỳ, THE ScholarshipEngine SHALL hiển thị danh sách sinh viên phân nhóm theo MucHocBong, kèm GPA và DRL của từng sinh viên
4. WHEN CTSV xuất danh sách học bổng, THE ScholarshipEngine SHALL tạo file Excel gồm: MSSV, họ tên, lớp, GPA, DRL, mức học bổng, trạng thái duyệt

---

### Yêu cầu 7: Xem kết quả học bổng (Sinh viên)

**User Story:** Là một sinh viên, tôi muốn xem kết quả xét học bổng của mình theo từng học kỳ, để biết mình có được nhận học bổng hay không.

#### Tiêu chí chấp nhận

1. WHEN một SinhVien xem kết quả học bổng, THE ScholarshipEngine SHALL chỉ trả về thông tin học bổng của chính SinhVien đó
2. WHEN một SinhVien được duyệt học bổng, THE ScholarshipEngine SHALL hiển thị: tên học bổng, học kỳ, mức học bổng, trạng thái `duyet`, ngày duyệt
3. WHEN một SinhVien bị từ chối học bổng, THE ScholarshipEngine SHALL hiển thị trạng thái `tuchoi` kèm lý do từ chối
4. WHEN một SinhVien chưa được xét học bổng trong học kỳ hiện tại, THE ScholarshipEngine SHALL trả về danh sách rỗng thay vì lỗi

---

### Yêu cầu 8: Nhập điểm hàng loạt qua Excel

**User Story:** Là giảng viên hoặc CTSV, tôi muốn nhập điểm hàng loạt qua file Excel, để tiết kiệm thời gian khi nhập điểm cho nhiều sinh viên.

#### Tiêu chí chấp nhận

1. WHEN người dùng tải lên file Excel nhập điểm, THE GradeSystem SHALL parse file và trả về preview danh sách điểm trước khi lưu
2. WHEN file Excel được xác nhận, THE GradeSystem SHALL lưu tất cả dòng hợp lệ và trả về báo cáo: số dòng thành công, số dòng lỗi, chi tiết lỗi từng dòng
3. THE GradeSystem SHALL chấp nhận file Excel với các cột bắt buộc: `mssv`, `malophocphan`, `diemchuyencan` (tùy chọn), `diemgiuaky` (tùy chọn), `diemcuoiky`
4. WHEN file Excel chứa MSSV không tồn tại trong hệ thống, THE GradeSystem SHALL bỏ qua dòng đó và ghi vào danh sách lỗi kèm thông báo "MSSV không tồn tại"
5. FOR ALL file Excel nhập điểm hợp lệ, parse rồi lưu rồi truy vấn lại SHALL trả về dữ liệu điểm tương đương với dữ liệu trong file (round-trip property)
