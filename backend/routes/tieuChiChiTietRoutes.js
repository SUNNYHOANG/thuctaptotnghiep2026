import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// GET /tieu-chi-chitiet?matieuchi=1  — lấy tiêu chí con theo mục
router.get('/', async (req, res) => {
  try {
    const { matieuchi } = req.query;
    let sql = `SELECT id, matieuchi, noidung, diemtoida, diemtoithieu, ghichu, la_diem_tru, thutu
               FROM tieuchi_chitiet`;
    const params = [];
    if (matieuchi) { sql += ' WHERE matieuchi = ?'; params.push(matieuchi); }
    sql += ' ORDER BY matieuchi, thutu, id';
    const [rows] = await pool.execute(sql, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tieu-chi-chitiet/all-grouped — lấy tất cả, gom theo mục (dùng cho SV)
router.get('/all-grouped', async (req, res) => {
  try {
    const [mucs] = await pool.execute(
      'SELECT matieuchi AS id, tentieuchi AS ten, diemtoida AS max FROM tieuchi_diemrenluyen ORDER BY matieuchi'
    );
    const [items] = await pool.execute(
      'SELECT id, matieuchi, noidung, diemtoida, diemtoithieu, ghichu, la_diem_tru, thutu FROM tieuchi_chitiet ORDER BY matieuchi, thutu, id'
    );
    const grouped = mucs.map(muc => ({
      ...muc,
      items: items.filter(i => i.matieuchi === muc.id),
    }));
    res.json({ data: grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /tieu-chi-chitiet — thêm tiêu chí con
router.post('/', async (req, res) => {
  try {
    const role = req.user?.role || req.headers['x-user-role'];
    if (role !== 'admin') return res.status(403).json({ error: 'Chỉ admin mới có quyền' });

    const { matieuchi, noidung, diemtoida = 0, diemtoithieu = 0, ghichu, la_diem_tru = 0, thutu = 0 } = req.body;
    if (!matieuchi || !noidung?.trim()) return res.status(400).json({ error: 'Thiếu matieuchi hoặc noidung' });

    const [result] = await pool.execute(
      'INSERT INTO tieuchi_chitiet (matieuchi, noidung, diemtoida, diemtoithieu, ghichu, la_diem_tru, thutu) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [matieuchi, noidung.trim(), diemtoida, diemtoithieu, ghichu || null, la_diem_tru ? 1 : 0, thutu]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /tieu-chi-chitiet/:id — cập nhật
router.put('/:id', async (req, res) => {
  try {
    const role = req.user?.role || req.headers['x-user-role'];
    if (role !== 'admin') return res.status(403).json({ error: 'Chỉ admin mới có quyền' });

    const { noidung, diemtoida, diemtoithieu, ghichu, la_diem_tru, thutu } = req.body;
    const updates = [];
    const values = [];
    if (noidung !== undefined) { updates.push('noidung = ?'); values.push(noidung); }
    if (diemtoida !== undefined) { updates.push('diemtoida = ?'); values.push(diemtoida); }
    if (diemtoithieu !== undefined) { updates.push('diemtoithieu = ?'); values.push(diemtoithieu); }
    if (ghichu !== undefined) { updates.push('ghichu = ?'); values.push(ghichu || null); }
    if (la_diem_tru !== undefined) { updates.push('la_diem_tru = ?'); values.push(la_diem_tru ? 1 : 0); }
    if (thutu !== undefined) { updates.push('thutu = ?'); values.push(thutu); }

    if (updates.length === 0) return res.status(400).json({ error: 'Không có dữ liệu cập nhật' });
    values.push(req.params.id);
    await pool.execute(`UPDATE tieuchi_chitiet SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tieu-chi-chitiet/:id
router.delete('/:id', async (req, res) => {
  try {
    const role = req.user?.role || req.headers['x-user-role'];
    if (role !== 'admin') return res.status(403).json({ error: 'Chỉ admin mới có quyền' });

    const [result] = await pool.execute('DELETE FROM tieuchi_chitiet WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
