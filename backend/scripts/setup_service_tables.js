import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'dkhp1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function setupServiceTables() {
  const connection = await pool.getConnection();
  try {
    console.log('Setting up service-related tables...');

    // Create loai_dichvu (service types) table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS loai_dichvu (
        maloaidichvu INT AUTO_INCREMENT PRIMARY KEY,
        tendichvu VARCHAR(255) NOT NULL,
        mota TEXT,
        thutu INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ loai_dichvu table created/exists');

    // Create dichvu_sinhvien (service requests) table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS dichvu_sinhvien (
        madon INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        maloaidichvu INT NOT NULL,
        noidung_yeucau TEXT,
        ghichu TEXT,
        ngaygui TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        trangthai ENUM('dangxuly', 'duyet', 'tuchoi') DEFAULT 'dangxuly',
        ketqua TEXT,
        file_ketqua VARCHAR(255),
        nguoiduyet INT,
        ngayduyet TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (mssv) REFERENCES sinhvien(mssv),
        FOREIGN KEY (maloaidichvu) REFERENCES loai_dichvu(maloaidichvu)
      )
    `);
    console.log('✓ dichvu_sinhvien table created/exists');

    // Insert 10 default service types
    const serviceTypes = [
      { tendichvu: 'Xác nhận học tập', mota: 'Xác nhận điểm danh, tình trạng học tập' },
      { tendichvu: 'Cấp bằng cấp', mota: 'Cấp giấy chứng chỉ hoặc bằng cấp' },
      { tendichvu: 'Bảng điểm', mota: 'Cấp bảng điểm, biên bản điểm' },
      { tendichvu: 'Hỗ trợ tài chính', mota: 'Đăng ký hỗ trợ học phí, học bổng' },
      { tendichvu: 'Công khai thông tin', mota: 'Yêu cầu công khai hoặc khiếu nại' },
      { tendichvu: 'Giải quyết khiếu nại', mota: 'Khiếu nại về điểm, kết quả học tập' },
      { tendichvu: 'Chứng chỉ tiếng Anh', mota: 'Cấp chứng chỉ tiếng Anh quốc tế' },
      { tendichvu: 'Tư vấn học tập', mota: 'Tư vấn chương trình học, lựa chọn chuyên ngành' },
      { tendichvu: 'Xin hoàn lại học phí', mota: 'Yêu cầu hoàn lại hoặc điều chỉnh học phí' },
      { tendichvu: 'Xin thôi học', mota: 'Yêu cầu xin thôi học, tạm dừng' }
    ];

    for (let i = 0; i < serviceTypes.length; i++) {
      await connection.execute(`
        INSERT IGNORE INTO loai_dichvu (tendichvu, mota, thutu) 
        VALUES (?, ?, ?)
      `, [serviceTypes[i].tendichvu, serviceTypes[i].mota, i]);
    }
    console.log('✓ 10 default service types inserted');

    console.log('\n✅ Service tables setup complete!');
  } catch (err) {
    console.error('❌ Error setting up service tables:', err.message);
  } finally {
    await connection.release();
    await pool.end();
  }
}

setupServiceTables();
