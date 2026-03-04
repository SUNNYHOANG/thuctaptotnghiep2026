/**
 * Thêm trạng thái 'dachot' vào bảng hoatdong.
 * Khi đủ số lượng đăng ký, hoạt động chuyển sang dachot (chốt danh sách).
 */
import pool from '../config/database.js';

async function run() {
  try {
    await pool.execute(
      "ALTER TABLE hoatdong MODIFY COLUMN trangthai ENUM('dangmo','dangdienra','daketthuc','huy','dachot') DEFAULT 'dangmo'"
    );
    console.log('✅ Đã thêm trangthai "dachot" vào bảng hoatdong.');
  } catch (err) {
    if (err.code === 'ER_INVALID_USE_OF_NULL' || err.message?.includes('dachot')) {
      console.log('ℹ️ Cột trangthai có thể đã có giá trị dachot hoặc schema khác.');
    } else {
      console.error('❌ Lỗi:', err.message);
    }
  } finally {
    await pool.end();
  }
}

run();
