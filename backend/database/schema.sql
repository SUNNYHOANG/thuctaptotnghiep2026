-- Bảng loại hoạt động
CREATE TABLE IF NOT EXISTS loaihoatdong (
    maloaihoatdong INT AUTO_INCREMENT PRIMARY KEY,
    tenloai VARCHAR(255) NOT NULL,
    mota TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng hoạt động
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
);

-- Bảng tham gia hoạt động
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
);

-- Bảng tiêu chí điểm rèn luyện
CREATE TABLE IF NOT EXISTS tieuchi_diemrenluyen (
    matieuchi INT AUTO_INCREMENT PRIMARY KEY,
    tentieuchi VARCHAR(255) NOT NULL,
    diemtoida INT NOT NULL DEFAULT 100,
    mota TEXT,
    loaitieuchi ENUM('hoatdong', 'hoc tap', 'ky luat', 'khac') DEFAULT 'hoatdong',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng điểm rèn luyện
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
);

-- Bảng tự đánh giá điểm rèn luyện của sinh viên
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
);

-- Insert dữ liệu mẫu cho loại hoạt động
INSERT INTO loaihoatdong (tenloai, mota) VALUES
('Hoạt động tình nguyện', 'Các hoạt động tình nguyện, từ thiện'),
('Hoạt động văn nghệ', 'Các hoạt động văn nghệ, biểu diễn'),
('Hoạt động thể thao', 'Các hoạt động thể thao, thi đấu'),
('Hoạt động học thuật', 'Các hoạt động nghiên cứu, học thuật'),
('Hoạt động xã hội', 'Các hoạt động xã hội khác');

-- Insert dữ liệu mẫu cho tiêu chí điểm rèn luyện
INSERT INTO tieuchi_diemrenluyen (tentieuchi, diemtoida, loaitieuchi, mota) VALUES
('Tham gia hoạt động tình nguyện', 20, 'hoatdong', 'Điểm cho việc tham gia các hoạt động tình nguyện'),
('Tham gia hoạt động văn nghệ', 15, 'hoatdong', 'Điểm cho việc tham gia các hoạt động văn nghệ'),
('Tham gia hoạt động thể thao', 15, 'hoatdong', 'Điểm cho việc tham gia các hoạt động thể thao'),
('Tổ chức hoạt động', 20, 'hoatdong', 'Điểm cho việc tổ chức các hoạt động'),
('Điểm học tập', 30, 'hoc tap', 'Điểm dựa trên kết quả học tập'),
('Chấp hành kỷ luật', 20, 'ky luat', 'Điểm về việc chấp hành nội quy, kỷ luật');
