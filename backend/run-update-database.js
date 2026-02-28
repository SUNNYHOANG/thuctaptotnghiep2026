/**
 * Chạy script UPDATE_ALL_DATABASE.sql bằng Node.js (mysql2)
 * Cách chạy: node run-update-database.js
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
  charset: 'utf8mb4'
};

async function run() {
  const sqlPath = path.join(__dirname, 'database', 'UPDATE_ALL_DATABASE.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Không tìm thấy file database/UPDATE_ALL_DATABASE.sql');
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('Đang kết nối MySQL...');

    const dropFirst = process.argv.includes('--fresh');
    if (dropFirst) {
      await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
      console.log('Đã xóa database cũ (--fresh).');
    }
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.end();
    conn = null;

    conn = await mysql.createConnection({
      ...config,
      database: dbName,
      multipleStatements: true
    });
    console.log('Đang chạy script SQL trong database', dbName, '...');

    let sql = fs.readFileSync(sqlPath, 'utf8');
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS dkhp1[^;]+;/i, '');
    sql = sql.replace(/USE dkhp1\s*;/i, '');
    sql = sql.replace(/SET NAMES utf8mb4;\s*SET CHARACTER SET utf8mb4;\s*/i, '');
    await conn.query(sql);
    console.log('Đã chạy xong UPDATE_ALL_DATABASE.sql.');
  } catch (err) {
    console.error('Lỗi:', err.message);
    if (err.sql) console.error('SQL (đoạn lỗi):', String(err.sql).substring(0, 300));
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

run();
