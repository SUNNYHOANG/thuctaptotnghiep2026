import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const DB = process.env.DB_NAME || 'dkhp1';
const tables = ['phuckhao','lophoc','bangdiem','dangkyhocphan','dichvu_sinhvien'];

async function check() {
  for (const t of tables) {
    try {
      const [rows] = await pool.execute(
        `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [DB, t]
      );
      console.log(`\nTable: ${t} -> ${rows.length} columns`);
      for (const r of rows) console.log('  ', r.COLUMN_NAME, r.DATA_TYPE);
    } catch (err) {
      console.error(`\nError checking table ${t}:`, err.message);
    }
  }
  await pool.end();
}

check().catch(e => { console.error(e); process.exit(1); });
