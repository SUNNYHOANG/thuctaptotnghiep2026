-- Migration: Thêm vai trò 'khoa' vào hệ thống
-- Quy trình DRL mới: SV -> GV (bước 1) -> Khoa (bước 2) -> CTSV (bước cuối)

-- 1. Thêm cột makhoa vào bảng users
ALTER TABLE users
  ADD COLUMN makhoa VARCHAR(50) DEFAULT NULL;

-- 2. Mở rộng ENUM role trong bảng users để chấp nhận 'khoa'
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'giangvien', 'ctsv', 'khoa') NOT NULL DEFAULT 'giangvien';

-- 3. Thêm các cột duyệt của Khoa vào bảng drl_tudanhgia
ALTER TABLE drl_tudanhgia
  ADD COLUMN diem_khoa INT DEFAULT NULL,
  ADD COLUMN nhan_xet_khoa TEXT NULL,
  ADD COLUMN nguoi_duyet_khoa VARCHAR(50) NULL,
  ADD COLUMN ngay_duyet_khoa DATETIME NULL;

-- 4. Mở rộng ENUM trangthai trong bảng drl_tudanhgia để chấp nhận 'chokhoaduyet'
ALTER TABLE drl_tudanhgia
  MODIFY COLUMN trangthai ENUM('choduyet', 'daduyet', 'bituchoi', 'chokhoaduyet') NOT NULL DEFAULT 'choduyet';

-- 5. Tạo tài khoản mẫu cho vai trò 'khoa'
-- Mật khẩu mặc định: 123456
-- Mỗi tài khoản gắn với một mã khoa tương ứng trong bảng sinhvien
INSERT INTO users (username, password, hoten, email, role, makhoa, status) VALUES
('khoa_cntt',  '123456', 'Ban Quản Lý Khoa CNTT',  'khoa.cntt@hva.edu.vn',  'khoa', 'CNTT',  'active'),
('khoa_qtkd',  '123456', 'Ban Quản Lý Khoa QTKD',  'khoa.qtkd@hva.edu.vn',  'khoa', 'QTKD',  'active'),
('khoa_dtvt',  '123456', 'Ban Quản Lý Khoa ĐTVT',  'khoa.dtvt@hva.edu.vn',  'khoa', 'DTVT',  'active'),
('khoa_ktck',  '123456', 'Ban Quản Lý Khoa KTCK',  'khoa.ktck@hva.edu.vn',  'khoa', 'KTCK',  'active')
ON DUPLICATE KEY UPDATE makhoa = VALUES(makhoa), status = VALUES(status);
