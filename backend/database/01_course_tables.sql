-- Bảng môn học, giảng viên, phòng, lớp học phần, đăng ký học phần
-- Chạy SAU: 00_base_tables.sql và schema.sql (cần sinhvien, hocky)

-- Bảng môn học
CREATE TABLE IF NOT EXISTS monhoc (
    mamonhoc INT AUTO_INCREMENT PRIMARY KEY,
    tenmonhoc VARCHAR(255) NOT NULL,
    sotinchi INT NOT NULL DEFAULT 3,
    makhoa VARCHAR(50),
    mota TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_makhoa (makhoa)
);

-- Bảng giảng viên
CREATE TABLE IF NOT EXISTS giangvien (
    magiaovien INT AUTO_INCREMENT PRIMARY KEY,
    hoten VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    sodienthoai VARCHAR(20),
    makhoa VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng phòng học
CREATE TABLE IF NOT EXISTS phonghoc (
    maphong VARCHAR(50) PRIMARY KEY,
    tenphong VARCHAR(100) NOT NULL,
    succhua INT,
    toanha VARCHAR(100),
    ghichu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng lớp học phần
CREATE TABLE IF NOT EXISTS lophoc (
    malophoc INT AUTO_INCREMENT PRIMARY KEY,
    mamonhoc INT NOT NULL,
    mahocky INT NOT NULL,
    magiaovien INT,
    maphong VARCHAR(50),
    lichhoc VARCHAR(255) NOT NULL,
    sogiohoc INT,
    soluongtoida INT DEFAULT 60,
    soluongdadangky INT DEFAULT 0,
    trangthai ENUM('dangmo', 'dong', 'huy') DEFAULT 'dangmo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mamonhoc) REFERENCES monhoc(mamonhoc) ON DELETE CASCADE,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE,
    FOREIGN KEY (magiaovien) REFERENCES giangvien(magiaovien) ON DELETE SET NULL,
    FOREIGN KEY (maphong) REFERENCES phonghoc(maphong) ON DELETE SET NULL,
    INDEX idx_mahocky (mahocky),
    INDEX idx_mamonhoc (mamonhoc)
);

-- Bảng đăng ký học phần
CREATE TABLE IF NOT EXISTS dangkyhocphan (
    madangky INT AUTO_INCREMENT PRIMARY KEY,
    malophoc INT NOT NULL,
    mssv VARCHAR(50) NOT NULL,
    trangthai ENUM('dangky', 'huy') DEFAULT 'dangky',
    ngaydangky TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ghichu TEXT,
    FOREIGN KEY (malophoc) REFERENCES lophoc(malophoc) ON DELETE CASCADE,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (malophoc, mssv),
    INDEX idx_mssv (mssv),
    INDEX idx_malophoc (malophoc)
);

-- Dữ liệu mẫu (chạy 1 lần; nếu đã có thì bỏ qua hoặc xóa dòng INSERT)
INSERT IGNORE INTO monhoc (mamonhoc, tenmonhoc, sotinchi, makhoa) VALUES
(1, 'Cơ sở dữ liệu', 3, 'CNTT'),
(2, 'Lập trình Web', 3, 'CNTT'),
(3, 'Hệ điều hành', 3, 'CNTT');

INSERT IGNORE INTO giangvien (magiaovien, hoten, email, makhoa) VALUES
(1, 'TS. Nguyễn Văn Giảng', 'giang@university.edu', 'CNTT'),
(2, 'ThS. Trần Thị Dạy', 'day@university.edu', 'CNTT');

INSERT IGNORE INTO phonghoc (maphong, tenphong, succhua, toanha) VALUES
('P101', 'Phòng 101', 60, 'A'),
('P102', 'Phòng 102', 60, 'A'),
('P201', 'Phòng 201', 40, 'B');

-- Lớp học phần (chạy sau khi đã có hocky mahocky=1 từ 00_base_tables.sql; chỉ chạy 1 lần)
INSERT INTO lophoc (mamonhoc, mahocky, magiaovien, maphong, lichhoc, sogiohoc, soluongtoida, trangthai)
VALUES (1, 1, 1, 'P101', 'Thứ 2, 4 - Tiết 1-3', 45, 60, 'dangmo'),
       (2, 1, 2, 'P102', 'Thứ 3, 5 - Tiết 4-6', 45, 60, 'dangmo');
