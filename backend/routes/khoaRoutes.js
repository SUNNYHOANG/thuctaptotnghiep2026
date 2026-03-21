import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// GET /api/khoa - Lấy tất cả khoa
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT makhoa, tenkhoa FROM khoa ORDER BY makhoa');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/khoa - Thêm khoa mới
router.post('/', async (req, res) => {
  try {
    const { makhoa, tenkhoa } = req.body;
    if (!makhoa || !makhoa.trim()) {
      return res.status(400).json({ error: 'Mã khoa không được để trống' });
    }
    if (!tenkhoa || !tenkhoa.trim()) {
      return res.status(400).json({ error: 'Tên khoa không được để trống' });
    }
    const mk = makhoa.trim().toUpperCase();
    const [existing] = await pool.execute('SELECT makhoa FROM khoa WHERE makhoa = ?', [mk]);
    if (existing.length > 0) {
      return res.status(400).json({ error: `Mã khoa "${mk}" đã tồn tại` });
    }
    await pool.execute('INSERT INTO khoa (makhoa, tenkhoa) VALUES (?, ?)', [mk, tenkhoa.trim()]);
    res.status(201).json({ makhoa: mk, tenkhoa: tenkhoa.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/khoa/:makhoa - Cập nhật tên khoa
router.put('/:makhoa', async (req, res) => {
  try {
    const { makhoa } = req.params;
    const { tenkhoa } = req.body;
    if (!tenkhoa || !tenkhoa.trim()) {
      return res.status(400).json({ error: 'Tên khoa không được để trống' });
    }
    const [result] = await pool.execute(
      'UPDATE khoa SET tenkhoa = ? WHERE makhoa = ?',
      [tenkhoa.trim(), makhoa]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khoa' });
    }
    res.json({ makhoa, tenkhoa: tenkhoa.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/khoa/:makhoa - Xóa khoa
router.delete('/:makhoa', async (req, res) => {
  try {
    const { makhoa } = req.params;
    const [svRows] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM sinhvien WHERE makhoa = ?',
      [makhoa]
    );
    if (svRows[0].cnt > 0) {
      return res.status(400).json({
        error: `Không thể xóa: còn ${svRows[0].cnt} sinh viên thuộc khoa này`,
      });
    }
    const [result] = await pool.execute('DELETE FROM khoa WHERE makhoa = ?', [makhoa]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khoa' });
    }
    res.json({ message: 'Xóa khoa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LỚP ROUTES ──

// Hàm helper: xác định bảng lớp đang dùng
async function getLopTable() {
  try { await pool.execute('SELECT 1 FROM lophanhchinh LIMIT 1'); return 'lophanhchinh'; }
  catch { return 'lophoc'; }
}

// GET /api/khoa/lop - Lấy tất cả lớp (có thể lọc theo makhoa)
router.get('/lop', async (req, res) => {
  try {
    const table = await getLopTable();
    const { makhoa } = req.query;
    let sql = `SELECT malop, tenlop, makhoa, namtuyensinh,
               (SELECT COUNT(*) FROM sinhvien s WHERE s.malop = ${table}.malop) AS so_sinh_vien
               FROM ${table}`;
    const params = [];
    if (makhoa) { sql += ' WHERE makhoa = ?'; params.push(makhoa); }
    sql += ' ORDER BY makhoa, malop';
    const [rows] = await pool.execute(sql, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/khoa/lop - Thêm lớp mới
router.post('/lop', async (req, res) => {
  try {
    const table = await getLopTable();
    const { malop, tenlop, makhoa, namtuyensinh } = req.body;
    if (!malop || !malop.trim()) return res.status(400).json({ error: 'Mã lớp không được để trống' });
    if (!tenlop || !tenlop.trim()) return res.status(400).json({ error: 'Tên lớp không được để trống' });

    const ml = malop.trim().toUpperCase();
    const [existing] = await pool.execute(`SELECT malop FROM ${table} WHERE malop = ?`, [ml]);
    if (existing.length > 0) return res.status(400).json({ error: `Mã lớp "${ml}" đã tồn tại` });

    await pool.execute(
      `INSERT INTO ${table} (malop, tenlop, makhoa, namtuyensinh) VALUES (?, ?, ?, ?)`,
      [ml, tenlop.trim(), makhoa || null, namtuyensinh || null]
    );
    res.status(201).json({ malop: ml, tenlop: tenlop.trim(), makhoa: makhoa || null, namtuyensinh: namtuyensinh || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/khoa/lop/:malop - Cập nhật lớp
router.put('/lop/:malop', async (req, res) => {
  try {
    const table = await getLopTable();
    const { malop } = req.params;
    const { tenlop, makhoa, namtuyensinh } = req.body;
    if (!tenlop || !tenlop.trim()) return res.status(400).json({ error: 'Tên lớp không được để trống' });

    const [result] = await pool.execute(
      `UPDATE ${table} SET tenlop = ?, makhoa = ?, namtuyensinh = ? WHERE malop = ?`,
      [tenlop.trim(), makhoa || null, namtuyensinh || null, malop]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy lớp' });
    res.json({ malop, tenlop: tenlop.trim(), makhoa: makhoa || null, namtuyensinh: namtuyensinh || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/khoa/lop/:malop - Xóa lớp
router.delete('/lop/:malop', async (req, res) => {
  try {
    const table = await getLopTable();
    const { malop } = req.params;
    const [svRows] = await pool.execute('SELECT COUNT(*) AS cnt FROM sinhvien WHERE malop = ?', [malop]);
    if (svRows[0].cnt > 0) {
      return res.status(400).json({ error: `Không thể xóa: còn ${svRows[0].cnt} sinh viên trong lớp này` });
    }
    const [result] = await pool.execute(`DELETE FROM ${table} WHERE malop = ?`, [malop]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy lớp' });
    res.json({ message: 'Xóa lớp thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
