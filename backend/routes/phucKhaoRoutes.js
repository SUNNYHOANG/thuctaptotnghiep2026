import express from 'express';
import PhucKhao from '../models/PhucKhao.js';
import pool from '../config/database.js';
import { requireRole } from '../middleware/requireRole.js';
import { emitPhucKhaoStatus } from '../socket.js';

const router = express.Router();

// CTSV/Admin/Giảng viên/Khoa: lấy tất cả đơn phúc khảo
router.get('/', requireRole(['admin', 'ctsv', 'giangvien', 'khoa']), async (req, res) => {
  try {
    const filters = { ...req.query };
    const role = req.user?.role || req.headers['x-user-role'];
    const makhoa = req.user?.makhoa || req.headers['x-user-makhoa'];
    // GV và Khoa tự động filter theo khoa mình
    if ((role === 'giangvien' || role === 'khoa') && makhoa) {
      filters.makhoa = makhoa;
    }
    const rows = await PhucKhao.getAll(filters);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sinh viên có thể tạo đơn phúc khảo
router.post('/', async (req, res) => {
  try {
    const row = await PhucKhao.create(req.body);
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/class-section/:malophocphan', requireRole(), async (req, res) => {
  try {
    const rows = await PhucKhao.getByClassSection(req.params.malophocphan);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách môn học (để sinh viên chọn khi tạo đơn phúc khảo)
router.get('/monhoc-list', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT mamonhoc, tenmonhoc, sotinchi FROM monhoc ORDER BY tenmonhoc'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/student/:mssv', async (req, res) => {
  try {
    const rows = await PhucKhao.getByStudent(req.params.mssv);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await PhucKhao.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', requireRole(['admin', 'ctsv', 'giangvien', 'khoa']), async (req, res) => {
  try {
    const { trangthai, ketqua } = req.body;
    const row = await PhucKhao.updateStatus(
      req.params.id,
      trangthai,
      ketqua,
      req.headers['x-user-id']
    );
    if (row?.mssv) emitPhucKhaoStatus(row.mssv, row.id, trangthai, row.tenmonhoc || row.mamonhoc || 'môn học');
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sinh viên: sửa đơn phúc khảo của mình (chưa duyệt)
router.put('/:id', async (req, res) => {
  try {
    const row = await PhucKhao.update(req.params.id, req.body);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sinh viên: xóa đơn phúc khảo của mình (chưa duyệt)
router.delete('/:id', async (req, res) => {
  try {
    const success = await PhucKhao.delete(req.params.id);
    if (!success) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
