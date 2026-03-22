import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// GET /tieu-chi-drl - Lấy tất cả tiêu chí
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT matieuchi AS id, tentieuchi AS ten, diemtoida AS diem_toi_da, loaitieuchi AS loai, mota AS mo_ta FROM tieuchi_diemrenluyen ORDER BY matieuchi'
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /tieu-chi-drl - Thêm tiêu chí mới
router.post('/', async (req, res) => {
  try {
    const role = req.user?.role || req.headers['x-user-role'];
    if (role !== 'admin') return res.status(403).json({ error: 'Chỉ admin mới có quyền thêm tiêu chí' });

    const { ten, diem_toi_da, loai, mo_ta } = req.body;
    if (!ten || !ten.trim()) return res.status(400).json({ error: 'Thiếu tên tiêu chí' });

    const [result] = await pool.execute(
      'INSERT INTO tieuchi_diemrenluyen (tentieuchi, diemtoida, loaitieuchi, mota) VALUES (?, ?, ?, ?)',
      [ten.trim(), diem_toi_da || 10, loai || null, mo_ta || null]
    );
    res.status(201).json({ id: result.insertId, ten, diem_toi_da, loai, mo_ta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /tieu-chi-drl/:id - Cập nhật tiêu chí
router.put('/:id', async (req, res) => {
  try {
    const role = req.user?.role || req.headers['x-user-role'];
    if (role !== 'admin') return res.status(403).json({ error: 'Chỉ admin mới có quyền sửa tiêu chí' });

    const { id } = req.params;
    const { ten, diem_toi_da, loai, mo_ta } = req.body;

    const updates = [];
    const values = [];
    if (ten !== undefined) { updates.push('tentieuchi = ?'); values.push(ten); }
    if (diem_toi_da !== undefined) { updates.push('diemtoida = ?'); values.push(diem_toi_da); }
    if (loai !== undefined) { updates.push('loaitieuchi = ?'); values.push(loai); }
    if (mo_ta !== undefined) { updates.push('mota = ?'); values.push(mo_ta); }

    if (updates.length === 0) return res.status(400).json({ error: 'Không có dữ liệu cập nhật' });

    values.push(id);
    await pool.execute(`UPDATE tieuchi_diemrenluyen SET ${updates.join(', ')} WHERE matieuchi = ?`, values);
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tieu-chi-drl/:id - Xóa tiêu chí
router.delete('/:id', async (req, res) => {
  try {
    const role = req.user?.role || req.headers['x-user-role'];
    if (role !== 'admin') return res.status(403).json({ error: 'Chỉ admin mới có quyền xóa tiêu chí' });

    const [result] = await pool.execute('DELETE FROM tieuchi_diemrenluyen WHERE matieuchi = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy tiêu chí' });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
