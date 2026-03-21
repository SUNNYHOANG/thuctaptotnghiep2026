-- Migration: Mở rộng ENUM loai của bảng thongbao + thêm cột nguoi_nhan
-- Chạy SAU: 06_khoa_role.sql

-- 1. Mở rộng ENUM cột loai để thêm nhacnho_drl và nhacnho_hoso
ALTER TABLE thongbao
  MODIFY COLUMN loai ENUM(
    'truong', 'lop', 'nhacnho', 'lichthi', 'deadline_hocphi', 'khac',
    'nhacnho_drl', 'nhacnho_hoso'
  ) NOT NULL DEFAULT 'khac';

-- 2. Thêm cột nguoi_nhan lưu danh sách MSSV mục tiêu (JSON array)
ALTER TABLE thongbao
  ADD COLUMN nguoi_nhan JSON NULL COMMENT 'Danh sách MSSV nhận thông báo (null = tất cả)';
