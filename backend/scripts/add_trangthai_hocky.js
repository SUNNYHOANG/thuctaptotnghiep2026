import pool from '../config/database.js';

async function migrate() {
  try {
    await pool.execute(`
      ALTER TABLE hocky 
      ADD COLUMN IF NOT EXISTS trangthai ENUM('chuamo', 'dangmo', 'dadong') NOT NULL DEFAULT 'chuamo'
    `);
    console.log('✅ Đã thêm cột trangthai vào bảng hocky');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
