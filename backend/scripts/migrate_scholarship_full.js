import pool from '../config/database.js';

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Bắt đầu migration sinhvien_hocbong (full)...');

    const alters = [
      [`mucxeploai ENUM('xuat_sac','gioi','kha','trung_binh','khong_du_dieu_kien') DEFAULT NULL`,
       'mucxeploai'],
      [`nguoiduyet VARCHAR(50) DEFAULT NULL`, 'nguoiduyet'],
      [`ngayduyet DATETIME DEFAULT NULL`, 'ngayduyet'],
      [`ghichu TEXT DEFAULT NULL`, 'ghichu'],
      [`nguoi_khoa_duyet VARCHAR(50) DEFAULT NULL`, 'nguoi_khoa_duyet'],
      [`ngay_khoa_duyet DATETIME DEFAULT NULL`, 'ngay_khoa_duyet'],
      [`ghichu_khoa TEXT DEFAULT NULL`, 'ghichu_khoa'],
    ];

    for (const [colDef, colName] of alters) {
      try {
        await conn.execute(
          `ALTER TABLE sinhvien_hocbong ADD COLUMN IF NOT EXISTS ${colDef}`
        );
        console.log(`✓ Cột ${colName}`);
      } catch (e) {
        console.log(`  (bỏ qua ${colName}: ${e.message})`);
      }
    }

    // Cập nhật ENUM trangthai để bao gồm đủ các trạng thái
    try {
      await conn.execute(`
        ALTER TABLE sinhvien_hocbong
        MODIFY COLUMN trangthai 
          ENUM('cho_duyet','cho_khoa_duyet','khoa_da_duyet','khoa_tuchoi','duyet','tuchoi')
          DEFAULT 'cho_khoa_duyet'
      `);
      console.log('✓ ENUM trangthai');
    } catch (e) {
      console.log(`  (bỏ qua trangthai ENUM: ${e.message})`);
    }

    console.log('\n✅ Migration hoàn thành!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
