/**
 * run_setup_complete.js
 * Chạy toàn bộ file SETUP_COMPLETE.sql để khởi tạo / cập nhật database
 *
 * Cách dùng:
 *   node backend/scripts/run_setup_complete.js
 *   (chạy từ thư mục gốc project)
 *
 * Hoặc từ thư mục backend:
 *   node scripts/run_setup_complete.js
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url).pathname });
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Đường dẫn tới file SQL
const SQL_FILE = path.resolve(__dirname, '../database/SETUP_COMPLETE.sql');

async function run() {
  // Kết nối KHÔNG chỉ định database (vì SQL sẽ tự CREATE DATABASE + USE)
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,          // bắt buộc để chạy nhiều câu lệnh
    charset: 'utf8mb4',
  });

  console.log('✅ Kết nối MySQL thành công');
  console.log(`📄 Đọc file: ${SQL_FILE}\n`);

  const sql = fs.readFileSync(SQL_FILE, 'utf8');

  try {
    await conn.query(sql);
    console.log('\n🎉 Khởi tạo database hoàn tất!');
  } catch (err) {
    console.error('\n❌ Lỗi khi chạy SQL:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
