-- Chạy file này TRƯỚC schema.sql (backend cần bảng sinhvien, hocky)
-- Tạo database (chạy 1 lần)
CREATE DATABASE IF NOT EXISTS dkhp1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dkhp1;

-- Bảng học kỳ
CREATE TABLE IF NOT EXISTS hocky (
    mahocky INT AUTO_INCREMENT PRIMARY KEY,
    tenhocky VARCHAR(100) NOT NULL,
    namhoc VARCHAR(20) NOT NULL,
    ngaybatdau DATE,
    ngayketthuc DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng sinh viên
CREATE TABLE IF NOT EXISTS sinhvien (
    mssv VARCHAR(50) PRIMARY KEY,
    hoten VARCHAR(255) NOT NULL,
    malop VARCHAR(50),
    makhoa VARCHAR(50),
    password VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Dữ liệu mẫu
INSERT INTO hocky (tenhocky, namhoc) VALUES
('Học kỳ 1', '2024-2025'),
('Học kỳ 2', '2024-2025')
ON DUPLICATE KEY UPDATE tenhocky = tenhocky;

INSERT INTO sinhvien (mssv, hoten, malop, makhoa, password) VALUES
('20123456', 'Nguyễn Văn A', 'CNTT01', 'CNTT', '123456'),
('20123457', 'Trần Thị B', 'CNTT01', 'CNTT', '123456')
ON DUPLICATE KEY UPDATE hoten = hoten;
