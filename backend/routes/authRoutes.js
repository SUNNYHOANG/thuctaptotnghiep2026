import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

async function selectStaffByUsernameAndPassword(username, password) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, hoten, role, magiangvien, status FROM users WHERE username = ? AND password = ? AND status = ?',
      [username, password, 'active']
    );
    return rows;
  } catch (error) {
    // Một số schema cũ không có cột `status`
    if (error && error.code === 'ER_BAD_FIELD_ERROR') {
      const [rows] = await pool.execute(
        'SELECT id, username, hoten, role, magiangvien FROM users WHERE username = ? AND password = ?',
        [username, password]
      );
      return rows;
    }
    throw error;
  }
}

async function selectStaffByUsernameForFaceLogin(username) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, hoten, role, magiangvien, status FROM users WHERE username = ? AND status = ?',
      [username, 'active']
    );
    return rows;
  } catch (error) {
    if (error && error.code === 'ER_BAD_FIELD_ERROR') {
      const [rows] = await pool.execute(
        'SELECT id, username, hoten, role, magiangvien FROM users WHERE username = ?',
        [username]
      );
      return rows;
    }
    throw error;
  }
}

async function selectStaffById(id) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, hoten, role, magiangvien, status FROM users WHERE id = ?',
      [id]
    );
    return rows;
  } catch (error) {
    if (error && error.code === 'ER_BAD_FIELD_ERROR') {
      const [rows] = await pool.execute(
        'SELECT id, username, hoten, role, magiangvien FROM users WHERE id = ?',
        [id]
      );
      return rows;
    }
    throw error;
  }
}

// Đăng ký sinh viên
router.post('/register', async (req, res) => {
  try {
    const { mssv, hoten, malop, makhoa, password } = req.body;

    if (!mssv || !hoten || !password) {
      return res.status(400).json({ error: 'Thiếu mssv, họ tên hoặc mật khẩu' });
    }

    const [existing] = await pool.execute(
      'SELECT mssv FROM sinhvien WHERE mssv = ?',
      [mssv]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Mã sinh viên đã tồn tại' });
    }

    // malop phải tồn tại trong lophoc (FK) và không được null
    let validMalop = null;
    if (malop) {
      const [lopRows] = await pool.execute(
        'SELECT malop FROM lophoc WHERE malop = ? LIMIT 1',
        [malop]
      );
      if (lopRows.length > 0) validMalop = lopRows[0].malop;
    }
    if (!validMalop) {
      // Lấy lớp đầu tiên làm mặc định
      const [defaultRows] = await pool.execute('SELECT malop FROM lophoc LIMIT 1');
      if (defaultRows.length === 0) {
        return res.status(400).json({
          error: 'Chưa có lớp học. Vui lòng nhập mã lớp hợp lệ (ví dụ: CNTT01) hoặc liên hệ quản trị để thêm lớp.'
        });
      }
      validMalop = defaultRows[0].malop;
    }

    await pool.execute(
      'INSERT INTO sinhvien (mssv, hoten, malop, makhoa, password) VALUES (?, ?, ?, ?, ?)',
      [mssv, hoten, validMalop, makhoa || null, password]
    );

    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Đăng nhập (nhận username hoặc mssv - đều dùng làm mã sinh viên)
router.post('/login', async (req, res) => {
  try {
    const { mssv, username, password } = req.body;
    const loginId = mssv || username; // Form gửi "username", backend dùng làm mssv
    
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập mã sinh viên/tên đăng nhập và mật khẩu' });
    }
    
    const [rows] = await pool.execute(
      'SELECT mssv, hoten, malop, makhoa FROM sinhvien WHERE mssv = ? AND password = ?',
      [loginId, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Mã sinh viên hoặc mật khẩu không đúng' });
    }

    const user = { ...rows[0], role: 'sinhvien' };
    res.json({
      user,
      message: 'Đăng nhập thành công',
      access_token: 'logged-in-' + rows[0].mssv
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Đăng nhập admin / giảng viên (bảng users)
router.post('/login-staff', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập username và mật khẩu' });
    }
    const rows = await selectStaffByUsernameAndPassword(username, password);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng hoặc tài khoản đã bị vô hiệu hóa' });
    }
    const user = { ...rows[0], role: rows[0].role };
    res.json({
      user,
      message: 'Đăng nhập thành công',
      access_token: 'staff-' + rows[0].id + '-' + rows[0].role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Đăng nhập bằng khuôn mặt (không cần mật khẩu, dùng cho hệ thống nhận diện khuôn mặt tin cậy)
// Body: { identifier } - có thể là mssv (sinh viên) hoặc username (staff)
router.post('/face-login', async (req, res) => {
  try {
    const { identifier } = req.body || {};
    if (!identifier) {
      return res.status(400).json({ error: 'Thiếu identifier (mssv hoặc username)' });
    }

    // Thử tìm trong bảng sinhvien trước
    const [svRows] = await pool.execute(
      'SELECT mssv, hoten, malop, makhoa FROM sinhvien WHERE mssv = ?',
      [identifier]
    );
    if (svRows.length > 0) {
      const user = { ...svRows[0], role: 'sinhvien' };
      return res.json({
        user,
        message: 'Đăng nhập khuôn mặt (sinh viên) thành công',
        access_token: 'logged-in-' + svRows[0].mssv,
      });
    }

    // Nếu không phải sinh viên, thử tìm trong bảng users (admin/giảng viên)
    const staffRows = await selectStaffByUsernameForFaceLogin(identifier);
    if (staffRows.length > 0) {
      const user = { ...staffRows[0], role: staffRows[0].role };
      return res.json({
        user,
        message: 'Đăng nhập khuôn mặt (staff) thành công',
        access_token: 'staff-' + staffRows[0].id + '-' + staffRows[0].role,
      });
    }

    return res.status(404).json({ error: 'Không tìm thấy người dùng tương ứng với khuôn mặt này' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user from token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Thiếu token' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Token format: 'logged-in-{mssv}' for students, 'staff-{id}-{role}' for staff
    if (token.startsWith('logged-in-')) {
      const mssv = token.replace('logged-in-', '');
      const [rows] = await pool.execute(
        'SELECT mssv, hoten, malop, makhoa FROM sinhvien WHERE mssv = ?',
        [mssv]
      );
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Sinh viên không tồn tại' });
      }
      const user = { ...rows[0], role: 'sinhvien' };
      return res.json(user);
    } else if (token.startsWith('staff-')) {
      const parts = token.replace('staff-', '').split('-');
      const id = parts[0];
      const rows = await selectStaffById(id);
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Người dùng không tồn tại' });
      }
      return res.json(rows[0]);
    } else {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
