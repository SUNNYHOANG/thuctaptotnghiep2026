-- ============================================================
-- CẬP NHẬT TOÀN BỘ DATABASE - HỆ THỐNG QL CÔNG TÁC SV & ĐIỂM RÈN LUYỆN
-- ============================================================
-- Chạy file này 1 lần để tạo/cập nhật toàn bộ database
-- Cách chạy: mysql -u root -p < backend/database/UPDATE_ALL_DATABASE.sql
-- Hoặc: mysql -u root -p dkhp1 < backend/database/UPDATE_ALL_DATABASE.sql
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. Tạo database
CREATE DATABASE IF NOT EXISTS dkhp1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dkhp1;

-- ============================================================
-- PHẦN 1: BẢNG CƠ BẢN (00_base_tables)
-- ============================================================

CREATE TABLE IF NOT EXISTS hocky (
    mahocky INT AUTO_INCREMENT PRIMARY KEY,
    tenhocky VARCHAR(100) NOT NULL,
    namhoc VARCHAR(20) NOT NULL,
    ngaybatdau DATE,
    ngayketthuc DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sinhvien (
    mssv VARCHAR(50) PRIMARY KEY,
    hoten VARCHAR(255) NOT NULL,
    malop VARCHAR(50),
    makhoa VARCHAR(50),
    password VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO hocky (tenhocky, namhoc) VALUES
('Học kỳ 1', '2024-2025'),
('Học kỳ 2', '2024-2025');

INSERT IGNORE INTO sinhvien (mssv, hoten, malop, makhoa, password) VALUES
('20123456', 'Nguyễn Văn A', 'CNTT01', 'CNTT', '123456'),
('20123457', 'Trần Thị B', 'CNTT01', 'CNTT', '123456');

-- ============================================================
-- PHẦN 2: HOẠT ĐỘNG & ĐIỂM RÈN LUYỆN (schema)
-- ============================================================

CREATE TABLE IF NOT EXISTS loaihoatdong (
    maloaihoatdong INT AUTO_INCREMENT PRIMARY KEY,
    tenloai VARCHAR(255) NOT NULL,
    mota TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hoatdong (
    mahoatdong INT AUTO_INCREMENT PRIMARY KEY,
    tenhoatdong VARCHAR(255) NOT NULL,
    maloaihoatdong INT NOT NULL,
    mota TEXT,
    ngaybatdau DATETIME NOT NULL,
    ngayketthuc DATETIME NOT NULL,
    diadiem VARCHAR(255),
    soluongtoida INT DEFAULT 100,
    soluongdadangky INT DEFAULT 0,
    trangthai ENUM('dangmo', 'dangdienra', 'daketthuc', 'huy') DEFAULT 'dangmo',
    nguoitao VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (maloaihoatdong) REFERENCES loaihoatdong(maloaihoatdong) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS thamgiahoatdong (
    mathamgia INT AUTO_INCREMENT PRIMARY KEY,
    mahoatdong INT NOT NULL,
    mssv VARCHAR(50) NOT NULL,
    vaitro ENUM('thamgia', 'tochuc', 'truongnhom') DEFAULT 'thamgia',
    trangthai ENUM('dangky', 'duocduyet', 'tuchoi', 'hoanthanh') DEFAULT 'dangky',
    diemcong INT DEFAULT 0,
    ghichu TEXT,
    ngaydangky TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngayduyet DATETIME,
    nguoiduyet VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mahoatdong) REFERENCES hoatdong(mahoatdong) ON DELETE CASCADE,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    UNIQUE KEY unique_participation (mahoatdong, mssv)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tieuchi_diemrenluyen (
    matieuchi INT AUTO_INCREMENT PRIMARY KEY,
    tentieuchi VARCHAR(255) NOT NULL,
    diemtoida INT NOT NULL DEFAULT 100,
    mota TEXT,
    loaitieuchi ENUM('hoatdong', 'hoc tap', 'ky luat', 'khac') DEFAULT 'hoatdong',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS diemrenluyen (
    madiemrenluyen INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50) NOT NULL,
    mahocky INT NOT NULL,
    diemhoatdong INT DEFAULT 0,
    diemhoctap INT DEFAULT 0,
    diemkyluat INT DEFAULT 0,
    diemtong INT DEFAULT 0,
    xeploai VARCHAR(50),
    ghichu TEXT,
    nguoitao VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE,
    UNIQUE KEY unique_score (mssv, mahocky)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS drl_tudanhgia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50) NOT NULL,
    mahocky INT NOT NULL,
    diem_ythuc_hoc_tap INT DEFAULT 0,
    diem_noi_quy INT DEFAULT 0,
    diem_hoat_dong INT DEFAULT 0,
    diem_cong_dong INT DEFAULT 0,
    diem_khen_thuong_ky_luat INT DEFAULT 0,
    tong_diem INT DEFAULT 0,
    nhan_xet_sv TEXT,
    trangthai ENUM('choduyet','daduyet','bituchoi') DEFAULT 'choduyet',
    diem_cvht INT DEFAULT NULL,
    nhan_xet_cvht TEXT,
    nguoi_duyet VARCHAR(50),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_duyet DATETIME,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE,
    UNIQUE KEY uniq_tudanhgia (mssv, mahocky)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO loaihoatdong (tenloai, mota) VALUES
('Hoạt động tình nguyện', 'Các hoạt động tình nguyện, từ thiện'),
('Hoạt động văn nghệ', 'Các hoạt động văn nghệ, biểu diễn'),
('Hoạt động thể thao', 'Các hoạt động thể thao, thi đấu'),
('Hoạt động học thuật', 'Các hoạt động nghiên cứu, học thuật'),
('Hoạt động xã hội', 'Các hoạt động xã hội khác');

INSERT IGNORE INTO tieuchi_diemrenluyen (tentieuchi, diemtoida, loaitieuchi, mota) VALUES
('Tham gia hoạt động tình nguyện', 20, 'hoatdong', 'Điểm cho việc tham gia các hoạt động tình nguyện'),
('Tham gia hoạt động văn nghệ', 15, 'hoatdong', 'Điểm cho việc tham gia các hoạt động văn nghệ'),
('Tham gia hoạt động thể thao', 15, 'hoatdong', 'Điểm cho việc tham gia các hoạt động thể thao'),
('Tổ chức hoạt động', 20, 'hoatdong', 'Điểm cho việc tổ chức các hoạt động'),
('Điểm học tập', 30, 'hoc tap', 'Điểm dựa trên kết quả học tập'),
('Chấp hành kỷ luật', 20, 'ky luat', 'Điểm về việc chấp hành nội quy, kỷ luật');

-- ============================================================
-- PHẦN 3: MÔN HỌC, GIẢNG VIÊN, LỚP HỌC PHẦN (01_course_tables)
-- ============================================================

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

CREATE TABLE IF NOT EXISTS giangvien (
    magiaovien INT AUTO_INCREMENT PRIMARY KEY,
    hoten VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    sodienthoai VARCHAR(20),
    makhoa VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phonghoc (
    maphong VARCHAR(50) PRIMARY KEY,
    tenphong VARCHAR(100) NOT NULL,
    succhua INT,
    toanha VARCHAR(100),
    ghichu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

-- ============================================================
-- PHẦN 4: ĐIỂM, PHÚC KHẢO, USERS, KHEN THƯỞNG, HỌC BỔNG (02)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    hoten VARCHAR(255),
    role ENUM('admin', 'giangvien', 'ctsv') NOT NULL,
    magiangvien INT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (magiangvien) REFERENCES giangvien(magiaovien) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bangdiem (
    mabangdiem INT AUTO_INCREMENT PRIMARY KEY,
    malophoc INT NOT NULL,
    mssv VARCHAR(50) NOT NULL,
    diemchuyencan DECIMAL(4,2) DEFAULT NULL,
    diemgiuaky DECIMAL(4,2) DEFAULT NULL,
    diemcuoiky DECIMAL(4,2) DEFAULT NULL,
    diemtongket DECIMAL(4,2) DEFAULT NULL,
    gpa DECIMAL(3,2) DEFAULT NULL,
    trangthai ENUM('dangnhap', 'dakhoa') DEFAULT 'dangnhap',
    canhbao VARCHAR(100) DEFAULT NULL,
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

CREATE TABLE IF NOT EXISTS hocbong (
    mahocbong INT AUTO_INCREMENT PRIMARY KEY,
    tenhocbong VARCHAR(255) NOT NULL,
    mahocky INT NOT NULL,
    giatri DECIMAL(12,0) DEFAULT 0,
    dieukien TEXT,
    soluong INT DEFAULT 0,
    hanchot DATE,
    trangthai ENUM('mo', 'dong') DEFAULT 'mo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE
);

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

INSERT IGNORE INTO users (username, password, hoten, role) VALUES
('admin', 'admin123', 'Quản trị viên', 'admin'),
('ctsv', 'ctsv123', 'Phòng CTSV', 'ctsv');

-- ============================================================
-- PHẦN 5: DỊCH VỤ & THÔNG BÁO (03)
-- ============================================================

CREATE TABLE IF NOT EXISTS loai_dichvu (
    maloaidichvu INT AUTO_INCREMENT PRIMARY KEY,
    tendichvu VARCHAR(255) NOT NULL,
    mota TEXT,
    thutu INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dichvu_sinhvien (
    madon INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50) NOT NULL,
    maloaidichvu INT NOT NULL,
    trangthai ENUM('cho', 'dangxuly', 'duyet', 'tuchoi') DEFAULT 'cho',
    noidung_yeucau TEXT,
    ketqua TEXT,
    file_ketqua VARCHAR(500),
    ngaygui TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngayduyet DATETIME,
    nguoiduyet VARCHAR(50),
    ghichu TEXT,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (maloaidichvu) REFERENCES loai_dichvu(maloaidichvu) ON DELETE CASCADE,
    INDEX idx_mssv (mssv),
    INDEX idx_trangthai (trangthai),
    INDEX idx_ngaygui (ngaygui)
);

INSERT IGNORE INTO loai_dichvu (maloaidichvu, tendichvu, mota, thutu) VALUES
(1, 'Giấy xác nhận sinh viên', 'Xác nhận đang theo học tại trường', 1),
(2, 'Bảng điểm', 'Xin bảng điểm học tập', 2),
(3, 'Đăng ký ở KTX', 'Đăng ký nội trú Ký túc xá', 3),
(4, 'Nghỉ học tạm thời', 'Đơn xin nghỉ học tạm thời', 4),
(5, 'Bảo lưu', 'Đơn xin bảo lưu kết quả học tập', 5);

CREATE TABLE IF NOT EXISTS thongbao (
    mathongbao INT AUTO_INCREMENT PRIMARY KEY,
    tieude VARCHAR(500) NOT NULL,
    noidung TEXT,
    loai ENUM('truong', 'lop', 'lichthi', 'deadline_hocphi', 'khac') NOT NULL,
    malop VARCHAR(50),
    mahocky INT,
    han_xem DATE,
    guiemail TINYINT(1) DEFAULT 0,
    nguoitao VARCHAR(50),
    ngaytao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE SET NULL,
    INDEX idx_loai (loai),
    INDEX idx_malop (malop),
    INDEX idx_ngaytao (ngaytao)
);

-- ============================================================
-- PHẦN 6: CẬP NHẬT (04 - Học phí môn học)
-- ============================================================

-- Thêm cột hocphi nếu chưa có (bỏ qua lỗi nếu đã tồn tại)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monhoc' AND COLUMN_NAME = 'hocphi');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE monhoc ADD COLUMN hocphi DECIMAL(12, 0) DEFAULT 0 COMMENT ''Học phí (VND)''', 
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE monhoc SET hocphi = 2220000 WHERE tenmonhoc = 'Cơ sở dữ liệu' AND (hocphi IS NULL OR hocphi = 0);
UPDATE monhoc SET hocphi = 2220000 WHERE tenmonhoc = 'Lập trình Web' AND (hocphi IS NULL OR hocphi = 0);
UPDATE monhoc SET hocphi = 2220000 WHERE tenmonhoc = 'Hệ điều hành' AND (hocphi IS NULL OR hocphi = 0);

-- ============================================================
-- PHẦN 7: CẬP NHẬT (05 - DRL workflow CTSV)
-- ============================================================

-- Thêm cột duyệt CTSV vào drl_tudanhgia
SET @col1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'drl_tudanhgia' AND COLUMN_NAME = 'diem_ctsv');
SET @sql1 = IF(@col1 = 0, 
  'ALTER TABLE drl_tudanhgia ADD COLUMN diem_ctsv INT DEFAULT NULL', 'SELECT 1');
PREPARE st1 FROM @sql1;
EXECUTE st1;
DEALLOCATE PREPARE st1;

SET @col2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'drl_tudanhgia' AND COLUMN_NAME = 'nhan_xet_ctsv');
SET @sql2 = IF(@col2 = 0, 
  'ALTER TABLE drl_tudanhgia ADD COLUMN nhan_xet_ctsv TEXT NULL', 'SELECT 1');
PREPARE st2 FROM @sql2;
EXECUTE st2;
DEALLOCATE PREPARE st2;

SET @col3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'drl_tudanhgia' AND COLUMN_NAME = 'nguoi_duyet_ctsv');
SET @sql3 = IF(@col3 = 0, 
  'ALTER TABLE drl_tudanhgia ADD COLUMN nguoi_duyet_ctsv VARCHAR(50) NULL', 'SELECT 1');
PREPARE st3 FROM @sql3;
EXECUTE st3;
DEALLOCATE PREPARE st3;

SET @col4 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'drl_tudanhgia' AND COLUMN_NAME = 'ngay_duyet_ctsv');
SET @sql4 = IF(@col4 = 0, 
  'ALTER TABLE drl_tudanhgia ADD COLUMN ngay_duyet_ctsv DATETIME NULL', 'SELECT 1');
PREPARE st4 FROM @sql4;
EXECUTE st4;
DEALLOCATE PREPARE st4;

-- Thêm cột status cho users nếu chưa có
SET @col5 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status');
SET @sql5 = IF(@col5 = 0, 
  'ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT ''active''', 'SELECT 1');
PREPARE st5 FROM @sql5;
EXECUTE st5;
DEALLOCATE PREPARE st5;

-- ============================================================
-- HOÀN TẤT
-- ============================================================
SELECT 'Database dkhp1 đã được cập nhật thành công!' AS ket_qua;
