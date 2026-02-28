import express from 'express';
import DichVu from '../models/DichVu.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// Lấy danh sách loại dịch vụ (mọi người)
router.get('/loai', async (req, res) => {
  try {
    const rows = await DichVu.getLoaiDichVu();
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sinh viên: tạo đơn xin dịch vụ
router.post('/', async (req, res) => {
  try {
    console.log('Create service request with data:', req.body);
    const row = await DichVu.create(req.body);
    res.status(201).json(row);
  } catch (err) {
    console.error('Error creating service request:', err);
    res.status(400).json({ error: err.message });
  }
});

// Admin/CTSV: danh sách tất cả đơn (phân quyền)
router.get('/', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const rows = await DichVu.getAll(req.query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sinh viên: xem đơn của mình (phải đặt trước /:id)
router.get('/student/:mssv', async (req, res) => {
  try {
    const rows = await DichVu.getByStudent(req.params.mssv);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chi tiết đơn
router.get('/:id', async (req, res) => {
  try {
    const row = await DichVu.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/CTSV: duyệt/từ chối đơn
router.put('/:id/status', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const { trangthai, ketqua, file_ketqua } = req.body;
    const row = await DichVu.updateStatus(
      req.params.id,
      trangthai,
      ketqua,
      req.user?.id || req.headers['x-user-id'],
      file_ketqua
    );
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sinh viên: sửa đơn của mình (chưa duyệt)
router.put('/:id', async (req, res) => {
  try {
    const row = await DichVu.update(req.params.id, req.body);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sinh viên: xóa đơn của mình (chưa duyệt)
router.delete('/:id', async (req, res) => {
  try {
    const success = await DichVu.delete(req.params.id);
    if (!success) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
