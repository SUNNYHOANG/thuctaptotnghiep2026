-- ============================================================
-- SETUP_COMPLETE.sql
-- HỆ THỐNG QUẢN LÝ SINH VIÊN - DATABASE HOÀN CHỈNH
-- Phiên bản: 2.0 (gộp toàn bộ migration)
-- Chạy file này để khởi tạo toàn bộ database từ đầu
-- ============================================================

CREATE DATABASE IF NOT EXISTS dkhp1
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dkhp1;

-- ============================================================
-- PHẦN 1: DANH MỤC / LOOKUP TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS khoa (
    makhoa     VARCHAR(50) PRIMARY KEY,
    tenkhoa    VARCHAR(255) NOT NULL
);

INSERT INTO khoa (makhoa, tenkhoa) VALUES
('CNTT', 'Công nghệ Thông tin'),
('QTKD', 'Quản trị Kinh doanh'),
('DTVT', 'Điện tử Viễn thông'),
('KTCK', 'Kỹ thuật Cơ khí')
ON DUPLICATE KEY UPDATE tenkhoa = VALUES(tenkhoa);

-- ============================================================
-- PHẦN 2: LỚP HÀNH CHÍNH
-- ============================================================

CREATE TABLE IF NOT EXISTS lophanhchinh (
    malop          VARCHAR(50) PRIMARY KEY,
    tenlop         VARCHAR(255) NOT NULL,
    makhoa         VARCHAR(50),
    namtuyensinh   INT,
    FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
);

INSERT INTO lophanhchinh (malop, tenlop, makhoa, namtuyensinh) VALUES
('CNTT01', 'CNTT K17 Lớp 1', 'CNTT', 2017),
('CNTT02', 'CNTT K17 Lớp 2', 'CNTT', 2017),
('QTKD01', 'QTKD K17 Lớp 1', 'QTKD', 2017)
ON DUPLICATE KEY UPDATE tenlop = VALUES(tenlop);


-- ============================================================
-- PHẦN 3: SINH VIÊN
-- ============================================================

CREATE TABLE IF NOT EXISTS sinhvien (
    mssv        VARCHAR(50) PRIMARY KEY,
    hoten       VARCHAR(255) NOT NULL,
    malop       VARCHAR(50),
    makhoa      VARCHAR(50),
    diachi      VARCHAR(255) DEFAULT NULL,
    ngaysinh    DATE DEFAULT NULL,
    quequan     VARCHAR(255) DEFAULT NULL,
    tinhtrang   VARCHAR(100) DEFAULT 'Đang học',
    gioitinh    VARCHAR(20)  DEFAULT NULL,
    khoahoc     VARCHAR(50)  DEFAULT NULL,
    bacdaotao   VARCHAR(100) DEFAULT NULL,
    nganh       VARCHAR(255) DEFAULT NULL,
    password    VARCHAR(255) DEFAULT '123456',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (malop)  REFERENCES lophanhchinh(malop) ON DELETE SET NULL,
    FOREIGN KEY (makhoa) REFERENCES khoa(makhoa)        ON DELETE SET NULL
);

INSERT INTO sinhvien (mssv, hoten, malop, makhoa, password) VALUES
('20123456', 'Trần Minh Quân', 'CNTT01', 'CNTT', '123456'),
('20123457', 'Lê Thị Hà',      'CNTT01', 'CNTT', '123456'),
('20123458', 'Nguyễn Văn A',   'CNTT02', 'CNTT', '123456'),
('20123459', 'Phạm Thị B',     'QTKD01', 'QTKD', '123456')
ON DUPLICATE KEY UPDATE hoten = VALUES(hoten);

-- ============================================================
-- PHẦN 4: GIẢNG VIÊN
-- ============================================================

CREATE TABLE IF NOT EXISTS giangvien (
    magiaovien   INT AUTO_INCREMENT PRIMARY KEY,
    hoten        VARCHAR(255) NOT NULL,
    makhoa       VARCHAR(50),
    email        VARCHAR(100),
    sodienthoai  VARCHAR(20),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
);

