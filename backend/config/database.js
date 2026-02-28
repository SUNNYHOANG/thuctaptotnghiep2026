import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const rawPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dkhp1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Chuẩn hóa bind params: undefined -> null (MySQL2 không chấp nhận undefined)
function sanitizeParams(params) {
  if (params == null || typeof params !== 'object') return params;
  return Array.isArray(params)
    ? params.map((p) => (p === undefined ? null : p))
    : Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, v === undefined ? null : v])
      );
}

const pool = {
  execute(sql, params) {
    return rawPool.execute(sql, params == null ? [] : sanitizeParams(params));
  },
  query(sql, params) {
    return rawPool.query(sql, params == null ? [] : sanitizeParams(params));
  },
  getConnection: () => rawPool.getConnection(),
  end: () => rawPool.end()
};

export default pool;
