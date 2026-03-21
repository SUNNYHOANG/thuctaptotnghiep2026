import express from 'express';
import pool from '../config/database.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// Tạo bảng audit_log nếu chưa có
async function ensureTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100),
      role VARCHAR(50),
      action VARCHAR(100) NOT NULL,
      entity VARCHAR(100),
      entity_id VARCHAR(100),
      detail TEXT,
      ip VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at),
      INDEX idx_username (username),
      INDEX idx_action (action)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}
ensureTable().catch(() => {});

// Middleware ghi log — dùng nội bộ
export async function writeAuditLog({ username, role, action, entity, entity_id, detail, ip }) {
  try {
    await pool.execute(
      'INSERT INTO audit_log (username, role, action, entity, entity_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username || null, role || null, action, entity || null, entity_id ? String(entity_id) : null, detail || null, ip || null]
    );
  } catch (_) {}
}

// GET /api/audit-log — lấy danh sách log (admin)
router.get('/', requireRole(['admin']), async (req, res) => {
  try {
    const { username, action, entity, from, to, limit = 100, offset = 0 } = req.query;
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    if (username) { query += ' AND username LIKE ?'; params.push(`%${username}%`); }
    if (action)   { query += ' AND action LIKE ?';   params.push(`%${action}%`); }
    if (entity)   { query += ' AND entity = ?';      params.push(entity); }
    if (from)     { query += ' AND created_at >= ?'; params.push(from); }
    if (to)       { query += ' AND created_at <= ?'; params.push(to); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.execute(query, params);

    // Đếm tổng
    let countQuery = 'SELECT COUNT(*) as total FROM audit_log WHERE 1=1';
    const countParams = params.slice(0, -2);
    if (username) countQuery += ' AND username LIKE ?';
    if (action)   countQuery += ' AND action LIKE ?';
    if (entity)   countQuery += ' AND entity = ?';
    if (from)     countQuery += ' AND created_at >= ?';
    if (to)       countQuery += ' AND created_at <= ?';
    const [countRows] = await pool.execute(countQuery, countParams);

    res.json({ data: rows, total: countRows[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/audit-log/clear — xóa log cũ hơn N ngày (admin)
router.delete('/clear', requireRole(['admin']), async (req, res) => {
  try {
    const days = Number(req.query.days) || 90;
    const [result] = await pool.execute(
      'DELETE FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );
    res.json({ deleted: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
