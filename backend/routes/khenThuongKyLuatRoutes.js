import express from 'express';
import KhenThuongKyLuat from '../models/KhenThuongKyLuat.js';
import { requireRole } from '../middleware/requireRole.js';
import { emitRewardDiscipline } from '../socket.js';

const router = express.Router();

// GET - cho phép sinh viên xem
router.get('/', async (req, res) => {
  try {
    const { mahocky, loai } = req.query;
    const rows = await KhenThuongKyLuat.getBySemester(mahocky, loai);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/student/:mssv', async (req, res) => {
  try {
    const rows = await KhenThuongKyLuat.getByStudent(req.params.mssv, req.query.mahocky);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await KhenThuongKyLuat.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const data = { ...req.body, nguoilap: req.headers['x-user-id'] || req.body.nguoilap };
    const row = await KhenThuongKyLuat.create(data);

    // Gửi thông báo realtime đến đúng sinh viên
    if (row?.mssv && row?.loai && row?.noidung) {
      emitRewardDiscipline(row.mssv, row.loai, row.noidung);
    }

    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const row = await KhenThuongKyLuat.update(req.params.id, req.body);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const success = await KhenThuongKyLuat.delete(req.params.id);
    if (!success) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
