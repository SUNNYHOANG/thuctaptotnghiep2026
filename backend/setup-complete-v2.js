import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'dkhp1';

async function setup() {
  let connection;
  
  try {
    // 1. Connect without database
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD || undefined,
      multipleStatements: false
    });
    
    console.log('✅ Connected to MySQL\n');
    
    // 2. Drop database
    try {
      await connection.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
      console.log('🗑️  Dropped old database');
    } catch (err) {
      console.log('ℹ️ No database to drop');
    }
    
    // 3. Create database
    await connection.query(`CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✨ Created database\n');
    
    // 4. Switch to database
    await connection.query(`USE ${DB_NAME}`);
    
    // 5. Execute DDL statements
    const tables = [
      // Khoa
      `CREATE TABLE khoa (
        makhoa VARCHAR(50) PRIMARY KEY,
        tenkhoa VARCHAR(255) NOT NULL
      )`,
      
      // Lớp học
      `CREATE TABLE lophoc (
        malop VARCHAR(50) PRIMARY KEY,
        tenlop VARCHAR(255) NOT NULL,
        makhoa VARCHAR(50),
        namtuyensinh INT,
        FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
      )`,
      
      // Sinh viên
      `CREATE TABLE sinhvien (
        mssv VARCHAR(50) PRIMARY KEY,
        hoten VARCHAR(255) NOT NULL,
        malop VARCHAR(50),
        makhoa VARCHAR(50),
        password VARCHAR(255) DEFAULT '123456',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (malop) REFERENCES lophoc(malop) ON DELETE SET NULL,
        FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
      )`,
      
      // Học kỳ
      `CREATE TABLE hocky (
        mahocky INT PRIMARY KEY AUTO_INCREMENT,
        tenhocky VARCHAR(50),
        namhoc INT,
        kyhoc INT,
        ngaybd DATE,
        ngaykt DATE
      )`,
      
      // Hoạt động
      `CREATE TABLE hoatdong (
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
      )`,
      
      // Giảng viên
      `CREATE TABLE giangvien (
        magiaovien INT AUTO_INCREMENT PRIMARY KEY,
        tengiaovien VARCHAR(255) NOT NULL,
        makhoa VARCHAR(50),
        email VARCHAR(100),
        dienthoai VARCHAR(20),
        FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
      )`,
      
      // Môn học
      `CREATE TABLE monhoc (
        mamh INT AUTO_INCREMENT PRIMARY KEY,
        tenmh VARCHAR(255) NOT NULL,
        sotinchi INT DEFAULT 3,
        mota TEXT,
        makhoa VARCHAR(50),
        FOREIGN KEY (makhoa) REFERENCES khoa(makhoa) ON DELETE SET NULL
      )`,
      
      // Lớp học phần
      `CREATE TABLE lophocphan (
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
      )`,
      
      // Đăng ký học phần
      `CREATE TABLE dangky (
        madangky INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        malophocphan INT NOT NULL,
        trangthai ENUM('dangky', 'duocduyet', 'tuchoi', 'hoanthanh') DEFAULT 'dangky',
        ngaydangky TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
        FOREIGN KEY (malophocphan) REFERENCES lophocphan(malophocphan) ON DELETE CASCADE
      )`,
      
      // Bảng điểm
      `CREATE TABLE bangdiem (
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
      )`,
      
      // Log sửa điểm
      `CREATE TABLE log_suadiem (
        malogsuadiem INT AUTO_INCREMENT PRIMARY KEY,
        mabangdiem INT NOT NULL,
        loaidiem VARCHAR(50),
        giatricu VARCHAR(50),
        giatrimoi VARCHAR(50),
        nguoisua VARCHAR(50),
        ngaysua TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lydo TEXT,
        FOREIGN KEY (mabangdiem) REFERENCES bangdiem(mabangdiem) ON DELETE CASCADE
      )`,
      
      // Users (Admin/Giảng Viên)  
      `CREATE TABLE users (
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
      )`
    ];
    
    let tableCount = 0;
    for (const sql of tables) {
      try {
        await connection.query(sql);
        tableCount++;
      } catch (err) {
        console.error(`❌ Table error: ${err.message}`);
      }
    }
    
    console.log(`📊 Tables created: ${tableCount}\n`);
    console.log('📝 Inserting data...\n');
    
    // 6. Insert data
    await connection.query('INSERT INTO khoa (makhoa, tenkhoa) VALUES (?, ?)', ['CNTT', 'Công nghệ Thông tin']);
    await connection.query('INSERT INTO khoa (makhoa, tenkhoa) VALUES (?, ?)', ['QTKD', 'Quản trị kinh doanh']);
    await connection.query('INSERT INTO khoa (makhoa, tenkhoa) VALUES (?, ?)', ['KTCS', 'Kỹ thuật Cơ khí']);
    
    await connection.query('INSERT INTO lophoc (malop, tenlop, makhoa, namtuyensinh) VALUES (?, ?, ?, ?)', 
      ['CNTT01', 'CNTT K17 Lớp 1', 'CNTT', 2017]);
    await connection.query('INSERT INTO lophoc (malop, tenlop, makhoa, namtuyensinh) VALUES (?, ?, ?, ?)', 
      ['CNTT02', 'CNTT K17 Lớp 2', 'CNTT', 2017]);
    await connection.query('INSERT INTO lophoc (malop, tenlop, makhoa, namtuyensinh) VALUES (?, ?, ?, ?)', 
      ['QTKD01', 'QTKD K17 Lớp 1', 'QTKD', 2017]);
    
    const svData = [
      ['20123456', 'Trần Minh Quân', 'CNTT01', 'CNTT', '123456'],
      ['20123457', 'Lê Thị Hà', 'CNTT01', 'CNTT', '123456'],
      ['20123458', 'Nguyễn Văn A', 'CNTT02', 'CNTT', '123456'],
      ['20123459', 'Phạm Thị B', 'QTKD01', 'QTKD', '123456'],
      ['20123460', 'Hoàng Văn C', 'CNTT01', 'CNTT', '123456'],
      ['20123461', 'Lý Thị D', 'CNTT02', 'CNTT', '123456'],
      ['20123462', 'Vũ Văn E', 'QTKD01', 'QTKD', '123456'],
      ['20123463', 'Mỹ Tiên F', 'CNTT01', 'CNTT', '123456'],
      ['20123464', 'Thảo Vy G', 'CNTT02', 'CNTT', '123456'],
      ['20123465', 'Tùng Lâm H', 'QTKD01', 'QTKD', '123456'],
      ['20123466', 'Khánh Ngọc I', 'CNTT01', 'CNTT', '123456'],
      ['20123467', 'Phương Anh J', 'CNTT02', 'CNTT', '123456'],
      ['20123468', 'Minh Khôi K', 'QTKD01', 'QTKD', '123456'],
      ['20123469', 'Liên Phương L', 'CNTT01', 'CNTT', '123456']
    ];
    
    for (const sv of svData) {
      await connection.query('INSERT INTO sinhvien (mssv, hoten, malop, makhoa, password) VALUES (?, ?, ?, ?, ?)', sv);
    }
    
    await connection.query('INSERT INTO hocky (tenhocky, namhoc, kyhoc, ngaybd, ngaykt) VALUES (?, ?, ?, ?, ?)',
      ['HK1 2023-2024', 2023, 1, '2023-09-01', '2023-12-31']);
    await connection.query('INSERT INTO hocky (tenhocky, namhoc, kyhoc, ngaybd, ngaykt) VALUES (?, ?, ?, ?, ?)',
      ['HK2 2023-2024', 2024, 2, '2024-01-01', '2024-05-31']);
    
    await connection.query('INSERT INTO giangvien (tengiaovien, makhoa, email, dienthoai) VALUES (?, ?, ?, ?)',
      ['TS. Nguyễn Văn C', 'CNTT', 'nguyenvanc@hva.edu.vn', '0123456789']);
    await connection.query('INSERT INTO giangvien (tengiaovien, makhoa, email, dienthoai) VALUES (?, ?, ?, ?)',
      ['TS. Trần Thị D', 'CNTT', 'tranthid@hva.edu.vn', '0987654321']);
    
    await connection.query('INSERT INTO monhoc (tenmh, sotinchi, mota, makhoa) VALUES (?, ?, ?, ?)',
      ['Lập Trình C++', 3, 'Học lập trình C++ nâng cao', 'CNTT']);
    await connection.query('INSERT INTO monhoc (tenmh, sotinchi, mota, makhoa) VALUES (?, ?, ?, ?)',
      ['Cơ Sở Dữ Liệu', 3, 'MySQL, SQL, Database Design', 'CNTT']);
    await connection.query('INSERT INTO monhoc (tenmh, sotinchi, mota, makhoa) VALUES (?, ?, ?, ?)',
      ['Mạng Máy Tính', 3, 'Networking và TCP/IP', 'CNTT']);
    
    await connection.query('INSERT INTO lophocphan (mamonhoc, magiaovien, malop, mahocky, thoigian, phonghoc) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 1, 'CNTT01', 1, 'Thứ 2 7h30', 'A101']);
    await connection.query('INSERT INTO lophocphan (mamonhoc, magiaovien, malop, mahocky, thoigian, phonghoc) VALUES (?, ?, ?, ?, ?, ?)',
      [2, 1, 'CNTT01', 1, 'Thứ 3 9h00', 'A102']);
    await connection.query('INSERT INTO lophocphan (mamonhoc, magiaovien, malop, mahocky, thoigian, phonghoc) VALUES (?, ?, ?, ?, ?, ?)',
      [3, 2, 'CNTT02', 1, 'Thứ 4 7h30', 'B101']);
    
    await connection.query('INSERT INTO dangky (mssv, malophocphan, trangthai) VALUES (?, ?, ?)',
      ['20123456', 1, 'duocduyet']);
    await connection.query('INSERT INTO dangky (mssv, malophocphan, trangthai) VALUES (?, ?, ?)',
      ['20123457', 1, 'duocduyet']);
    await connection.query('INSERT INTO dangky (mssv, malophocphan, trangthai) VALUES (?, ?, ?)',
      ['20123458', 3, 'duocduyet']);
    
    // 7. Create admin account
    await connection.query('INSERT INTO users (username, password, hoten, email, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin', 'admin123', 'Quản Trị Viên Hệ Thống', 'admin@hva.edu.vn', 'admin', 'active']);

    // 8. Create CTSV account
    await connection.query('INSERT INTO users (username, password, hoten, email, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['ctsv', 'ctsv123', 'Phòng CTSV', 'ctsv@hva.edu.vn', 'ctsv', 'active']);
    
    await connection.query('INSERT INTO users (username, password, hoten, email, role, magiangvien, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['nguyenvanc', 'password123', 'TS. Nguyễn Văn C', 'nguyenvanc@hva.edu.vn', 'giangvien', 1, 'active']);
    
    await connection.query('INSERT INTO users (username, password, hoten, email, role, magiangvien, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['tranthid', 'password123', 'TS. Trần Thị D', 'tranthid@hva.edu.vn', 'giangvien', 2, 'active']);
    
    console.log('✅ Database setup complete!\n');
    
    // 8. Verify
    const [tables_result] = await connection.query('SHOW TABLES');
    console.log(`📊 Tables: ${tables_result.length}`);
    
    const [users_result] = await connection.query('SELECT username, role FROM users ORDER BY id');
    console.log('\n👤 Users:');
    users_result.forEach(u => console.log(`   ✓ ${u.username} (${u.role})`));
    
    const [students_result] = await connection.query('SELECT COUNT(*) as cnt FROM sinhvien');
    console.log(`\n🎓 Students: ${students_result[0].cnt}`);
    
    console.log('\n🔐 Admin Login Test:');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');
    
    console.log('🌐 URL: http://localhost:3000');
    console.log('📚 API: http://localhost:5000\n');
    
  } catch (error) {
    console.error('❌ Setup Error:', error.message);
    console.error(error);
  } finally {
    if (connection) await connection.end();
    process.exit();
  }
}

setup();
