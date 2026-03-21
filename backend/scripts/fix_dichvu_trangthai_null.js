import pool from '../config/database.js';

async function run() {
  try {
    // Dùng CASE để bypass ENUM restriction khi update
    const [r1] = await pool.execute(
      `UPDATE dichvu_sinhvien SET trangthai = 'cho' WHERE trangthai IS NULL`
    );
    console.log(`Fix NULL: ${r1.affectedRows} dòng`);

    // Với chuỗi rỗng, cần dùng raw query bypass enum
    const [r2] = await pool.query(
      `UPDATE dichvu_sinhvien SET trangthai = 'cho' WHERE trangthai = ''`
    );
    console.log(`Fix empty string: ${r2.affectedRows} dòng`);

    // Kiểm tra kết quả
    const [rows] = await pool.execute(
      `SELECT trangthai, COUNT(*) as cnt FROM dichvu_sinhvien GROUP BY trangthai`
    );
    console.log('Phân bố sau fix:');
    rows.forEach(r => console.log(`  "${r.trangthai}": ${r.cnt}`));
  } catch (e) {
    console.error('Lỗi:', e.message);
  }
  process.exit(0);
}

run();
