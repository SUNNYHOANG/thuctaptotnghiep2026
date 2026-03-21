import pool from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'database/08_fix_dichvu_trangthai.sql'),
    'utf8'
  );
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await pool.execute(stmt);
      console.log('OK:', stmt.substring(0, 60));
    } catch (e) {
      console.error('ERR:', e.message, '\n  SQL:', stmt.substring(0, 80));
    }
  }
  process.exit(0);
}

run();
