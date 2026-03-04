/**
 * Chạy UPDATE_PATCH_COMPLETE.sql - cập nhật DB đã tồn tại
 * Cách chạy: node run-update-patch.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const dbName = process.env.DB_NAME || 'dkhp1';
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  charset: 'utf8mb4',
  multipleStatements: true
};

async function run() {
  const sqlPath = path.join(__dirname, 'database', 'UPDATE_PATCH_COMPLETE.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Không tìm thấy file database/UPDATE_PATCH_COMPLETE.sql');
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('Đang kết nối MySQL và áp dụng patch...');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await conn.query(sql);
    console.log('✅ Đã cập nhật database hoàn chỉnh.');
  } catch (err) {
    if (err.code === 'ER_DBACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED') {
      console.error('❌ Không kết nối được MySQL. Kiểm tra .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).');
    } else {
      console.error('❌ Lỗi:', err.message);
    }
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

run();
