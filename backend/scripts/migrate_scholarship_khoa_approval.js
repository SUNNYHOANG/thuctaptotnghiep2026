/**
 * Thêm cột khoa duyệt vào sinhvien_hocbong
 * Usage: node scripts/migrate_scholarship_khoa_approval.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dkhp1',
};

async function run() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Kết nối DB:', config.database);

  // Thêm cột nếu chưa có
  const alterations = [
    `ALTER TABLE sinhvien_hocbong
     MODIFY COLUMN trangthai ENUM('cho_khoa_duyet','khoa_da_duyet','khoa_tuchoi','duyet','tuchoi')
     NOT NULL DEFAULT 'cho_khoa_duyet'`,
    `ALTER TABLE sinhvien_hocbong ADD COLUMN IF NOT EXISTS nguoi_khoa_duyet VARCHAR(100) NULL`,
    `ALTER TABLE sinhvien_hocbong ADD COLUMN IF NOT EXISTS ngay_khoa_duyet DATETIME NULL`,
    `ALTER TABLE sinhvien_hocbong ADD COLUMN IF NOT EXISTS ghichu_khoa TEXT NULL`,
  ];

  for (const sql of alterations) {
    try {
      await conn.execute(sql);
      console.log('✅', sql.substring(0, 60) + '...');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Cột đã tồn tại, bỏ qua');
      } else {
        console.error('❌', err.message);
      }
    }
  }

  // Cập nhật các bản ghi cũ có trangthai='cho_duyet' → 'cho_khoa_duyet'
  const [r1] = await conn.execute(
    `UPDATE sinhvien_hocbong SET trangthai = 'cho_khoa_duyet' WHERE trangthai = 'cho_duyet'`
  );
  console.log(`✅ Cập nhật ${r1.affectedRows} bản ghi cho_duyet → cho_khoa_duyet`);

  // Cập nhật 'duyet' cũ → giữ nguyên (đã duyệt bởi CTSV, coi như đã qua khoa)
  const [r2] = await conn.execute(
    `UPDATE sinhvien_hocbong SET trangthai = 'duyet' WHERE trangthai = 'duyet'`
  );

  console.log('\n✅ Migration hoàn tất!');
  await conn.end();
}

run().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
