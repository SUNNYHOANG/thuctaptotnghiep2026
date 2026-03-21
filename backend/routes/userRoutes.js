import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all users with filters (staff: admin/giangvien/ctsv/khoa)
router.get('/', async (req, res) => {
  try {
    const { role, status } = req.query;

    let sql = 'SELECT id, username, hoten, email, role, makhoa, status, created_at FROM users WHERE 1=1';
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

// GET /profile/me - Lấy thông tin cá nhân của user đang đăng nhập (giảng viên, ctsv, admin)
router.get('/profile/me', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });

    const [rows] = await pool.execute(
      'SELECT id, username, hoten, email, role, makhoa, status, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /profile/me - Cập nhật thông tin cá nhân
router.put('/profile/me', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });

    const { hoten, email, password } = req.body;
    const updates = [];
    const values = [];

    if (hoten !== undefined) { updates.push('hoten = ?'); values.push(hoten); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email || null); }
    if (password && String(password).trim()) { updates.push('password = ?'); values.push(password.trim()); }

    if (updates.length === 0) return res.status(400).json({ error: 'Không có dữ liệu cập nhật' });

    values.push(userId);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.execute(
      'SELECT id, username, hoten, email, role, makhoa, status FROM users WHERE id = ?',
      [userId]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all students - MUST come before /:id route
router.get('/students/all', async (req, res) => {
  try {
    const user = req.user || {};
    const role = user.role || req.headers['x-user-role'] || '';
    const makhoa = user.makhoa || req.headers['x-user-makhoa'] || null;

    let sql = 'SELECT mssv, mssv as id, hoten as username, hoten, malop, makhoa, tinhtrang, ngaysinh, gioitinh, khoahoc, bacdaotao, nganh, diachi, quequan FROM sinhvien WHERE 1=1';
    const params = [];

    // Khoa_Manager chỉ thấy sinh viên của khoa mình
    if (role === 'khoa') {
      if (!makhoa) {
        return res.status(403).json({ error: 'Tài khoản khoa thiếu thông tin makhoa' });
      }
      sql += ' AND makhoa = ?';
      params.push(makhoa);
    }

    sql += ' ORDER BY mssv DESC';
    const [rows] = await pool.execute(sql, params);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sinh viên: xem hồ sơ cá nhân (chính mình hoặc admin/ctsv/khoa)
router.get('/students/profile/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const user = req.user || {};
    const role = user.role || req.headers['x-user-role'] || '';
    const makhoa = user.makhoa || req.headers['x-user-makhoa'] || null;

    if (user.role === 'sinhvien' && user.mssv !== mssv) {
      return res.status(403).json({ error: 'Chỉ được xem hồ sơ của chính mình' });
    }

    const [rows] = await pool.execute(
      `SELECT
        mssv,
        hoten,
        malop,
        makhoa,
        diachi,
        ngaysinh,
        quequan,
        tinhtrang,
        gioitinh,
        khoahoc,
        bacdaotao,
        nganh,
        created_at,
        updated_at
      FROM sinhvien
      WHERE mssv = ?`,
      [mssv]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });

    // Khoa_Manager chỉ được xem sinh viên thuộc khoa mình
    if (role === 'khoa') {
      if (!makhoa || rows[0].makhoa !== makhoa) {
        return res.status(403).json({ error: 'Không có quyền truy cập sinh viên khoa khác' });
      }
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sinh viên: cập nhật hồ sơ; admin/ctsv có thể sửa bất kỳ
router.put('/students/profile/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const user = req.user || {};
    if (user.role === 'sinhvien' && user.mssv !== mssv) {
      return res.status(403).json({ error: 'Chỉ được sửa hồ sơ của chính mình' });
    }

    const {
      hoten,
      malop,
      makhoa,
      diachi,
      ngaysinh,
      quequan,
      tinhtrang,
      gioitinh,
      khoahoc,
      bacdaotao,
      nganh,
    } = req.body || {};

    const updates = [];
    const values = [];

    const addIfDefined = (fieldName, value) => {
      if (value !== undefined) {
        updates.push(`${fieldName} = ?`);
        values.push(value);
      }
    };

    addIfDefined('hoten', hoten);
    addIfDefined('malop', malop);
    addIfDefined('makhoa', makhoa);
    addIfDefined('diachi', diachi);
    addIfDefined('ngaysinh', ngaysinh);
    addIfDefined('quequan', quequan);
    addIfDefined('tinhtrang', tinhtrang);
    addIfDefined('gioitinh', gioitinh);
    addIfDefined('khoahoc', khoahoc);
    addIfDefined('bacdaotao', bacdaotao);
    addIfDefined('nganh', nganh);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu cập nhật' });
    }

    values.push(mssv);
    await pool.execute(`UPDATE sinhvien SET ${updates.join(', ')} WHERE mssv = ?`, values);

    const [rows] = await pool.execute(
      `SELECT
        mssv,
        hoten,
        malop,
        makhoa,
        diachi,
        ngaysinh,
        quequan,
        tinhtrang,
        gioitinh,
        khoahoc,
        bacdaotao,
        nganh,
        created_at,
        updated_at
      FROM sinhvien
      WHERE mssv = ?`,
      [mssv]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /students/incomplete-profile - Sinh viên thiếu thông tin hồ sơ bắt buộc
// Phân quyền: admin, ctsv
router.get('/students/incomplete-profile', async (req, res) => {
  try {
    const role = (req.user && req.user.role) || req.headers['x-user-role'] || '';
    if (!['admin', 'ctsv'].includes(role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập chức năng này' });
    }

    const sql = `
      SELECT mssv, hoten, malop, makhoa, ngaysinh, gioitinh
      FROM sinhvien
      WHERE hoten IS NULL OR hoten = ''
         OR ngaysinh IS NULL
         OR gioitinh IS NULL OR gioitinh = ''
         OR malop IS NULL OR malop = ''
         OR makhoa IS NULL OR makhoa = ''
    `;
    const [rows] = await pool.execute(sql);
    res.json({ data: rows, total: rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại' });
  }
});

// Thêm sinh viên mới
router.post('/students', async (req, res) => {
  try {
    const { mssv, hoten, malop, makhoa, ngaysinh, gioitinh, diachi, quequan, tinhtrang, khoahoc, bacdaotao, nganh } = req.body;
    if (!mssv || !String(mssv).trim()) {
      return res.status(400).json({ error: 'MSSV không được để trống' });
    }
    const mk = String(mssv).trim();
    const [existing] = await pool.execute('SELECT mssv FROM sinhvien WHERE mssv = ?', [mk]);
    if (existing.length > 0) {
      return res.status(400).json({ error: `MSSV "${mk}" đã tồn tại` });
    }
    await pool.execute(
      `INSERT INTO sinhvien (mssv, hoten, malop, makhoa, ngaysinh, gioitinh, diachi, quequan, tinhtrang, khoahoc, bacdaotao, nganh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mk, hoten || null, malop || null, makhoa || null, ngaysinh || null, gioitinh || null,
       diachi || null, quequan || null, tinhtrang || 'Đang học', khoahoc || null, bacdaotao || null, nganh || null]
    );
    const [rows] = await pool.execute('SELECT * FROM sinhvien WHERE mssv = ?', [mk]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật sinh viên
router.put('/students/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const { hoten, malop, makhoa, ngaysinh, gioitinh, diachi, quequan, tinhtrang, khoahoc, bacdaotao, nganh } = req.body;

    const updates = [];
    const values = [];
    const addIf = (col, val) => { if (val !== undefined) { updates.push(`${col} = ?`); values.push(val); } };

    addIf('hoten', hoten);
    addIf('malop', malop);
    addIf('makhoa', makhoa);
    addIf('ngaysinh', ngaysinh);
    addIf('gioitinh', gioitinh);
    addIf('diachi', diachi);
    addIf('quequan', quequan);
    addIf('tinhtrang', tinhtrang);
    addIf('khoahoc', khoahoc);
    addIf('bacdaotao', bacdaotao);
    addIf('nganh', nganh);

    if (updates.length === 0) return res.status(400).json({ error: 'Không có dữ liệu cập nhật' });

    values.push(mssv);
    await pool.execute(`UPDATE sinhvien SET ${updates.join(', ')} WHERE mssv = ?`, values);
    const [rows] = await pool.execute('SELECT * FROM sinhvien WHERE mssv = ?', [mssv]);
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Xóa sinh viên
router.delete('/students/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const [result] = await pool.execute('DELETE FROM sinhvien WHERE mssv = ?', [mssv]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    res.json({ message: 'Xóa sinh viên thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, hoten, email, role, makhoa, status, created_at FROM users WHERE id = ?',
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
    const { username, password, hoten, email, role, magiangvien, makhoa, status } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Thiếu username, password hoặc role' });
    }

    // Validate makhoa bắt buộc khi role='khoa' hoặc 'giangvien'
    if (role === 'khoa' || role === 'giangvien') {
      const mkVal = makhoa ? String(makhoa).trim() : '';
      if (!mkVal) {
        return res.status(400).json({ error: `Vai trò "${role}" bắt buộc phải có Mã Khoa.` });
      }
      // Validate makhoa tồn tại trong bảng sinhvien
      const [makhoaRows] = await pool.execute(
        'SELECT makhoa FROM sinhvien WHERE makhoa = ? LIMIT 1',
        [mkVal]
      );
      if (makhoaRows.length === 0) {
        return res.status(400).json({ error: `Mã khoa "${mkVal}" không tồn tại trong hệ thống sinh viên.` });
      }
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username đã tồn tại' });
    }

    const mkFinal = (makhoa && String(makhoa).trim()) ? String(makhoa).trim() : null;

    const [result] = await pool.execute(
      'INSERT INTO users (username, password, hoten, email, role, makhoa, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, password, hoten || null, email || null, role, mkFinal, status || 'active']
    );

    res.status(201).json({
      id: result.insertId,
      username,
      hoten: hoten || null,
      email: email || null,
      role,
      makhoa: mkFinal,
      status: status || 'active',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { hoten, email, role, status, magiangvien, makhoa, password } = req.body;

    const updates = [];
    const values = [];

    if (hoten !== undefined) { updates.push('hoten = ?'); values.push(hoten); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email || null); }
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (magiangvien !== undefined) { /* bỏ qua - cột không tồn tại */ }

    // Cập nhật mật khẩu nếu được gửi lên
    if (password && String(password).trim() !== '') {
      updates.push('password = ?');
      values.push(password.trim());
    }

    if (makhoa !== undefined) {
      // Validate makhoa tồn tại trong bảng sinhvien nếu không null/rỗng
      const mkVal = makhoa ? String(makhoa).trim() : null;
      if (mkVal) {
        const [mkRows] = await pool.execute(
          'SELECT makhoa FROM sinhvien WHERE makhoa = ? LIMIT 1',
          [mkVal]
        );
        if (mkRows.length === 0) {
          return res.status(400).json({ error: `Mã khoa "${mkVal}" không tồn tại trong hệ thống sinh viên.` });
        }
      }
      updates.push('makhoa = ?');
      values.push(mkVal);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu cập nhật' });
    }

    values.push(req.params.id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    // Trả về user đã cập nhật
    const [rows] = await pool.execute(
      'SELECT id, username, hoten, email, role, makhoa, status FROM users WHERE id = ?',
      [req.params.id]
    );
    res.json(rows[0] || { message: 'Cập nhật thành công' });
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
