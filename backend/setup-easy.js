import pool from './config/database.js';

const setupSQL = `
-- Drop database if exists
DROP DATABASE IF EXISTS dkhp1;
CREATE DATABASE dkhp1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dkhp1;

-- 1. Khoa
CREATE TABLE IF NOT EXISTS khoa (
    makhoa VARCHAR(50) PRIMARY KEY,
    tenkhoa VARCHAR(255) NOT NULL
);

INSERT INTO khoa (makhoa, tenkhoa) VALUES
('CNTT', 'Công nghệ Thông tin'),
('QTKD', 'Quản trị kinh doanh'),
('KTCS', 'Kỹ thuật Cơ khí');

-- 2. Lớp học
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

-- 5. Hoạt động
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

-- 6. Giảng viên
CREATE TABLE IF NOT EXISTS giangvien (
    magiaovien INT AUTO_INCREMENT PRIMARY KEY,
    tengiaovien VARCHAR(255) NOT NULL,
    makhoa VARCHAR(50),
    email VARCHAR(100),
    dienthoai VARCHAR(20),
    FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
);

INSERT INTO giangvien (tengiaovien, makhoa, email, dienthoai) VALUES
('TS. Nguyễn Văn C', 'CNTT', 'nguyenvanc@hva.edu.vn', '0123456789'),
('TS. Trần Thị D', 'CNTT', 'tranthid@hva.edu.vn', '0987654321');

-- 7. Môn học
CREATE TABLE IF NOT EXISTS monhoc (
    mamh INT AUTO_INCREMENT PRIMARY KEY,
    tenmh VARCHAR(255) NOT NULL,
    sotinchi INT DEFAULT 3,
    mota TEXT,
    makhoa VARCHAR(50),
    FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
);

INSERT INTO monhoc (tenmh, sotinchi, mota, makhoa) VALUES
('Lập Trình C++', 3, 'Học lập trình C++ nâng cao', 'CNTT'),
('Cơ Sở Dữ Liệu', 3, 'MySQL, SQL, Database Design', 'CNTT'),
('Mạng Máy Tính', 3, 'Networking và TCP/IP', 'CNTT');

-- 8. Lớp học phần
CREATE TABLE IF NOT EXISTS lophocphan (
    malophocphan INT AUTO_INCREMENT PRIMARY KEY,
    mamonhoc INT NOT NULL,
    magiaovien INT NOT NULL,
    malop VARCHAR(50),
    mahocky INT,
    thoigian VARCHAR(100),
    phonghoc VARCHAR(50),
    soluongsv INT DEFAULT 0,
    FOREIGN KEY (mamonhoc) REFERENCES monhoc(mamh) ON DELETE CASCADE,
    FOREIGN KEY (magiaovien) REFERENCES giangvien(magiaovien) ON DELETE CASCADE,
    FOREIGN KEY (malop) REFERENCES lophoc(malop) ON DELETE SET NULL,
    FOREIGN KEY (mahocky) REFERENCES hocky(mahocky) ON DELETE SET NULL
);

INSERT INTO lophocphan (mamonhoc, magiaovien, malop, mahocky, thoigian, phonghoc) VALUES
(1, 1, 'CNTT01', 1, 'Thứ 2 7h30', 'A101'),
(2, 1, 'CNTT01', 1, 'Thứ 3 9h00', 'A102'),
(3, 2, 'CNTT02', 1, 'Thứ 4 7h30', 'B101');

-- 9. Đăng ký học phần
CREATE TABLE IF NOT EXISTS dangky (
    madangky INT AUTO_INCREMENT PRIMARY KEY,
    mssv VARCHAR(50) NOT NULL,
    malophocphan INT NOT NULL,
    trangthai ENUM('dangky', 'duocduyet', 'tuchoi', 'hoanthanh') DEFAULT 'dangky',
    ngaydangky TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
    FOREIGN KEY (malophocphan) REFERENCES lophocphan(malophocphan) ON DELETE CASCADE
);

INSERT INTO dangky (mssv, malophocphan, trangthai) VALUES
('20123456', 1, 'duocduyet'),
('20123457', 1, 'duocduyet'),
('20123458', 3, 'duocduyet');

-- 10. Bảng điểm
CREATE TABLE IF NOT EXISTS bangdiem (
    mabangdiem INT AUTO_INCREMENT PRIMARY KEY,
    malophocphan INT NOT NULL,
    mssv VARCHAR(50) NOT NULL,
    diemchuyencan DECIMAL(4,2) DEFAULT NULL,
    diemgiuaky DECIMAL(4,2) DEFAULT NULL,
    diemcuoiky DECIMAL(4,2) DEFAULT NULL,
    diemtongsketkhoahoc DECIMAL(4,2) DEFAULT NULL,
    gpa DECIMAL(4,2) DEFAULT NULL,
    xephoct VARCHAR(50) DEFAULT NULL,
    trangthaidiem ENUM('Đang nhập', 'Đã khóa') DEFAULT 'Đang nhập',
    ngaynhap TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngaykhoa DATETIME DEFAULT NULL,
    FOREIGN KEY (malophocphan) REFERENCES lophocphan(malophocphan) ON DELETE CASCADE,
    FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE
);

-- 11. Log sửa điểm
CREATE TABLE IF NOT EXISTS log_suadiem (
    malogsuadiem INT AUTO_INCREMENT PRIMARY KEY,
    mabangdiem INT NOT NULL,
    loaidiem VARCHAR(50),
    giatricu VARCHAR(50),
    giatrimoi VARCHAR(50),
    nguoisua VARCHAR(50),
    ngaysua TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lydo TEXT,
    FOREIGN KEY (mabangdiem) REFERENCES bangdiem(mabangdiem) ON DELETE CASCADE
);

-- 12. Users (Admin/Giảng Viên)
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

-- Insert Admin
INSERT INTO users (username, password, hoten, email, role, status) VALUES
('admin', 'admin123', 'Quản Trị Viên Hệ Thống', 'admin@hva.edu.vn', 'admin', 'active');

-- Insert CTSV
INSERT INTO users (username, password, hoten, email, role, status) VALUES
('ctsv', 'ctsv123', 'Phòng CTSV', 'ctsv@hva.edu.vn', 'ctsv', 'active');

-- Insert Giảng Viên
INSERT INTO users (username, password, hoten, email, role, magiangvien, status) VALUES
('nguyenvanc', 'password123', 'TS. Nguyễn Văn C', 'nguyenvanc@hva.edu.vn', 'giangvien', 1, 'active'),
('tranthid', 'password123', 'TS. Trần Thị D', 'tranthid@hva.edu.vn', 'giangvien', 2, 'active');
`;

