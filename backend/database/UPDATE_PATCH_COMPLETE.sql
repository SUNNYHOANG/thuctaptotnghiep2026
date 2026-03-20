-- ============================================================
-- CẬP NHẬT DATABASE - CHẠY TRÊN DB ĐÃ TỒN TẠI
-- ============================================================

-- 1. Thêm trạng thái 'dachot' vào hoatdong
ALTER TABLE hoatdong
MODIFY COLUMN trangthai ENUM('dangmo','dangdienra','daketthuc','huy','dachot') DEFAULT 'dangmo';

-- 2. Đảm bảo loaihoatdong có dữ liệu
INSERT INTO loaihoatdong (tenloai, mota)
SELECT t.tenloai, t.mota FROM (
  SELECT 'Hoạt động tình nguyện' AS tenloai, 'Các hoạt động tình nguyện, từ thiện' AS mota
  UNION ALL SELECT 'Hoạt động văn nghệ', 'Các hoạt động văn nghệ, biểu diễn'
  UNION ALL SELECT 'Hoạt động thể thao', 'Các hoạt động thể thao, thi đấu'
  UNION ALL SELECT 'Hoạt động học thuật', 'Các hoạt động nghiên cứu, học thuật'
  UNION ALL SELECT 'Hoạt động xã hội', 'Các hoạt động xã hội khác'
  UNION ALL SELECT 'CLB', 'Câu lạc bộ'
  UNION ALL SELECT 'Thi đua', 'Các cuộc thi, thi đua'
) t
WHERE NOT EXISTS (SELECT 1 FROM loaihoatdong);

-- ============================================================
-- 3. Bổ sung trường hồ sơ sinh viên (chỉ thêm khi chưa tồn tại)
-- ============================================================

ALTER TABLE sinhvien ADD COLUMN IF NOT EXISTS diachi VARCHAR(255) NULL AFTER makhoa;
ALTER TABLE sinhvien ADD COLUMN IF NOT EXISTS ngaysinh DATE NULL AFTER diachi;
ALTER TABLE sinhvien ADD COLUMN IF NOT EXISTS quequan VARCHAR(255) NULL AFTER ngaysinh;
ALTER TABLE sinhvien ADD COLUMN IF NOT EXISTS tinhtrang VARCHAR(100) NULL DEFAULT 'Đang học' AFTER quequan;
ALTER TABLE sinhvien ADD COLUMN IF NOT EXISTS gioitinh VARCHAR(20) NULL AFTER tinhtrang;
ALTER TABLE sinhvien ADD COLUMN IF NOT EXISTS khoahoc VARCHAR(50) NULL AFTER gioitinh;
ALTER TABLE sinhvien ADD COLUMN IF NOT EXISTS bacdaotao VARCHAR(100) NULL AFTER khoahoc;
ALTER TABLE sinhvien ADD COLUMN IF NOT EXISTS nganh VARCHAR(255) NULL AFTER bacdaotao;

-- ============================================================
-- 4. Đăng ký môn học: thời hạn đăng ký
-- ============================================================

ALTER TABLE lophocphan 
ADD COLUMN IF NOT EXISTS ngaymodangky DATETIME NULL COMMENT 'Thời điểm mở đăng ký';

ALTER TABLE lophocphan 
ADD COLUMN IF NOT EXISTS ngaykhoadangky DATETIME NULL COMMENT 'Hết hạn đăng ký';

-- ============================================================
-- 5. Bảng cấu hình học kỳ đang mở đăng ký
-- ============================================================

CREATE TABLE IF NOT EXISTS config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value VARCHAR(255) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO config (config_key, config_value) 
VALUES ('hocky_dang_mo_dang_ky', NULL)
ON DUPLICATE KEY UPDATE config_key = config_key;

-- ============================================================
SELECT 'UPDATE_PATCH_COMPLETE: Đã cập nhật database hoàn chỉnh.' AS Result;