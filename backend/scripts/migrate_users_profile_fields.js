import pool from '../config/database.js';

async function migrate() {
  const cols = [
    { name: 'sodienthoai', def: 'VARCHAR(20) NULL' },
    { name: 'diachi',      def: 'TEXT NULL' },
  ];

  for (const col of cols) {
    try {
      await pool.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
      console.log(`✅ Đã thêm cột ${col.name}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`ℹ️  Cột ${col.name} đã tồn tại`);
      } else {
        console.error(`❌ Lỗi cột ${col.name}:`, err.message);
      }
    }
  }

  console.log('Migration hoàn tất.');
  process.exit(0);
}

migrate();
