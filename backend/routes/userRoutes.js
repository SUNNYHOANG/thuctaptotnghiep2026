import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all users with filters (staff: admin/giangvien)
router.get('/', async (req, res) => {
  try {
    const { role, status } = req.query;
    
    // Query staff users (admin, giangvien)
    let sql = 'SELECT id, username, hoten, email, role, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    const [rows] = await pool.execute(sql + ' ORDER BY created_at DESC', params);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all students - MUST come before /:id route
router.get('/students/all', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT mssv as id, hoten as username, hoten, malop, makhoa, NULL as email, "sinhvien" as role, "active" as status, NULL as created_at FROM sinhvien ORDER BY mssv DESC'
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sinh viên: xem hồ sơ cá nhân (chính mình hoặc admin/ctsv)
router.get('/students/profile/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const user = req.user || {};
    if (user.role === 'sinhvien' && user.mssv !== mssv) {
      return res.status(403).json({ error: 'Chỉ được xem hồ sơ của chính mình' });
    }
    const [rows] = await pool.execute(
      'SELECT mssv, hoten, malop, makhoa, created_at, updated_at FROM sinhvien WHERE mssv = ?',
      [mssv]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sinh viên: cập nhật hồ sơ (chỉ hoten, malop, makhoa); admin có thể sửa bất kỳ
router.put('/students/profile/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const user = req.user || {};
    if (user.role === 'sinhvien' && user.mssv !== mssv) {
      return res.status(403).json({ error: 'Chỉ được sửa hồ sơ của chính mình' });
    }
    const { hoten, malop, makhoa } = req.body || {};
    const updates = [];
    const values = [];
    if (hoten !== undefined) {
      updates.push('hoten = ?');
      values.push(hoten);
    }
    if (malop !== undefined) {
      updates.push('malop = ?');
      values.push(malop);
    }
    if (makhoa !== undefined) {
      updates.push('makhoa = ?');
      values.push(makhoa);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu cập nhật' });
    }
    values.push(mssv);
    await pool.execute(`UPDATE sinhvien SET ${updates.join(', ')} WHERE mssv = ?`, values);
    const [rows] = await pool.execute(
      'SELECT mssv, hoten, malop, makhoa, created_at, updated_at FROM sinhvien WHERE mssv = ?',
      [mssv]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, hoten, email, role, magiangvien, status, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { username, password, hoten, email, role, magiangvien, status } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Thiếu username, password hoặc role' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username đã tồn tại' });
    }

    const [result] = await pool.execute(
      'INSERT INTO users (username, password, hoten, email, role, magiangvien, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, password, hoten || null, email || null, role, magiangvien || null, status || 'active']
    );

    res.status(201).json({
      id: result.insertId,
      username,
      hoten,
      email,
      role,
      status: status || 'active'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { hoten, email, role, status, magiangvien } = req.body;

    const updates = [];
    const values = [];

    if (hoten !== undefined) {
      updates.push('hoten = ?');
      values.push(hoten);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (magiangvien !== undefined) {
      updates.push('magiangvien = ?');
      values.push(magiangvien);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu cập nhật' });
    }

    values.push(req.params.id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    await pool.execute(sql, values);
    res.json({ message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
