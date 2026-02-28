-- Tạo bảng users cho hệ thống authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hoten VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL COMMENT 'sinhvien, giangvien, admin',
    mssv VARCHAR(50) UNIQUE NULL COMMENT 'Mã sinh viên',
    magiangvien VARCHAR(50) UNIQUE NULL COMMENT 'Mã giảng viên',
    makhoa VARCHAR(50) NULL,
    malop VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo user admin mặc định (password: admin123)
INSERT INTO users (username, password, email, hoten, role) 
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJZzqKZ6u', 'admin@example.com', 'Administrator', 'admin')
ON DUPLICATE KEY UPDATE username=username;
