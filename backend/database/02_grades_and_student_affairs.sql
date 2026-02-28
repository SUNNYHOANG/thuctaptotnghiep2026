-- Quản lý điểm sinh viên & Công tác sinh viên
-- Chạy SAU: 00_base_tables.sql, schema.sql, 01_course_tables.sql

-- Bảng users cho admin/giảng viên (phân quyền)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    hoten VARCHAR(255),
    role ENUM('admin', 'giangvien', 'ctsv') NOT NULL,
    magiangvien INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (magiangvien) REFERENCES giangvien(magiaovien) ON DELETE SET NULL
);

-- ========== 1. QUẢN LÝ ĐIỂM SINH VIÊN ==========

-- Bảng điểm học phần (điểm từng môn/lớp HP)
CREATE TABLE IF NOT EXISTS bangdiem (
    mabangdiem INT AUTO_INCREMENT PRIMARY KEY,
    malophoc INT NOT NULL,
    mssv VARCHAR(50) NOT NULL,
    diemchuyencan DECIMAL(4,2) DEFAULT NULL COMMENT 'Điểm chuyên cần',
    diemgiuaky DECIMAL(4,2) DEFAULT NULL COMMENT 'Điểm giữa kỳ',
    diemcuoiky DECIMAL(4,2) DEFAULT NULL COMMENT 'Điểm cuối kỳ',
    diemtongket DECIMAL(4,2) DEFAULT NULL COMMENT 'Điểm tổng kết (tính tự động)',
    gpa DECIMAL(3,2) DEFAULT NULL COMMENT 'GPA môn (tính tự động)',
    trangthai ENUM('dangnhap', 'dakhoa') DEFAULT 'dangnhap',
    canhbao VARCHAR(100) DEFAULT NULL COMMENT 'Cảnh báo học vụ (nếu có)',
    ghichu TEXT,
    nguoinhap VARCHAR(50),
    ngaynhap TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngaykhoa DATETIME,
    FOREIGN KEY (malophoc) REFERENCES lophoc(malophoc) ON DELETE CASCADE,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    UNIQUE KEY unique_grade (malophoc, mssv),
    INDEX idx_mssv (mssv),
    INDEX idx_malophoc (malophoc)
);

-- Log sửa điểm
CREATE TABLE IF NOT EXISTS log_suadiem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mabangdiem INT NOT NULL,
    loaidiem VARCHAR(30) NOT NULL,
    giatricu DECIMAL(4,2),
    giatrimoi DECIMAL(4,2),
    nguoisua VARCHAR(50) NOT NULL,
    ngaysua TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lydo TEXT,
    FOREIGN KEY (mabangdiem) REFERENCES bangdiem(mabangdiem) ON DELETE CASCADE
);

-- Đơn phúc khảo
CREATE TABLE IF NOT EXISTS phuckhao (
    maphuckhao INT AUTO_INCREMENT PRIMARY KEY,
    mabangdiem INT NOT NULL,
    mssv VARCHAR(50) NOT NULL,
    malophoc INT NOT NULL,
    lydo TEXT NOT NULL,
    trangthai ENUM('cho', 'dangxuly', 'chapnhan', 'tuchoi') DEFAULT 'cho',
    ketqua TEXT,
    nguoiduyet VARCHAR(50),
    ngayduyet DATETIME,
    ngaygui TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mabangdiem) REFERENCES bangdiem(mabangdiem) ON DELETE CASCADE,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (malophoc) REFERENCES lophoc(malophoc) ON DELETE CASCADE
);

-- ========== 2. CÔNG TÁC SINH VIÊN ==========

-- Khen thưởng - Kỷ luật - Cảnh cáo
CREATE TABLE IF NOT EXISTS khenthuong_kyluat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50) NOT NULL,
    mahocky INT NOT NULL,
    loai ENUM('khenthuong', 'kyluat', 'canhcao') NOT NULL,
    noidung TEXT NOT NULL,
    hinhthuc VARCHAR(255),
    soquyetdinh VARCHAR(100),
    ngayquyetdinh DATE,
    nguoilap VARCHAR(50),
    ghichu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE,
    INDEX idx_mssv (mssv),
    INDEX idx_mahocky (mahocky)
);

-- Danh mục học bổng
CREATE TABLE IF NOT EXISTS hocbong (
    mahocbong INT AUTO_INCREMENT PRIMARY KEY,
    tenhocbong VARCHAR(255) NOT NULL,
    mahocky INT NOT NULL,
    giatri DECIMAL(12,0) DEFAULT 0,
    dieukien TEXT COMMENT 'Điều kiện xét học bổng',
    soluong INT DEFAULT 0,
    hanchot DATE,
    trangthai ENUM('mo', 'dong') DEFAULT 'mo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE
);

-- Sinh viên nhận học bổng
CREATE TABLE IF NOT EXISTS sinhvien_hocbong (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50) NOT NULL,
    mahocbong INT NOT NULL,
    trangthai ENUM('duyet', 'tuchoi') DEFAULT 'duyet',
    ngayxet DATE,
    nguoixet VARCHAR(50),
    ghichu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (mahocbong) REFERENCES hocbong(mahocbong) ON DELETE CASCADE,
    UNIQUE KEY unique_student_scholarship (mssv, mahocbong)
);

-- Admin mặc định (username: admin, password: admin123)
INSERT IGNORE INTO users (username, password, hoten, role) VALUES
('admin', 'admin123', 'Quản trị viên', 'admin');

-- CTSV mặc định (username: ctsv, password: ctsv123)
INSERT IGNORE INTO users (username, password, hoten, role) VALUES
('ctsv', 'ctsv123', 'Phòng CTSV', 'ctsv');