INSERT INTO giangvien (hoten, makhoa, email, sodienthoai) VALUES
('TS. Nguyễn Văn C', 'CNTT', 'nguyenvanc@hva.edu.vn', '0912345678'),
('TS. Trần Thị D',   'CNTT', 'tranthid@hva.edu.vn',   '0987654321');


-- ============================================================
-- PHẦN 5: USERS (admin / giangvien / ctsv / khoa)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(50) UNIQUE NOT NULL,
    password     VARCHAR(255) NOT NULL,
    hoten        VARCHAR(255),
    email        VARCHAR(100),
    role         ENUM('admin','giangvien','ctsv','khoa') NOT NULL DEFAULT 'giangvien',
    makhoa       VARCHAR(50) DEFAULT NULL,
    magiaovien   INT DEFAULT NULL,
    status       ENUM('active','inactive') DEFAULT 'active',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (magiaovien) REFERENCES giangvien(magiaovien) ON DELETE SET NULL
);

INSERT INTO users (username, password, hoten, email, role, makhoa, status) VALUES
('admin',      'admin123',    'Quản Trị Viên',          'admin@hva.edu.vn',      'admin',     NULL,   'active'),
('ctsv',       'ctsv123',     'Phòng CTSV',             'ctsv@hva.edu.vn',       'ctsv',      NULL,   'active'),
('nguyenvanc', 'password123', 'TS. Nguyễn Văn C',       'nguyenvanc@hva.edu.vn', 'giangvien', NULL,   'active'),
('tranthid',   'password123', 'TS. Trần Thị D',         'tranthid@hva.edu.vn',   'giangvien', NULL,   'active'),
('khoa_cntt',  '123456',      'Ban Quản Lý Khoa CNTT',  'khoa.cntt@hva.edu.vn',  'khoa',      'CNTT', 'active'),
('khoa_qtkd',  '123456',      'Ban Quản Lý Khoa QTKD',  'khoa.qtkd@hva.edu.vn',  'khoa',      'QTKD', 'active'),
('khoa_dtvt',  '123456',      'Ban Quản Lý Khoa ĐTVT',  'khoa.dtvt@hva.edu.vn',  'khoa',      'DTVT', 'active'),
('khoa_ktck',  '123456',      'Ban Quản Lý Khoa KTCK',  'khoa.ktck@hva.edu.vn',  'khoa',      'KTCK', 'active')
ON DUPLICATE KEY UPDATE
    hoten = VALUES(hoten),
    role  = VALUES(role),
    makhoa = VALUES(makhoa),
    status = VALUES(status);

-- Liên kết users ↔ giangvien
UPDATE users SET magiaovien = 1 WHERE username = 'nguyenvanc' AND magiaovien IS NULL;
UPDATE users SET magiaovien = 2 WHERE username = 'tranthid'   AND magiaovien IS NULL;


-- ============================================================
-- PHẦN 6: HỌC KỲ
-- ============================================================

