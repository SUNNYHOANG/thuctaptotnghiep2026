import pool from '../config/database.js';

async function migrate() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      ALTER TABLE khenthuong_kyluat 
      MODIFY COLUMN trangthai ENUM('cho_duyet','khoa_duyet','khoa_tuchoi','da_duyet','tu_choi') 
      NOT NULL DEFAULT 'cho_duyet'
    `);
    console.log('✅ Đã cập nhật ENUM trangthai.');
  } catch(e) {
    console.error('Lỗi:', e.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
