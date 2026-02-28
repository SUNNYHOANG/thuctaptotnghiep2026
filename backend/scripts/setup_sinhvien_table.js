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

async function setupTables() {
  const connection = await pool.getConnection();
  try {
    console.log('Setting up sinhvien and hocky tables...');

    // Create hocky table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS hocky (
        mahocky INT AUTO_INCREMENT PRIMARY KEY,
        tenhocky VARCHAR(100) NOT NULL,
        namhoc VARCHAR(20) NOT NULL,
        ngaybatdau DATE,
        ngayketthuc DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ hocky table created/exists');

    // Create sinhvien table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sinhvien (
        mssv VARCHAR(50) PRIMARY KEY,
        hoten VARCHAR(255) NOT NULL,
        malop VARCHAR(50),
        makhoa VARCHAR(50),
        password VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ sinhvien table created/exists');

    // Insert sample data
    await connection.execute(`
      INSERT IGNORE INTO hocky (tenhocky, namhoc) VALUES
      ('Học kỳ 1', '2024-2025'),
      ('Học kỳ 2', '2024-2025')
    `);
    console.log('✓ Sample hocky data inserted');

    await connection.execute(`
      INSERT IGNORE INTO sinhvien (mssv, hoten, malop, makhoa, password) VALUES
      ('20123456', 'Nguyễn Văn A', 'CNTT01', 'CNTT', '123456'),
      ('20123457', 'Trần Thị B', 'CNTT01', 'CNTT', '123456')
    `);
    console.log('✓ Sample sinhvien data inserted');

    console.log('\n✅ Database setup complete!');
  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
  } finally {
    await connection.release();
    await pool.end();
  }
}

setupTables();