CREATE TABLE IF NOT EXISTS hocky (
    mahocky     INT AUTO_INCREMENT PRIMARY KEY,
    tenhocky    VARCHAR(100) NOT NULL,
    namhoc      VARCHAR(20) NOT NULL,
    kyhoc       INT DEFAULT NULL COMMENT '1 hoặc 2',
    ngaybatdau  DATE,
    ngayketthuc DATE,
    trangthai   ENUM('chuamo','dangmo','dadong') NOT NULL DEFAULT 'chuamo',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO hocky (tenhocky, namhoc, kyhoc, ngaybatdau, ngayketthuc, trangthai) VALUES
('HK1 2023-2024', '2023-2024', 1, '2023-09-01', '2023-12-31', 'dadong'),
('HK2 2023-2024', '2023-2024', 2, '2024-01-01', '2024-05-31', 'dadong'),
('HK1 2024-2025', '2024-2025', 1, '2024-09-01', '2024-12-31', 'dadong'),
('HK2 2024-2025', '2024-2025', 2, '2025-01-01', '2025-05-31', 'dangmo');

-- ============================================================
-- PHẦN 7: MÔN HỌC, PHÒNG HỌC, LỚP HỌC PHẦN, ĐĂNG KÝ
-- ============================================================

CREATE TABLE IF NOT EXISTS monhoc (
    mamonhoc   INT AUTO_INCREMENT PRIMARY KEY,
    tenmonhoc  VARCHAR(255) NOT NULL,
    sotinchi   INT NOT NULL DEFAULT 3,
    makhoa     VARCHAR(50),
    mota       TEXT,
    hocphi     DECIMAL(12,0) DEFAULT 0 COMMENT 'Học phí (VND)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL,
    INDEX idx_makhoa (makhoa)
);

INSERT INTO monhoc (tenmonhoc, sotinchi, makhoa, mota, hocphi) VALUES
('Lập Trình C++',  3, 'CNTT', 'Học lập trình C++',       2220000),
('Cơ Sở Dữ Liệu',  3, 'CNTT', 'Học cơ sở dữ liệu',       2220000),
('Lập Trình Web',  3, 'CNTT', 'Học lập trình Web',        2220000),
('Hệ Điều Hành',   3, 'CNTT', 'Học hệ điều hành',         2220000),
('Kỹ Năng Mềm',    2, 'CNTT', 'Phát triển kỹ năng mềm',  1480000);

CREATE TABLE IF NOT EXISTS phonghoc (
    maphong    VARCHAR(50) PRIMARY KEY,
    tenphong   VARCHAR(100) NOT NULL,
    succhua    INT DEFAULT 60,
    toanha     VARCHAR(100),
    ghichu     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO phonghoc (maphong, tenphong, succhua, toanha) VALUES
('A101', 'Phòng A101', 60, 'A'),
('A102', 'Phòng A102', 60, 'A'),
('B201', 'Phòng B201', 40, 'B')
ON DUPLICATE KEY UPDATE tenphong = VALUES(tenphong);


CREATE TABLE IF NOT EXISTS lophocphan (
    malophocphan    INT AUTO_INCREMENT PRIMARY KEY,
    mamonhoc        INT NOT NULL,
    mahocky         INT NOT NULL,
    magiaovien      INT DEFAULT NULL,
    maphong         VARCHAR(50) DEFAULT NULL,
    lichhoc         VARCHAR(255) NOT NULL,
    sogiohoc        INT DEFAULT NULL,
    soluongtoida    INT DEFAULT 60,
    soluongdadangky INT DEFAULT 0,
    trangthai       ENUM('dangmo','dong','huy') DEFAULT 'dangmo',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mamonhoc)   REFERENCES monhoc(mamonhoc)      ON DELETE CASCADE,
    FOREIGN KEY (mahocky)    REFERENCES hocky(mahocky)        ON DELETE CASCADE,
    FOREIGN KEY (magiaovien) REFERENCES giangvien(magiaovien) ON DELETE SET NULL,
    FOREIGN KEY (maphong)    REFERENCES phonghoc(maphong)     ON DELETE SET NULL,
    INDEX idx_mahocky  (mahocky),
    INDEX idx_mamonhoc (mamonhoc)
);

INSERT INTO lophocphan (mamonhoc, mahocky, magiaovien, maphong, lichhoc, sogiohoc, soluongtoida) VALUES
(1, 1, 1, 'A101', 'Thứ 2 - 7h30',  45, 60),
(2, 1, 2, 'A102', 'Thứ 3 - 9h30',  45, 60),
(3, 3, 1, 'B201', 'Thứ 4 - 13h30', 45, 40);

CREATE TABLE IF NOT EXISTS dangkyhocphan (
    madangky     INT AUTO_INCREMENT PRIMARY KEY,
    mssv         VARCHAR(50) NOT NULL,
    malophocphan INT NOT NULL,
    trangthai    ENUM('dangky','huy') DEFAULT 'dangky',
    ngaydangky   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ghichu       TEXT,
    FOREIGN KEY (mssv)         REFERENCES sinhvien(mssv)           ON DELETE CASCADE,
    FOREIGN KEY (malophocphan) REFERENCES lophocphan(malophocphan)  ON DELETE CASCADE,
    UNIQUE KEY unique_dangky (mssv, malophocphan),
    INDEX idx_mssv         (mssv),
    INDEX idx_malophocphan (malophocphan)
);

INSERT INTO dangkyhocphan (mssv, malophocphan) VALUES
('20123456', 1),
('20123457', 1),
('20123458', 2)
ON DUPLICATE KEY UPDATE trangthai = VALUES(trangthai);

CREATE TABLE IF NOT EXISTS hocphi_payments (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    mssv         VARCHAR(50) NOT NULL,
    malophocphan INT NOT NULL,
    amount       DECIMAL(12,0) NOT NULL,
    paid_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fee_enrollment (mssv, malophocphan),
    INDEX idx_mssv         (mssv),
    INDEX idx_malophocphan (malophocphan),
    FOREIGN KEY (mssv)         REFERENCES sinhvien(mssv)           ON DELETE CASCADE,
    FOREIGN KEY (malophocphan) REFERENCES lophocphan(malophocphan)  ON DELETE CASCADE
);


-- ============================================================
-- PHẦN 8: QUẢN LÝ ĐIỂM
-- ============================================================

CREATE TABLE IF NOT EXISTS bangdiem (
    mabangdiem     INT AUTO_INCREMENT PRIMARY KEY,
    malophocphan   INT NOT NULL,
    mssv           VARCHAR(50) NOT NULL,
    diemchuyencan  DECIMAL(4,2) DEFAULT NULL,
    diemgiuaky     DECIMAL(4,2) DEFAULT NULL,
    diemcuoiky     DECIMAL(4,2) DEFAULT NULL,
    diemtongket    DECIMAL(4,2) DEFAULT NULL,
    gpa            DECIMAL(3,2) DEFAULT NULL,
    trangthai      ENUM('dangnhap','dakhoa') DEFAULT 'dangnhap',
    canhbao        VARCHAR(100) DEFAULT NULL,
    ghichu         TEXT,
    nguoinhap      VARCHAR(50),
    ngaynhap       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngaykhoa       DATETIME DEFAULT NULL,
    FOREIGN KEY (malophocphan) REFERENCES lophocphan(malophocphan) ON DELETE CASCADE,
    FOREIGN KEY (mssv)         REFERENCES sinhvien(mssv)           ON DELETE CASCADE,
    UNIQUE KEY unique_grade    (malophocphan, mssv),
    INDEX idx_mssv         (mssv),
    INDEX idx_malophocphan (malophocphan)
);

INSERT INTO bangdiem (malophocphan, mssv, diemchuyencan, diemgiuaky, diemcuoiky) VALUES
(1, '20123456', 9.0, 8.0, 8.5),
(1, '20123457', 8.0, 7.0, 7.5),
(2, '20123458', 9.0, 9.0, 9.0)
ON DUPLICATE KEY UPDATE diemcuoiky = VALUES(diemcuoiky);

CREATE TABLE IF NOT EXISTS log_suadiem (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    mabangdiem   INT NOT NULL,
    loaidiem     VARCHAR(30) NOT NULL,
    giatricu     DECIMAL(4,2),
    giatrimoi    DECIMAL(4,2),
    nguoisua     VARCHAR(50) NOT NULL,
    ngaysua      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lydo         TEXT,
    FOREIGN KEY (mabangdiem) REFERENCES bangdiem(mabangdiem) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS phuckhao (
    maphuckhao   INT AUTO_INCREMENT PRIMARY KEY,
    mabangdiem   INT NOT NULL,
    mssv         VARCHAR(50) NOT NULL,
    malophocphan INT NOT NULL,
    lydo         TEXT NOT NULL,
    trangthai    ENUM('cho','dangxuly','chapnhan','tuchoi') DEFAULT 'cho',
    ketqua       TEXT,
    nguoiduyet   VARCHAR(50),
    ngayduyet    DATETIME,
    ngaygui      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mabangdiem)   REFERENCES bangdiem(mabangdiem)       ON DELETE CASCADE,
    FOREIGN KEY (mssv)         REFERENCES sinhvien(mssv)             ON DELETE CASCADE,
    FOREIGN KEY (malophocphan) REFERENCES lophocphan(malophocphan)   ON DELETE CASCADE
);


-- ============================================================
-- PHẦN 9: HOẠT ĐỘNG & ĐIỂM RÈN LUYỆN
-- ============================================================

CREATE TABLE IF NOT EXISTS loaihoatdong (
    maloaihoatdong INT AUTO_INCREMENT PRIMARY KEY,
    tenloai        VARCHAR(255) NOT NULL,
    mota           TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO loaihoatdong (tenloai, mota) VALUES
('Hoạt động tình nguyện', 'Các hoạt động tình nguyện, từ thiện'),
('Hoạt động văn nghệ',    'Các hoạt động văn nghệ, biểu diễn'),
('Hoạt động thể thao',    'Các hoạt động thể thao, thi đấu'),
('Hoạt động học thuật',   'Các hoạt động nghiên cứu, học thuật'),
('Hoạt động xã hội',      'Các hoạt động xã hội khác'),
('CLB',                   'Câu lạc bộ'),
('Thi đua',               'Các cuộc thi, thi đua');

CREATE TABLE IF NOT EXISTS hoatdong (
    mahoatdong      INT AUTO_INCREMENT PRIMARY KEY,
    tenhoatdong     VARCHAR(255) NOT NULL,
    maloaihoatdong  INT NOT NULL,
    mota            TEXT,
    ngaybatdau      DATETIME NOT NULL,
    ngayketthuc     DATETIME NOT NULL,
    diadiem         VARCHAR(255),
    magiaovien_pt   INT DEFAULT NULL COMMENT 'Giảng viên phụ trách',
    soluongtoida    INT DEFAULT 100,
    soluongdadangky INT DEFAULT 0,
    trangthai       ENUM('dangmo','dangdienra','daketthuc','huy','dachot') DEFAULT 'dangmo',
    nguoitao        VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (maloaihoatdong) REFERENCES loaihoatdong(maloaihoatdong) ON DELETE CASCADE,
    FOREIGN KEY (magiaovien_pt)  REFERENCES giangvien(magiaovien)        ON DELETE SET NULL
);

INSERT INTO hoatdong (tenhoatdong, maloaihoatdong, mota, ngaybatdau, ngayketthuc, diadiem, magiaovien_pt) VALUES
('Tham gia CLB Tin học', 6, 'Hoạt động CLB Tin học', '2023-09-01', '2023-12-31', 'Phòng IT',   1),
('Olympic Toán',         7, 'Cuộc thi Olympic Toán', '2023-10-15', '2023-10-20', 'Hội trường', 2);

CREATE TABLE IF NOT EXISTS thamgiahoatdong (
    mathamgia    INT AUTO_INCREMENT PRIMARY KEY,
    mahoatdong   INT NOT NULL,
    mssv         VARCHAR(50) NOT NULL,
    vaitro       ENUM('thamgia','tochuc','truongnhom') DEFAULT 'thamgia',
    trangthai    ENUM('dangky','duocduyet','tuchoi','hoanthanh') DEFAULT 'dangky',
    diemcong     INT DEFAULT 0,
    ghichu       TEXT,
    ngaydangky   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngayduyet    DATETIME,
    nguoiduyet   VARCHAR(50),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mahoatdong) REFERENCES hoatdong(mahoatdong) ON DELETE CASCADE,
    FOREIGN KEY (mssv)       REFERENCES sinhvien(mssv)       ON DELETE CASCADE,
    UNIQUE KEY unique_participation (mahoatdong, mssv)
);


-- ============================================================
-- PHẦN 10: TIÊU CHÍ & TỰ ĐÁNH GIÁ DRL
-- ============================================================

CREATE TABLE IF NOT EXISTS tieuchi_diemrenluyen (
    matieuchi   INT AUTO_INCREMENT PRIMARY KEY,
    tentieuchi  VARCHAR(255) NOT NULL,
    diemtoida   INT NOT NULL DEFAULT 100,
    loaitieuchi ENUM('hoatdong','hoc_tap','ky_luat','khac') DEFAULT 'hoatdong',
    mota        TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO tieuchi_diemrenluyen (tentieuchi, diemtoida, loaitieuchi, mota) VALUES
('Tham gia hoạt động tình nguyện', 20, 'hoatdong', 'Điểm tham gia tình nguyện'),
('Tham gia hoạt động văn nghệ',    15, 'hoatdong', 'Điểm tham gia văn nghệ'),
('Tham gia hoạt động thể thao',    15, 'hoatdong', 'Điểm tham gia thể thao'),
('Tổ chức hoạt động',              20, 'hoatdong', 'Điểm tổ chức hoạt động'),
('Điểm học tập',                   30, 'hoc_tap',  'Điểm dựa trên kết quả học tập'),
('Chấp hành kỷ luật',              20, 'ky_luat',  'Điểm chấp hành nội quy');

-- Quy trình DRL: SV → GV/CVHT → Khoa → CTSV (duyệt cuối)
CREATE TABLE IF NOT EXISTS drl_tudanhgia (
    id                        INT AUTO_INCREMENT PRIMARY KEY,
    mssv                      VARCHAR(50) NOT NULL,
    mahocky                   INT NOT NULL,
    -- Điểm SV tự chấm
    diem_ythuc_hoc_tap        INT DEFAULT 0,
    diem_noi_quy              INT DEFAULT 0,
    diem_hoat_dong            INT DEFAULT 0,
    diem_cong_dong            INT DEFAULT 0,
    diem_khen_thuong_ky_luat  INT DEFAULT 0,
    tong_diem                 INT DEFAULT 0,
    nhan_xet_sv               TEXT,
    -- Bước 1: GV / CVHT duyệt
    diem_cvht                 INT DEFAULT NULL,
    nhan_xet_cvht             TEXT,
    nguoi_duyet_cvht          VARCHAR(50),
    ngay_duyet_cvht           DATETIME,
    -- Bước 2: Khoa duyệt
    diem_khoa                 INT DEFAULT NULL,
    nhan_xet_khoa             TEXT,
    nguoi_duyet_khoa          VARCHAR(50),
    ngay_duyet_khoa           DATETIME,
    -- Bước 3: CTSV duyệt cuối
    diem_ctsv                 INT DEFAULT NULL,
    nhan_xet_ctsv             TEXT,
    nguoi_duyet_ctsv          VARCHAR(50),
    ngay_duyet_ctsv           DATETIME,
    -- Trạng thái: choduyet → chokhoaduyet → daduyet / bituchoi
    trangthai                 ENUM('choduyet','chokhoaduyet','daduyet','bituchoi') NOT NULL DEFAULT 'choduyet',
    ngay_tao                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mssv)    REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE,
    UNIQUE KEY uniq_tudanhgia (mssv, mahocky)
);

CREATE TABLE IF NOT EXISTS diemrenluyen (
    madiemrenluyen INT AUTO_INCREMENT PRIMARY KEY,
    mssv           VARCHAR(50) NOT NULL,
    mahocky        INT NOT NULL,
    diemhoatdong   INT DEFAULT 0,
    diemhoctap     INT DEFAULT 0,
    diemkyluat     INT DEFAULT 0,
    diemtong       INT DEFAULT 0,
    xeploai        VARCHAR(50),
    ghichu         TEXT,
    nguoitao       VARCHAR(50),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mssv)    REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE,
    UNIQUE KEY unique_score (mssv, mahocky)
);


