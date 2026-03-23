import pool from '../config/database.js';

async function migrate() {
  const conn = await pool.getConnection();
  try {
    // Thêm cột trangthai nếu chưa có
    await conn.execute(`
      ALTER TABLE khenthuong_kyluat
      ADD COLUMN IF NOT EXISTS trangthai ENUM('cho_duyet','da_duyet','tu_choi') NOT NULL DEFAULT 'cho_duyet'
    `).catch(() => {});

    // Thêm cột makhoa nếu chưa có
    await conn.execute(`
      ALTER TABLE khenthuong_kyluat
      ADD COLUMN IF NOT EXISTS makhoa VARCHAR(50) DEFAULT NULL
    `).catch(() => {});

    // Thêm cột muc nếu chưa có
    await conn.execute(`
      ALTER TABLE khenthuong_kyluat
      ADD COLUMN IF NOT EXISTS muc VARCHAR(100) DEFAULT NULL
    `).catch(() => {});

    // Các bản ghi cũ (do admin/ctsv tạo) mặc định là đã duyệt
    await conn.execute(`
      UPDATE khenthuong_kyluat SET trangthai = 'da_duyet' WHERE trangthai = 'cho_duyet' AND nguoilap IS NOT NULL
    `);

    console.log('✅ Migration khenthuong_kyluat hoàn tất.');
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate().catch(e => { console.error(e); process.exit(1); });
