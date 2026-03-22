import pool from '../config/database.js';

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Bắt đầu migration sinhvien_hocbong...');

    // Thêm mucxeploai
    await conn.execute(`
      ALTER TABLE sinhvien_hocbong
      ADD COLUMN IF NOT EXISTS mucxeploai 
        ENUM('xuat_sac','gioi','kha','trung_binh','khong_du_dieu_kien') 
        DEFAULT NULL
    `);
    console.log('✓ Thêm cột mucxeploai');

    // Thêm nguoiduyet
    await conn.execute(`
      ALTER TABLE sinhvien_hocbong
      ADD COLUMN IF NOT EXISTS nguoiduyet VARCHAR(50) DEFAULT NULL
    `);
    console.log('✓ Thêm cột nguoiduyet');

    // Thêm ngayduyet
    await conn.execute(`
      ALTER TABLE sinhvien_hocbong
      ADD COLUMN IF NOT EXISTS ngayduyet DATETIME DEFAULT NULL
    `);
    console.log('✓ Thêm cột ngayduyet');

    // Thêm ghichu (lý do từ chối)
    await conn.execute(`
      ALTER TABLE sinhvien_hocbong
      ADD COLUMN IF NOT EXISTS ghichu TEXT DEFAULT NULL
    `);
    console.log('✓ Thêm cột ghichu');

    // Đảm bảo trangthai có đủ giá trị
    await conn.execute(`
      ALTER TABLE sinhvien_hocbong
      MODIFY COLUMN trangthai ENUM('cho_duyet','duyet','tuchoi') DEFAULT 'cho_duyet'
    `);
    console.log('✓ Cập nhật ENUM trangthai');

    console.log('\n✅ Migration hoàn thành!');
  } catch (err) {
    console.error('❌ Lỗi migration:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