-- ============================================================
-- PHẦN 11: CÔNG TÁC SINH VIÊN (Khen thưởng, Học bổng)
-- ============================================================

CREATE TABLE IF NOT EXISTS khenthuong_kyluat (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    mssv             VARCHAR(50) NOT NULL,
    mahocky          INT NOT NULL,
    loai             ENUM('khenthuong','kyluat','canhcao') NOT NULL,
    noidung          TEXT NOT NULL,
    hinhthuc         VARCHAR(255),
    soquyetdinh      VARCHAR(100),
    ngayquyetdinh    DATE,
    nguoilap         VARCHAR(50),
    ghichu           TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mssv)    REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE,
    INDEX idx_mssv    (mssv),
    INDEX idx_mahocky (mahocky)
);

CREATE TABLE IF NOT EXISTS hocbong (
    mahocbong   INT AUTO_INCREMENT PRIMARY KEY,
    tenhocbong  VARCHAR(255) NOT NULL,
    mahocky     INT NOT NULL,
    giatri      DECIMAL(12,0) DEFAULT 0,
    dieukien    TEXT,
    soluong     INT DEFAULT 0,
    hanchot     DATE,
    trangthai   ENUM('mo','dong') DEFAULT 'mo',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sinhvien_hocbong (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    mssv        VARCHAR(50) NOT NULL,
    mahocbong   INT NOT NULL,
    trangthai   ENUM('duyet','tuchoi') DEFAULT 'duyet',
    ngayxet     DATE,
    nguoixet    VARCHAR(50),
    ghichu      TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mssv)      REFERENCES sinhvien(mssv)       ON DELETE CASCADE,
    FOREIGN KEY (mahocbong) REFERENCES hocbong(mahocbong)   ON DELETE CASCADE,
    UNIQUE KEY unique_student_scholarship (mssv, mahocbong)
);


