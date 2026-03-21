import pool from '../config/database.js';

async function run() {
  try {
    await pool.execute(
      'ALTER TABLE dichvu_sinhvien ADD COLUMN file_dinh_kem VARCHAR(500) NULL AFTER tieude'
    );
    console.log('✅ Đã thêm cột file_dinh_kem');
  } catch (e) {
    if (e.message?.includes('Duplicate column') || e.message?.includes('already exists')) {
      console.log('ℹ️  Cột file_dinh_kem đã tồn tại, bỏ qua.');
    } else {
      console.error('Lỗi:', e.message);
    }
  }
  process.exit(0);
}
run();
