import pool from '../config/database.js';

async function migrate() {
  try {
    await pool.execute(
      "ALTER TABLE phuckhao MODIFY COLUMN trangthai ENUM('cho','dangxuly','gv_duyet','gv_tuchoi','khoa_duyet','khoa_tuchoi','chapnhan','tuchoi') DEFAULT 'cho'"
    );
    console.log('✅ Đã cập nhật ENUM trangthai cho bảng phuckhao');
  } catch (err) {
    console.error('❌', err.message);
  }
  process.exit(0);
}

migrate();