-- ============================================================
-- PHẦN 12: DỊCH VỤ SINH VIÊN
-- ============================================================

CREATE TABLE IF NOT EXISTS loai_dichvu (
    maloaidichvu INT AUTO_INCREMENT PRIMARY KEY,
    tendichvu    VARCHAR(255) NOT NULL,
    mota         TEXT,
    thutu        INT DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO loai_dichvu (maloaidichvu, tendichvu, mota, thutu) VALUES
(1,  'Giấy xác nhận sinh viên',        'Xác nhận đang theo học tại trường',      1),
(2,  'Bảng điểm',                       'Xin bảng điểm học tập',                 2),
(3,  'Đăng ký ở KTX',                   'Đăng ký nội trú Ký túc xá',             3),
(4,  'Nghỉ học tạm thời',               'Đơn xin nghỉ học tạm thời',             4),
(5,  'Bảo lưu',                         'Đơn xin bảo lưu kết quả học tập',       5),
(6,  'Tốt nghiệp',                      'Đơn đăng ký tốt nghiệp',                6),
(7,  'Xin chuyển điểm tiếng Anh',       'Đơn xin chuyển kết quả tiếng Anh',      7),
(8,  'Xin chuyển ngành',                'Đơn xin chuyển ngành học',               8),
(9,  'Xin học vượt',                    'Đơn xin học vượt lên lớp cao hơn',      9),
(10, 'Xin nghỉ ốm',                     'Đơn xin nghỉ học do ốm đau',            10),
(99, 'Đơn tự do (nội dung tùy ý)',      'Sinh viên tự soạn đơn với nội dung tùy ý', 99)
ON DUPLICATE KEY UPDATE tendichvu = VALUES(tendichvu), thutu = VALUES(thutu);

-- ENUM trangthai: 'cho','dangxuly','duyet','tuchoi'
-- Có cột tieude (đơn tự do) và file_dinh_kem
CREATE TABLE IF NOT EXISTS dichvu_sinhvien (
    madon           INT AUTO_INCREMENT PRIMARY KEY,
    mssv            VARCHAR(50) NOT NULL,
    maloaidichvu    INT NOT NULL,
    tieude          VARCHAR(500) NULL,
    file_dinh_kem   VARCHAR(500) NULL,
    trangthai       ENUM('cho','dangxuly','duyet','tuchoi') DEFAULT 'cho',
    noidung_yeucau  TEXT,
    ketqua          TEXT,
    file_ketqua     VARCHAR(500),
    ngaygui         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngayduyet       DATETIME,
    nguoiduyet      VARCHAR(50),
    ghichu          TEXT,
    FOREIGN KEY (mssv)         REFERENCES sinhvien(mssv)            ON DELETE CASCADE,
    FOREIGN KEY (maloaidichvu) REFERENCES loai_dichvu(maloaidichvu) ON DELETE CASCADE,
    INDEX idx_mssv      (mssv),
    INDEX idx_trangthai (trangthai),
    INDEX idx_ngaygui   (ngaygui)
);


-- ============================================================
-- PHẦN 13: THÔNG BÁO
-- ============================================================

-- ENUM loai mở rộng gồm nhacnho_drl, nhacnho_hoso
-- Có cột nguoi_nhan JSON (danh sách MSSV mục tiêu, null = tất cả)
CREATE TABLE IF NOT EXISTS thongbao (
    mathongbao  INT AUTO_INCREMENT PRIMARY KEY,
    tieude      VARCHAR(500) NOT NULL,
    noidung     TEXT,
    loai        ENUM(
                    'truong','lop','nhacnho','lichthi',
                    'deadline_hocphi','khac',
                    'nhacnho_drl','nhacnho_hoso'
                ) NOT NULL DEFAULT 'khac',
    malop       VARCHAR(50) DEFAULT NULL,
    mahocky     INT DEFAULT NULL,
    han_xem     DATE,
    guiemail    TINYINT(1) DEFAULT 0,
    nguoi_nhan  JSON NULL COMMENT 'Danh sách MSSV nhận thông báo (null = tất cả)',
    nguoitao    VARCHAR(50),
    ngaytao     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky)      ON DELETE SET NULL,
    FOREIGN KEY (malop)   REFERENCES lophanhchinh(malop) ON DELETE SET NULL,
    INDEX idx_loai    (loai),
    INDEX idx_malop   (malop),
    INDEX idx_ngaytao (ngaytao)
);

-- ============================================================
-- PHẦN 14: ĐƠN TRỰC TUYẾN (DON_ONLINE)
-- ============================================================

CREATE TABLE IF NOT EXISTS don_online (
    madon       INT AUTO_INCREMENT PRIMARY KEY,
    mssv        VARCHAR(50) NOT NULL,
    loaidon     VARCHAR(100) NOT NULL,
    tieude      VARCHAR(500) NOT NULL,
    noidung     TEXT,
    ghichu      TEXT,
    trangthai   ENUM('cho','dangxuly','daduyet','tuchoi') DEFAULT 'cho',
    ketqua      TEXT,
    nguoiduyet  VARCHAR(50),
    ngaygui     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngayduyet   DATETIME,
    INDEX idx_mssv      (mssv),
    INDEX idx_trangthai (trangthai),
    INDEX idx_loaidon   (loaidon),
    INDEX idx_ngaygui   (ngaygui)
);

-- ============================================================
-- KIỂM TRA KẾT QUẢ
-- ============================================================

SELECT '✅ Database dkhp1 đã được khởi tạo thành công!' AS Result;

SELECT table_name AS 'Bảng đã tạo'
FROM information_schema.tables
WHERE table_schema = 'dkhp1'
ORDER BY table_name;
