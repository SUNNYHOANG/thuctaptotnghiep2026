import express from 'express';
import ThongBao from '../models/ThongBao.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// Danh sách thông báo (sinh viên: filter theo lớp; admin/GV: tất cả)
router.get('/', async (req, res) => {
  try {
    const { malop, mahocky } = req.query;
    let rows;
    if (malop) {
      rows = await ThongBao.getForStudent(malop, mahocky || undefined);
    } else {
      rows = await ThongBao.getAll(req.query);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chi tiết thông báo
router.get('/:id', async (req, res) => {
  try {
    const row = await ThongBao.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/GV/CTSV: tạo thông báo (CTSV: nhắc nhở sinh viên)
router.post('/', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const data = {
      ...req.body,
      nguoitao: req.user?.id || req.headers['x-user-id'] || req.body.nguoitao
    };
    const row = await ThongBao.create(data);
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin/GV/CTSV: sửa thông báo
router.put('/:id', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const row = await ThongBao.update(req.params.id, req.body);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin/GV/CTSV: xóa thông báo
router.delete('/:id', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const ok = await ThongBao.delete(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ message: 'Đã xóa thông báo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
