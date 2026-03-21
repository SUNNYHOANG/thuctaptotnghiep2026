import pool from './config/database.js';

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('Bắt đầu migration phuckhao...');

    // 1. Xem các FK hiện tại
    const [fks] = await conn.execute(`
      SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'phuckhao'
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    console.log('FK hiện tại:', fks.map(f => f.CONSTRAINT_NAME));

    // 2. Drop FK mabangdiem và malophoc
    for (const fk of fks) {
      const name = fk.CONSTRAINT_NAME;
      if (name.includes('bangdiem') || name.includes('lophoc') || name === 'phuckhao_ibfk_1' || name === 'phuckhao_ibfk_3') {
        try {
          await conn.execute(`ALTER TABLE phuckhao DROP FOREIGN KEY \`${name}\``);
          console.log(`✓ Dropped FK: ${name}`);
        } catch (e) {
          console.log(`  Skip FK ${name}: ${e.message}`);
        }
      }
    }

    // 3. Kiểm tra cột mamonhoc đã tồn tại chưa
    const [cols] = await conn.execute(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'phuckhao'
    `);
    const colNames = cols.map(c => c.COLUMN_NAME);
    console.log('Cột hiện tại:', colNames);

    // 4. Thêm cột mamonhoc nếu chưa có
    if (!colNames.includes('mamonhoc')) {
      await conn.execute(`ALTER TABLE phuckhao ADD COLUMN mamonhoc INT NULL AFTER mssv`);
      console.log('✓ Thêm cột mamonhoc');
      await conn.execute(`ALTER TABLE phuckhao ADD FOREIGN KEY (mamonhoc) REFERENCES monhoc(mamonhoc) ON DELETE SET NULL`);
      console.log('✓ Thêm FK mamonhoc -> monhoc');
    } else {
      console.log('  mamonhoc đã tồn tại, bỏ qua');
    }

    // 5. Bỏ NOT NULL cho mabangdiem và malophoc (để không bắt buộc nữa)
    try {
      await conn.execute(`ALTER TABLE phuckhao MODIFY COLUMN mabangdiem INT NULL`);
      console.log('✓ mabangdiem -> nullable');
    } catch (e) { console.log('  mabangdiem:', e.message); }

    try {
      await conn.execute(`ALTER TABLE phuckhao MODIFY COLUMN malophoc INT NULL`);
      console.log('✓ malophoc -> nullable');
    } catch (e) { console.log('  malophoc:', e.message); }

    console.log('\nMigration hoàn tất!');
  } catch (e) {
    console.error('Lỗi:', e.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
