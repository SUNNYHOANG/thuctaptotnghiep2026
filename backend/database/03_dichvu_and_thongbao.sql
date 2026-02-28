-- Đăng ký & dịch vụ sinh viên + Thông báo & tin tức
-- Chạy SAU: 00, schema, 01, 02

-- ========== 1. ĐĂNG KÝ & DỊCH VỤ SINH VIÊN ==========

-- Loại dịch vụ
CREATE TABLE IF NOT EXISTS loai_dichvu (
    maloaidichvu INT AUTO_INCREMENT PRIMARY KEY,
    tendichvu VARCHAR(255) NOT NULL,
    mota TEXT,
    thutu INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Đơn xin dịch vụ (sinh viên gửi → phòng CTSV duyệt → trả kết quả)
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

-- Dữ liệu mẫu loại dịch vụ
INSERT IGNORE INTO loai_dichvu (maloaidichvu, tendichvu, mota, thutu) VALUES
(1, 'Giấy xác nhận sinh viên', 'Xác nhận đang theo học tại trường', 1),
(2, 'Bảng điểm', 'Xin bảng điểm học tập', 2),
(3, 'Đăng ký ở KTX', 'Đăng ký nội trú Ký túc xá', 3),
(4, 'Nghỉ học tạm thời', 'Đơn xin nghỉ học tạm thời', 4),
(5, 'Bảo lưu', 'Đơn xin bảo lưu kết quả học tập', 5),
(6, 'Tốt nghiệp', 'Đơn đăng ký tốt nghiệp', 6),
(7, 'Xin chuyển điểm tiếng Anh', 'Đơn xin chuyển kết quả tiếng Anh', 7),
(8, 'Xin chuyển ngành', 'Đơn xin chuyển ngành học', 8),
(9, 'Xin học vượt', 'Đơn xin học vượt lên lớp cao hơn', 9),
(10, 'Xin nghỉ ốm', 'Đơn xin nghỉ học do ốm đau', 10);

-- ========== 2. THÔNG BÁO & TIN TỨC ==========

-- Thông báo
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
