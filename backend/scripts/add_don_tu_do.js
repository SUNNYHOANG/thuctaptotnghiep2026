import pool from '../config/database.js';

async function run() {
  try {
    // Thêm cột tieude vào dichvu_sinhvien nếu chưa có
    await pool.execute(`
      ALTER TABLE dichvu_sinhvien
      ADD COLUMN IF NOT EXISTS tieude VARCHAR(500) NULL AFTER maloaidichvu
    `).catch(() => {
      // MySQL < 8.0 không hỗ trợ IF NOT EXISTS trong ALTER
      return pool.execute(`ALTER TABLE dichvu_sinhvien ADD COLUMN tieude VARCHAR(500) NULL AFTER maloaidichvu`);
    });
    console.log('✅ Đã thêm cột tieude vào dichvu_sinhvien');
  } catch (e) {
    if (e.message?.includes("Duplicate column")) {
      console.log('ℹ️  Cột tieude đã tồn tại, bỏ qua.');
    } else {
      console.error('Lỗi thêm cột:', e.message);
    }
  }

  try {
    // Thêm loại "Đơn tự do" nếu chưa có
    const [existing] = await pool.execute(
      "SELECT maloaidichvu FROM loai_dichvu WHERE tendichvu = 'Đơn tự do (nội dung tùy ý)' LIMIT 1"
    );
    if (existing.length === 0) {
      await pool.execute(
        "INSERT INTO loai_dichvu (tendichvu, mota, thutu) VALUES ('Đơn tự do (nội dung tùy ý)', 'Sinh viên tự soạn đơn với nội dung tùy ý', 99)"
      );
      console.log('✅ Đã thêm loại dịch vụ "Đơn tự do"');
    } else {
      console.log('ℹ️  Loại "Đơn tự do" đã tồn tại, bỏ qua.');
    }
  } catch (e) {
    console.error('Lỗi thêm loại dịch vụ:', e.message);
  }

  process.exit(0);
}

run();
