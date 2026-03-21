import express from 'express';
import pool from '../config/database.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// GET /api/hocky — lấy tất cả học kỳ
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM hocky ORDER BY namhoc DESC, mahocky DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hocky/:mahocky — lấy 1 học kỳ
router.get('/:mahocky', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM hocky WHERE mahocky = ?', [req.params.mahocky]);
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy học kỳ' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hocky — tạo học kỳ mới (admin)
router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const { tenhocky, namhoc, ngaybatdau, ngayketthuc, trangthai } = req.body;
    if (!tenhocky || !namhoc) {
      return res.status(400).json({ error: 'Thiếu tenhocky hoặc namhoc' });
    }
    const [result] = await pool.execute(
      'INSERT INTO hocky (tenhocky, namhoc, ngaybatdau, ngayketthuc, trangthai) VALUES (?, ?, ?, ?, ?)',
      [tenhocky, namhoc, ngaybatdau || null, ngayketthuc || null, trangthai || 'chuamo']
    );
    const [rows] = await pool.execute('SELECT * FROM hocky WHERE mahocky = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/hocky/:mahocky — cập nhật học kỳ (admin)
router.put('/:mahocky', requireRole(['admin']), async (req, res) => {
  try {
    const { tenhocky, namhoc, ngaybatdau, ngayketthuc, trangthai } = req.body;
    await pool.execute(
      'UPDATE hocky SET tenhocky = ?, namhoc = ?, ngaybatdau = ?, ngayketthuc = ?, trangthai = ? WHERE mahocky = ?',
      [tenhocky, namhoc, ngaybatdau || null, ngayketthuc || null, trangthai || 'chuamo', req.params.mahocky]
    );
    const [rows] = await pool.execute('SELECT * FROM hocky WHERE mahocky = ?', [req.params.mahocky]);
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy học kỳ' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/hocky/:mahocky — xóa học kỳ (admin)
router.delete('/:mahocky', requireRole(['admin']), async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM hocky WHERE mahocky = ?', [req.params.mahocky]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy học kỳ' });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'Không thể xóa học kỳ đang được sử dụng' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/hocky/:mahocky/trangthai — đổi trạng thái nhanh (admin)
router.patch('/:mahocky/trangthai', requireRole(['admin']), async (req, res) => {
  try {
    const { trangthai } = req.body;
    const valid = ['chuamo', 'dangmo', 'dadong'];
    if (!valid.includes(trangthai)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    await pool.execute('UPDATE hocky SET trangthai = ? WHERE mahocky = ?', [trangthai, req.params.mahocky]);
    const [rows] = await pool.execute('SELECT * FROM hocky WHERE mahocky = ?', [req.params.mahocky]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
