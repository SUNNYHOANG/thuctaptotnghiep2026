-- Thêm cột học phí vào bảng môn học
ALTER TABLE monhoc ADD COLUMN hocphi DECIMAL(12, 0) DEFAULT 0 COMMENT 'Học phí của môn học (đơn vị: VND)';

-- Cập nhật dữ liệu mẫu
UPDATE monhoc SET hocphi = 2220000 WHERE tenmonhoc = 'Cơ sở dữ liệu';
UPDATE monhoc SET hocphi = 2220000 WHERE tenmonhoc = 'Lập trình Web';
UPDATE monhoc SET hocphi = 2220000 WHERE tenmonhoc = 'Hệ điều hành';
