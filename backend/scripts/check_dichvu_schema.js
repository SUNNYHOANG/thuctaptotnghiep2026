import pool from '../config/database.js';

async function run() {
  try {
    const [cols] = await pool.execute(`SHOW COLUMNS FROM dichvu_sinhvien`);
    const trangthaiCol = cols.find(c => c.Field === 'trangthai');
    console.log('trangthai column:', JSON.stringify(trangthaiCol, null, 2));

    const [rows] = await pool.execute(`SELECT madon, trangthai FROM dichvu_sinhvien LIMIT 10`);
    console.log('Sample rows:', JSON.stringify(rows));
  } catch (e) {
    console.error('Lỗi:', e.message);
  }
  process.exit(0);
}
run();
