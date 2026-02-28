import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Function to generate random course code
const generateRandomCode = () => {
  return 'MH' + uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase();
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'dkhp1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function setupCourseTables() {
  const connection = await pool.getConnection();
  try {
    console.log('Setting up course-related tables...');

    // Disable foreign key checks to allow safely dropping/recreating tables
    await connection.execute(`SET FOREIGN_KEY_CHECKS = 0`);
    console.log('✓ Disabled foreign key checks');

    // Drop old tables in correct order
    await connection.execute(`DROP TABLE IF EXISTS dsdangky`);
    await connection.execute(`DROP TABLE IF EXISTS lophoc`);
    await connection.execute(`DROP TABLE IF EXISTS monhoc`);
    console.log('✓ Dropped old tables');

    // Create monhoc (courses) table with new structure
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS monhoc (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mamonhoc VARCHAR(50) NOT NULL UNIQUE,
        tenmonhoc VARCHAR(255) NOT NULL,
        sotinchi INT NOT NULL DEFAULT 3,
        makhoa VARCHAR(50),
        mota TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_makhoa (makhoa),
        INDEX idx_mamonhoc (mamonhoc)
      )
    `);
    console.log('✓ monhoc table created/exists');

    // Create giangvien (teacher) table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS giangvien (
        magiaovien INT AUTO_INCREMENT PRIMARY KEY,
        hoten VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        sodienthoai VARCHAR(20),
        makhoa VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ giangvien table created/exists');

    // Create phonghoc (room) table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS phonghoc (
        maphong VARCHAR(50) PRIMARY KEY,
        tenphong VARCHAR(100) NOT NULL,
        succhua INT,
        toanha VARCHAR(100),
        ghichu TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ phonghoc table created/exists');

    // Create lophoc (class section) table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lophoc (
        malophoc INT AUTO_INCREMENT PRIMARY KEY,
        mamonhoc VARCHAR(50) NOT NULL,
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
        FOREIGN KEY (mamonhoc) REFERENCES monhoc(mamonhoc),
        FOREIGN KEY (mahocky) REFERENCES hocky(mahocky),
        FOREIGN KEY (magiaovien) REFERENCES giangvien(magiaovien),
        FOREIGN KEY (maphong) REFERENCES phonghoc(maphong)
      )
    `);
    console.log('✓ lophoc table created/exists');

    // Create dsdangky (enrollment) table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS dsdangky (
        madangky INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        malophoc INT NOT NULL,
        thoidiemdk TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        trangthai ENUM('dangcho', 'daphucduy', 'huy') DEFAULT 'dangcho',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (mssv) REFERENCES sinhvien(mssv),
        FOREIGN KEY (malophoc) REFERENCES lophoc(malophoc),
        UNIQUE KEY unique_enrollment (mssv, malophoc)
      )
    `);
    console.log('✓ dsdangky table created/exists');

    // Insert sample data with random mamonhoc codes
    const courses = [
      { tenmonhoc: 'Lập trình C++', sotinchi: 3, makhoa: 'CNTT', mota: 'Học lập trình hướng đối tượng' },
      { tenmonhoc: 'Cơ sở dữ liệu', sotinchi: 3, makhoa: 'CNTT', mota: 'Thiết kế và quản lý CSDL' },
      { tenmonhoc: 'Web Development', sotinchi: 3, makhoa: 'CNTT', mota: 'Phát triển ứng dụng web' },
      { tenmonhoc: 'Toán rời rạc', sotinchi: 4, makhoa: 'CNTT', mota: 'Giáo trình toán rời rạc' },
      { tenmonhoc: 'Kiến trúc máy tính', sotinchi: 3, makhoa: 'CNTT', mota: 'Học về kiến trúc CPU' }
    ];

    for (const course of courses) {
      const mamonhoc = generateRandomCode();
      try {
        await connection.execute(
          `INSERT IGNORE INTO monhoc (mamonhoc, tenmonhoc, sotinchi, makhoa, mota) VALUES (?, ?, ?, ?, ?)`,
          [mamonhoc, course.tenmonhoc, course.sotinchi, course.makhoa, course.mota]
        );
      } catch (err) {
        console.log(`Skipped duplicate: ${course.tenmonhoc}`);
      }
    }
    console.log('✓ Sample monhoc data inserted');

    await connection.execute(`
      INSERT IGNORE INTO giangvien (hoten, email, makhoa) VALUES
      ('TS. Nguyễn Văn Hùng', 'hung@vaa.edu.vn', 'CNTT'),
      ('ThS. Trần Thị Lan', 'lan@vaa.edu.vn', 'CNTT'),
      ('TS. Phạm Minh Độ', 'do@vaa.edu.vn', 'CNTT')
    `);
    console.log('✓ Sample giangvien data inserted');

    await connection.execute(`
      INSERT IGNORE INTO phonghoc (maphong, tenphong, succhua, toanha) VALUES
      ('A101', 'Tiểu ban A - Phòng 101', 60, 'Tòa A'),
      ('A102', 'Tiểu ban A - Phòng 102', 50, 'Tòa A'),
      ('B201', 'Tiểu ban B - Phòng 201', 60, 'Tòa B')
    `);
    console.log('✓ Sample phonghoc data inserted');

    // Re-enable foreign key checks
    await connection.execute(`SET FOREIGN_KEY_CHECKS = 1`);
    console.log('✓ Re-enabled foreign key checks');

    console.log('\n✅ Course tables setup complete!');
  } catch (err) {
    console.error('❌ Error setting up course tables:', err.message);
  } finally {
    await connection.release();
    await pool.end();
  }
}

setupCourseTables();
