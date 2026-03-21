import pool from '../config/database.js';

async function run() {
  try {
    // Bước 1: Đổi cột sang VARCHAR tạm để có thể update tự do
    await pool.execute(`ALTER TABLE dichvu_sinhvien MODIFY trangthai VARCHAR(20) DEFAULT 'cho'`);
    console.log('✅ Đổi sang VARCHAR');

    // Bước 2: Map giá trị cũ → mới
    const [r1] = await pool.execute(`UPDATE dichvu_sinhvien SET trangthai = 'cho' WHERE trangthai IN ('choduyet', '', NULL) OR trangthai IS NULL`);
    console.log(`✅ choduyet/empty → cho: ${r1.affectedRows} dòng`);

    const [r2] = await pool.execute(`UPDATE dichvu_sinhvien SET trangthai = 'duyet' WHERE trangthai = 'daduyet'`);
    console.log(`✅ daduyet → duyet: ${r2.affectedRows} dòng`);

    // Bước 3: Đổi lại sang ENUM mới
    await pool.execute(`ALTER TABLE dichvu_sinhvien MODIFY trangthai ENUM('cho','dangxuly','duyet','tuchoi') NOT NULL DEFAULT 'cho'`);
    console.log('✅ Đổi lại ENUM mới');

    // Kiểm tra kết quả
    const [rows] = await pool.execute(`SELECT trangthai, COUNT(*) as cnt FROM dichvu_sinhvien GROUP BY trangthai`);
    console.log('📊 Phân bố sau migrate:');
    rows.forEach(r => console.log(`   "${r.trangthai}": ${r.cnt} đơn`));

    const [cols] = await pool.execute(`SHOW COLUMNS FROM dichvu_sinhvien WHERE Field = 'trangthai'`);
    console.log('✅ ENUM mới:', cols[0].Type);
  } catch (e) {
    console.error('Lỗi:', e.message);
  }
  process.exit(0);
}

run();