async function setup() {
  let connection;
  try {
    // First connection without database
    connection = await pool.getConnection();
    
    console.log('✅ Connected to MySQL\n');
    console.log('🗑️  Setting up database...\n');
    
    // Execute entire SQL
    const statements = setupSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    let success = 0, failed = 0;
    
    for (const stmt of statements) {
      try {
        await connection.query(stmt);
        success++;
      } catch (err) {
        if (!err.message.includes('already exists')) {
          // console.error(err.message);
        }
        failed++;
      }
    }
    
    console.log(`✅ Setup complete! (${success} statements executed)\n`);
    
    // Verify with new pool connection to dkhp1
    const verifyConnection = await pool.getConnection();
    
    const [tables] = await verifyConnection.query('SHOW TABLES');
    console.log(`📊 Tables created: ${tables.length}\n`);
    
    const [users] = await verifyConnection.query('SELECT username, role FROM users LIMIT 3');
    console.log('👤 Users:');
    users.forEach(u => console.log(`   ✓ ${u.username} (${u.role})`));
    
    const [students] = await verifyConnection.query('SELECT COUNT(*) as cnt FROM sinhvien');
    console.log(`\n🎓 Students: ${students[0].cnt}`);
    
    verifyConnection.release();
    
    console.log('\n✨ Database ready!\n');
    console.log('🔐 Admin login:');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

setup();
