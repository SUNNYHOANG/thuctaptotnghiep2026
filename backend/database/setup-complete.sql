-- ============================================================
-- SCRIPT THIẾT LẬP DATABASE TOÀN BỘ HỆ THỐNG
-- ============================================================
-- Script này tạo lại toàn bộ database từ đầu
-- Thực hiện lần lượt tất cả các bước

DROP DATABASE IF EXISTS dkhp1;
CREATE DATABASE dkhp1;
USE dkhp1;

-- ============================================================
-- PHẦN 1: BẢNG CƠ BẢN (00_base_tables.sql)
-- ============================================================

-- 1. Khoa (Về cơ bản)
CREATE TABLE IF NOT EXISTS khoa (
    makhoa VARCHAR(50) PRIMARY KEY,
    tenkhoa VARCHAR(255) NOT NULL
);

INSERT INTO khoa (makhoa, tenkhoa) VALUES
('CNTT', 'Công nghệ Thông tin'),
('QTKD', 'Quản trị kinh doanh'),
('KTCS', 'Kỹ thuật Cơ khí');

-- 2. Lớp học (siêu lớp)
CREATE TABLE IF NOT EXISTS lophoc (
    malop VARCHAR(50) PRIMARY KEY,
    tenlop VARCHAR(255) NOT NULL,
    makhoa VARCHAR(50),
    namtuyensinh INT,
    FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
);

INSERT INTO lophoc (malop, tenlop, makhoa, namtuyensinh) VALUES
('CNTT01', 'CNTT K17 Lớp 1', 'CNTT', 2017),
('CNTT02', 'CNTT K17 Lớp 2', 'CNTT', 2017),
('QTKD01', 'QTKD K17 Lớp 1', 'QTKD', 2017);

-- 3. Sinh viên
CREATE TABLE IF NOT EXISTS sinhvien (
    mssv VARCHAR(50) PRIMARY KEY,
    hoten VARCHAR(255) NOT NULL,
    malop VARCHAR(50),
    makhoa VARCHAR(50),
    password VARCHAR(255) DEFAULT '123456',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (malop) REFERENCES lophoc(malop) ON DELETE SET NULL,
    FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
);

INSERT INTO sinhvien (mssv, hoten, malop, makhoa, password) VALUES
('20123456', 'Trần Minh Quân', 'CNTT01', 'CNTT', '123456'),
('20123457', 'Lê Thị Hà', 'CNTT01', 'CNTT', '123456'),
('20123458', 'Nguyễn Văn A', 'CNTT02', 'CNTT', '123456'),
('20123459', 'Phạm Thị B', 'QTKD01', 'QTKD', '123456');

-- 4. Học kỳ
CREATE TABLE IF NOT EXISTS hocky (
    mahocky INT PRIMARY KEY AUTO_INCREMENT,
    tenhocky VARCHAR(50),
    namhoc INT,
    kyhoc INT,
    ngaybd DATE,
    ngaykt DATE
);

INSERT INTO hocky (tenhocky, namhoc, kyhoc, ngaybd, ngaykt) VALUES
('HK1 2023-2024', 2023, 1, '2023-09-01', '2023-12-31'),
('HK2 2023-2024', 2024, 2, '2024-01-01', '2024-05-31');

-- 5. Hoạt động (tạo lại)
CREATE TABLE IF NOT EXISTS hoatdong (
    mahoatdong INT AUTO_INCREMENT PRIMARY KEY,
    tenhoatdong VARCHAR(255) NOT NULL,
    loaihoatdong VARCHAR(100),
    mota TEXT,
    ngaybd DATE,
    ngaykt DATE,
    diadiem VARCHAR(255),
    giangvien_phutrach VARCHAR(100),
    sotiettoithieu INT DEFAULT 0,
    sotiethieu INT DEFAULT 0,
    trangthai ENUM('chophep', 'khongphep') DEFAULT 'chophep'
);

INSERT INTO hoatdong (tenhoatdong, loaihoatdong, mota, ngaybd, ngaykt, diadiem, giangvien_phutrach, sotiettoithieu, sotiethieu) VALUES
('Tham gia CLB Tin học', 'CLB', 'Hoạt động CLB Tin học', '2023-09-01', '2023-12-31', 'Phòng IT', 'TS. Nguyễn Văn C', 10, 5),
('Olympic Toán', 'Thi đua', 'Cuộc thi Olympic Toán học', '2023-10-15', '2023-10-20', 'Hội trường', 'TS. Trần Thị D', 0, 0);

-- 6. Điểm rèn luyện (lộng lẫy - tạo lại)
CREATE TABLE IF NOT EXISTS diem_renluyen (
    madiem INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50) NOT NULL,
    mahocky INT NOT NULL,
    tieuchuan_hanhduc INT DEFAULT 0,
    tieuchuan_hocluc INT DEFAULT 0,
    tieuChuan_thechat INT DEFAULT 0,
    tieuChuan_hoatdong INT DEFAULT 0,
    tong_diem DECIMAL(4,2) DEFAULT 0,
    xeploai VARCHAR(50),
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE,
    UNIQUE KEY unique_diem (mssv, mahocky)
);

