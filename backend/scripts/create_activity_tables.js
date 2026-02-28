import pool from '../config/database.js';

async function run() {
  try {
    await pool.execute(`CREATE TABLE IF NOT EXISTS loaihoatdong (
      maloaihoatdong INT AUTO_INCREMENT PRIMARY KEY,
      tenloai VARCHAR(255) NOT NULL,
      mota TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await pool.execute(`CREATE TABLE IF NOT EXISTS hoatdong (
      mahoatdong INT AUTO_INCREMENT PRIMARY KEY,
      tenhoatdong VARCHAR(255) NOT NULL,
      maloaihoatdong INT NOT NULL,
      mota TEXT,
      ngaybatdau DATETIME NOT NULL,
      ngayketthuc DATETIME NOT NULL,
      diadiem VARCHAR(255),
      soluongtoida INT DEFAULT 100,
      soluongdadangky INT DEFAULT 0,
      trangthai ENUM('dangmo','dangdienra','daketthuc','huy') DEFAULT 'dangmo',
      nguoitao VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (maloaihoatdong) REFERENCES loaihoatdong(maloaihoatdong) ON DELETE CASCADE
    )`);

    // Insert some default types if empty
    const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM loaihoatdong');
    if (rows && rows[0] && rows[0].cnt === 0) {
      await pool.execute("INSERT INTO loaihoatdong (tenloai, mota) VALUES ('Hoạt động tình nguyện','Tình nguyện'), ('Hoạt động văn nghệ','Văn nghệ'), ('Hoạt động thể thao','Thể thao')");
    }

    console.log('✅ Activity tables ensured');
  } catch (err) {
    console.error('❌ Error creating activity tables:', err.message);
  } finally {
    process.exit();
  }
}

run();
