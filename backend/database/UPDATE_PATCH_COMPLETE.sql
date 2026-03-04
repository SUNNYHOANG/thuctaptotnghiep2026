-- ============================================================
-- CẬP NHẬT DATABASE - CHẠY TRÊN DB ĐÃ TỒN TẠI
-- Áp dụng các thay đổi để hệ thống chạy hoàn chỉnh
-- Chạy: node run-update-patch.js  HOẶC  mysql -u root -p dkhp1 < database/UPDATE_PATCH_COMPLETE.sql
-- ============================================================

-- 1. Thêm trạng thái 'dachot' vào hoatdong (chốt danh sách đăng ký)
ALTER TABLE hoatdong
MODIFY COLUMN trangthai ENUM('dangmo','dangdienra','daketthuc','huy','dachot') DEFAULT 'dangmo';

-- 2. Đảm bảo loaihoatdong có dữ liệu (chỉ thêm khi bảng trống)
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

SELECT '✅ UPDATE_PATCH_COMPLETE: Đã cập nhật database hoàn chỉnh.' AS Result;
