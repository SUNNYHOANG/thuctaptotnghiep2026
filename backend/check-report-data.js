import pool from './config/database.js';

async function run() {
  const conn = await pool.getConnection();
  try {
    const [[total]] = await conn.execute('SELECT COUNT(*) as cnt FROM sinhvien');
    const [[hasLop]] = await conn.execute("SELECT COUNT(*) as cnt FROM sinhvien WHERE malop IS NOT NULL AND malop != ''");
    const [[hasKhoa]] = await conn.execute("SELECT COUNT(*) as cnt FROM sinhvien WHERE makhoa IS NOT NULL AND makhoa != ''");
    
    console.log('Tổng SV:', total.cnt);
    console.log('Có malop:', hasLop.cnt);
    console.log('Có makhoa:', hasKhoa.cnt);

    const [byLop] = await conn.execute(
      "SELECT malop, makhoa, COUNT(*) as cnt FROM sinhvien GROUP BY malop, makhoa ORDER BY cnt DESC LIMIT 10"
    );
    console.log('\nThống kê theo lớp (top 10):');
    byLop.forEach(r => console.log(`  lop=${r.malop} khoa=${r.makhoa} cnt=${r.cnt}`));

    // Kiểm tra bảng lophanhchinh có tồn tại không
    try {
      const [lhc] = await conn.execute('SELECT malop, tenlop, makhoa FROM lophanhchinh LIMIT 5');
      console.log('\nBảng lophanhchinh (5 dòng đầu):');
      lhc.forEach(r => console.log(`  ${JSON.stringify(r)}`));
    } catch (e) {
      console.log('\nBảng lophanhchinh không tồn tại:', e.message);
    }

    // Kiểm tra bảng khoa
    try {
      const [khoa] = await conn.execute('SELECT makhoa, tenkhoa FROM khoa LIMIT 10');
      console.log('\nBảng khoa:');
      khoa.forEach(r => console.log(`  ${JSON.stringify(r)}`));
    } catch (e) {
      console.log('\nBảng khoa lỗi:', e.message);
    }

  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
