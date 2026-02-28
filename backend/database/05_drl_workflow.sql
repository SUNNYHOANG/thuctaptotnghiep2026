-- DRL workflow v2: SV -> GV (CVHT) -> CTSV (final)
-- Mục tiêu: tách bước "duyệt cuối" của CTSV mà vẫn tương thích schema cũ
-- (trangthai vẫn dùng enum: 'choduyet','daduyet','bituchoi').
--
-- Quy ước workflow:
-- - SV gửi/ cập nhật phiếu: trangthai = 'choduyet'
-- - GV duyệt: trangthai = 'daduyet' (duyệt qua CTSV) hoặc 'bituchoi'
-- - CTSV duyệt cuối: trangthai vẫn 'daduyet' nhưng có nguoi_duyet_ctsv / ngay_duyet_ctsv
-- - CTSV từ chối: trangthai = 'bituchoi' + nhan_xet_ctsv

-- Thêm trường duyệt CTSV (final)
ALTER TABLE drl_tudanhgia
  ADD COLUMN diem_ctsv INT DEFAULT NULL,
  ADD COLUMN nhan_xet_ctsv TEXT NULL,
  ADD COLUMN nguoi_duyet_ctsv VARCHAR(50) NULL,
  ADD COLUMN ngay_duyet_ctsv DATETIME NULL;

