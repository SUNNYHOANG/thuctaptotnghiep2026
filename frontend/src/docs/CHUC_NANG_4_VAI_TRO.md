# Đối chiếu chức năng theo 4 vai trò

## SINH VIÊN

| Chức năng | Có trong dự án | Ghi chú |
|-----------|----------------|---------|
| Đăng nhập / Đăng ký | ✅ | Login.jsx, Register.jsx |
| Xem điểm rèn luyện các học kỳ | ✅ | ScorePage, /diem-ren-luyen |
| Nhập điểm rèn luyện tự đánh giá | ✅ | DrlSelfEvaluation, /diem-ren-luyen/tu-danh-gia |
| Danh sách chương trình admin đăng, đăng ký | ✅ | Activities, student-activities |
| Xem tiêu chí đánh giá DRL / GPA / điều kiện | ✅ | Trang Tiêu chí DRL + HocBong (dieukien) |
| Xem / sửa hồ sơ cá nhân (lý lịch) | ✅ | Trang Hồ sơ cá nhân, API /users/students/profile/:mssv |
| Tra cứu ngày rèn luyện | ✅ | NrlTracker, /nrl-tracker |
| Xem thông báo và tin tức | ✅ | ThongBao, /thong-bao |
| Xem khen thưởng và kỷ luật | ✅ | KhenThuongKyLuat, /khen-thuong-ky-luat |
| Dịch vụ, làm đơn online | ✅ | DichVu, /dich-vu |
| Xem tiêu chí xét học bổng, ai đã được HB | ✅ | HocBong (dieukien), GET /hoc-bong/:id/recipients |
| Hoạt động của tôi (tham gia chương trình) | ✅ | student-activities, MyActivities / đăng ký hoạt động |

## GIẢNG VIÊN (CVHT)

| Chức năng | Có trong dự án | Ghi chú |
|-----------|----------------|---------|
| Đăng nhập (admin cấp tài khoản) | ✅ | Login staff |
| Xem thông báo và tin tức | ✅ | ThongBao |
| Nhập điểm rèn luyện của SV cho hệ thống | ✅ | Scores, scoreRoutes, /ctsv/diem-ren-luyen |
| Xem / duyệt tự đánh giá DRL của SV | ✅ | DrlClassReview, /giangvien/diem-ren-luyen-tu-danh-gia |
| Quản lý sinh viên trong lớp | ✅ | Trang danh sách SV theo lớp, API /lookup/students-by-class |
| Quản lý nhập điểm, xuất file báo cáo | ✅ | TeacherGrades, grades/export |

## PHÒNG CTSV

| Chức năng | Có trong dự án | Ghi chú |
|-----------|----------------|---------|
| Duyệt đơn từ online (chấp nhận / từ chối) | ✅ | Backend allow ctsv; trang CTSV Duyệt đơn |
| Quản lý ĐRL, ngày RL, điểm GV duyệt, duyệt HB, xuất báo cáo | ✅ | Scores, HocBong, export; có thể mở rộng báo cáo |
| Quản lý SV, khen thưởng kỷ luật, cảnh báo học vụ | ✅ | AdminRewards, KhenThuongKyLuat |
| Nhắc nhở sinh viên | ✅ | CTSV được tạo thông báo; trang Gửi nhắc nhở |

## ADMIN

| Chức năng | Có trong dự án | Ghi chú |
|-----------|----------------|---------|
| Phân quyền / tài khoản | ✅ | AdminUsers |
| Quản lý người dùng | ✅ | AdminUsers |
| Quản lý hoạt động chương trình có điểm RL | ✅ | AdminActivities |
| Báo cáo và thống kê (lớp, khoa, khóa, ngành) | ✅ | API /lookup/report-stats; AdminReports dùng API thật |
| Quản lý môn học | ✅ | AdminCourses |
