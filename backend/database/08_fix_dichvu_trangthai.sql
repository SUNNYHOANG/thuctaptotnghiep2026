-- Fix ENUM trangthai trong bảng dichvu_sinhvien
-- Schema cũ: ENUM('cho', 'dangxuly', 'duyet', 'tuchoi')
-- Schema mới: ENUM('choduyet', 'dangxuly', 'daduyet', 'tuchoi')

ALTER TABLE dichvu_sinhvien
  MODIFY COLUMN trangthai ENUM('choduyet', 'dangxuly', 'daduyet', 'tuchoi') DEFAULT 'choduyet';

-- Migrate dữ liệu cũ
UPDATE dichvu_sinhvien SET trangthai = 'choduyet' WHERE trangthai = 'cho';
UPDATE dichvu_sinhvien SET trangthai = 'daduyet'  WHERE trangthai = 'duyet';