INSERT INTO diem_renluyen (mssv, mahocky, tieuchuan_hanhduc, tieuchuan_hocluc, tieuChuan_thechat, tieuChuan_hoatdong, tong_diem, xeploai) VALUES
('20123456', 1, 10, 10, 10, 8, 9.5, 'Xuất sắc'),
('20123457', 1, 9, 8, 9, 7, 8.25, 'Tốt'),
('20123458', 1, 8, 7, 8, 6, 7.25, 'Khá');

-- ============================================================
-- PHẦN 2: BẢNG GIẢNG VIÊN & LỚP HỌC PHẦN
-- ============================================================

-- 1. Bảng Giảng viên
CREATE TABLE IF NOT EXISTS giangvien (
    magiaovien INT AUTO_INCREMENT PRIMARY KEY,
    tengiaovien VARCHAR(255) NOT NULL,
    makhoa VARCHAR(50),
    email VARCHAR(100),
    dienthoai VARCHAR(20),
    FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
);

INSERT INTO giangvien (tengiaovien, makhoa, email, dienthoai) VALUES
('TS. Nguyễn Văn C', 'CNTT', 'nguyenvanc@hva.edu.vn', '0912345678'),
('TS. Trần Thị D', 'CNTT', 'tranthid@hva.edu.vn', '0987654321');

-- 2. Bảng Môn học
CREATE TABLE IF NOT EXISTS monhoc (
    mamonhoc INT AUTO_INCREMENT PRIMARY KEY,
    tenmonhoc VARCHAR(255) NOT NULL,
    sotinchi INT DEFAULT 3,
    mota TEXT,
    makhoa VARCHAR(50),
    FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
);

INSERT INTO monhoc (tenmonhoc, sotinchi, mota, makhoa) VALUES
('Lập Trình C++', 3, 'Học lập trình C++', 'CNTT'),
('Cơ Sở Dữ Liệu', 3, 'Học CSDL', 'CNTT'),
('Kỹ Năng Mềm', 2, 'Phát triển kỹ năng mềm', 'CNTT');

-- 3. Bảng Lớp học phần
CREATE TABLE IF NOT EXISTS lophocphan (
    malophocphan INT AUTO_INCREMENT PRIMARY KEY,
    mamonhoc INT NOT NULL,
    magiaovien INT,
    malop VARCHAR(50),
    mahocky INT,
    thoigian VARCHAR(100),
    phonghoc VARCHAR(50),
    soluongsv INT DEFAULT 0,
    sicham INT DEFAULT 30,
    FOREIGN KEY (mamonhoc) REFERENCES monhoc(mamonhoc) ON DELETE CASCADE,
    FOREIGN KEY (magiaovien) REFERENCES giangvien(magiaovien) ON DELETE SET NULL,
    FOREIGN KEY (malop) REFERENCES lophoc(malop) ON DELETE CASCADE,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE
);

INSERT INTO lophocphan (mamonhoc, magiaovien, malop, mahocky, thoigian, phonghoc, soluongsv) VALUES
(1, 1, 'CNTT01', 1, 'Thứ 2 - 7h30', 'A101', 25),
(2, 2, 'CNTT01', 1, 'Thứ 3 - 9h30', 'A102', 25);

-- 4. Bảng Đăng ký
CREATE TABLE IF NOT EXISTS dangky (
    madangky INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50) NOT NULL,
    malophocphan INT NOT NULL,
    ngaydangky TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trangthai ENUM('dangky', 'daphucdoi', 'dahuy') DEFAULT 'dangky',
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (malophocphan) REFERENCES lophocphan(malophocphan) ON DELETE CASCADE,
    UNIQUE KEY unique_dangky (mssv, malophocphan)
);

INSERT INTO dangky (mssv, malophocphan, trangthai) VALUES
('20123456', 1, 'dangky'),
('20123457', 1, 'dangky'),
('20123458', 2, 'dangky');

-- ============================================================
-- PHẦN 3: BẢNG ADMIN & GIẢNG VIÊN (PHÂN QUYỀN)
-- ============================================================

-- ⚠️ QUAN TRỌNG: Bảng USERS cho admin/giảng viên
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    hoten VARCHAR(255),
    email VARCHAR(100),
    role ENUM('admin', 'giangvien', 'ctsv') NOT NULL,
    magiangvien INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (magiangvien) REFERENCES giangvien(magiaovien) ON DELETE SET NULL
);

-- Thêm dữ liệu ADMIN mẫu
INSERT INTO users (username, password, hoten, email, role, status) VALUES
('admin', 'admin123', 'Quản Trị Viên Hệ Thống', 'admin@hva.edu.vn', 'admin', 'active');

