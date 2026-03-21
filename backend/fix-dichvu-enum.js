import pool from './config/database.js';

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('Bắt đầu migration...');

    await conn.execute(
      "ALTER TABLE dichvu_sinhvien MODIFY COLUMN trangthai ENUM('choduyet', 'dangxuly', 'daduyet', 'tuchoi') DEFAULT 'choduyet'"
    );
    console.log('✓ ALTER TABLE OK');

    const [r1] = await conn.execute(
      "UPDATE dichvu_sinhvien SET trangthai = 'choduyet' WHERE trangthai = 'cho'"
    );
    console.log('✓ Migrate cho -> choduyet:', r1.affectedRows, 'rows');

    const [r2] = await conn.execute(
      "UPDATE dichvu_sinhvien SET trangthai = 'daduyet' WHERE trangthai = 'duyet'"
    );
    console.log('✓ Migrate duyet -> daduyet:', r2.affectedRows, 'rows');

    console.log('Migration hoàn tất!');
  } catch (e) {
    console.error('Lỗi:', e.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
