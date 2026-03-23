import express from 'express';
import KhenThuongKyLuat from '../models/KhenThuongKyLuat.js';
import { requireRole } from '../middleware/requireRole.js';
import { emitRewardDiscipline } from '../socket.js';

const router = express.Router();

// GET - cho phép sinh viên xem
router.get('/', async (req, res) => {
  try {
    const { mahocky, loai, trangthai } = req.query;
    const rows = await KhenThuongKyLuat.getBySemester(mahocky, loai, trangthai);
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

router.post('/', requireRole(['admin', 'giangvien', 'ctsv', 'khoa']), async (req, res) => {
  try {
    const role = req.headers['x-user-role'] || '';
    const makhoa = req.headers['x-user-makhoa'] || req.body.makhoa || null;
    // GV đề xuất → cho_duyet (chờ Khoa); Khoa tạo → khoa_duyet (chờ CTSV); CTSV/Admin → da_duyet
    let trangthai = 'da_duyet';
    if (role === 'giangvien') trangthai = 'cho_duyet';
    else if (role === 'khoa') trangthai = 'khoa_duyet';

    const data = { ...req.body, nguoilap: req.headers['x-user-id'] || req.body.nguoilap, makhoa, trangthai };
    const row = await KhenThuongKyLuat.create(data);

    if (trangthai === 'da_duyet' && row?.mssv && row?.loai && row?.noidung) {
      emitRewardDiscipline(row.mssv, row.loai, row.noidung);
    }
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Khoa: duyệt đơn GV đề xuất (cho_duyet → khoa_duyet)
router.post('/:id/khoa-approve', requireRole(['admin', 'khoa']), async (req, res) => {
  try {
    const row = await KhenThuongKyLuat.khoaApprove(req.params.id);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Khoa: từ chối đơn GV (cho_duyet → khoa_tuchoi)
router.post('/:id/khoa-reject', requireRole(['admin', 'khoa']), async (req, res) => {
  try {
    const row = await KhenThuongKyLuat.khoaReject(req.params.id, req.body.lydo || null);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CTSV/Admin: Duyệt đơn từ Khoa (khoa_duyet → da_duyet) → gửi thông báo SV
router.post('/:id/approve', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const row = await KhenThuongKyLuat.approve(req.params.id);
    if (row?.mssv && row?.loai && row?.noidung) {
      emitRewardDiscipline(row.mssv, row.loai, row.noidung);
    }
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CTSV/Admin: Từ chối đơn (khoa_duyet → tu_choi)
router.post('/:id/reject', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const row = await KhenThuongKyLuat.reject(req.params.id, req.body.lydo || null);
    res.json(row);
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