-- Thêm CTSV mẫu
INSERT INTO users (username, password, hoten, email, role, status) VALUES
('ctsv', 'ctsv123', 'Phòng CTSV', 'ctsv@hva.edu.vn', 'ctsv', 'active');

-- Thêm GIẢNG VIÊN mẫu
INSERT INTO users (username, password, hoten, email, role, magiangvien, status) VALUES
('nguyenvanc', 'password123', 'TS. Nguyễn Văn C', 'nguyenvanc@hva.edu.vn', 'giangvien', 1, 'active'),
('tranthid', 'password123', 'TS. Trần Thị D', 'tranthid@hva.edu.vn', 'giangvien', 2, 'active');

-- ============================================================
-- PHẦN 4: BẢNG ĐIỂM & LOG
-- ============================================================

-- Bảng Điểm học phần
CREATE TABLE IF NOT EXISTS bangdiem (
    mabangdiem INT AUTO_INCREMENT PRIMARY KEY,
    malophocphan INT NOT NULL,
    mssv VARCHAR(50) NOT NULL,
    diemchuyencan DECIMAL(4,2) DEFAULT NULL,
    diemgiuaky DECIMAL(4,2) DEFAULT NULL,
    diemcuoiky DECIMAL(4,2) DEFAULT NULL,
    diemtongket DECIMAL(4,2) DEFAULT NULL,
    gpa DECIMAL(3,2) DEFAULT NULL,
    trangthai ENUM('dangnhap', 'dakhoa') DEFAULT 'dangnhap',
    ghichu TEXT,
    nguoinhap VARCHAR(50),
    ngaynhap TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (malophocphan) REFERENCES lophocphan(malophocphan) ON DELETE CASCADE,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    UNIQUE KEY unique_grade (malophocphan, mssv)
);

INSERT INTO bangdiem (malophocphan, mssv, diemchuyencan, diemgiuaky, diemcuoiky, ngaynhap) VALUES
(1, '20123456', 9, 8, 8.5, NOW()),
(1, '20123457', 8, 7, 7.5, NOW()),
(2, '20123458', 9, 9, 9, NOW());

-- Log sửa điểm
CREATE TABLE IF NOT EXISTS log_suadiem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mabangdiem INT NOT NULL,
    loaidiem VARCHAR(30),
    giatricu DECIMAL(4,2),
    giatrimoi DECIMAL(4,2),
    nguoisua VARCHAR(50),
    ngaysua TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mabangdiem) REFERENCES bangdiem(mabangdiem) ON DELETE CASCADE
);

-- ============================================================
-- PHẦN 5: BẢNG HỌC BỔNG, KHEN THƯỞNG, DỊCH VỤ, THÔNG BÁO
-- ============================================================

-- Bảng Học bổng
CREATE TABLE IF NOT EXISTS hocbong (
    mahocbong INT AUTO_INCREMENT PRIMARY KEY,
    tenhocbong VARCHAR(255),
    sotienhocdong DECIMAL(10,2),
    dieukien TEXT,
    mahocky INT,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE
);

-- Bảng Khen thưởng - Kỷ luật
CREATE TABLE IF NOT EXISTS khenthuongkyLuat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50),
    mahocky INT,
    loaiquyetdinh ENUM('khen', 'kyluat') DEFAULT 'khen',
    tenquyetdinh VARCHAR(255),
    chiphoi DECIMAL(10,2),
    ngayqd DATE,
    lydo TEXT,
    trangthaidadoi ENUM('chuadoi', 'dadoi') DEFAULT 'chuadoi',
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE
);

-- Bảng Phúc khảo
CREATE TABLE IF NOT EXISTS phuckaho (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50),
    mabangdiem INT,
    lydo TEXT,
    ngaytaoddon DATE,
    trangthai ENUM('choduyet', 'duathuaban', 'conghoanthoan', 'choidungdan') DEFAULT 'choduyet',
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (mabangdiem) REFERENCES bangdiem(mabangdiem) ON DELETE CASCADE
);

-- Bảng Dịch vụ
CREATE TABLE IF NOT EXISTS dichvu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50),
    tenloaidvu VARCHAR(100),
    noidunghodan TEXT,
    trangthai ENUM('chopheduyet', 'daduyet', 'tuchoi') DEFAULT 'chopheduyet',
    ngaytao DATE,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE
);

-- Bảng Thông báo
CREATE TABLE IF NOT EXISTS thongbao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tieude VARCHAR(255),
    noidung TEXT,
    loai VARCHAR(50),
    malop VARCHAR(50),
    ngaydate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (malop) REFERENCES lophoc(malop) ON DELETE CASCADE
);

-- ============================================================
-- KIỂM TRA - Hiển thị dữ liệu đã tạo
-- ============================================================

SELECT 'Users Table:' as Info;
SELECT * FROM users;

SELECT 'Sinh Viên Table:' as Info;
SELECT * FROM sinhvien;

SELECT 'Giảng Viên Table:' as Info;
SELECT * FROM giangvien;

SELECT '✅ Database đã được thiết lập thành công!' as Result;
