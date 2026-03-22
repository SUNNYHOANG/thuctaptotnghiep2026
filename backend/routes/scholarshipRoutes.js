import express from 'express';
import Scholarship from '../models/Scholarship.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// POST /evaluate/:mahocky — Khoa chạy xét học bổng
router.post('/evaluate/:mahocky', requireRole(['khoa', 'admin']), async (req, res) => {
  try {
    const makhoa = req.headers['x-user-makhoa'] || null;
    const result = await Scholarship.evaluateSemester(req.params.mahocky, makhoa);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /khoa-results/:mahocky — Khoa xem kết quả SV thuộc khoa
router.get('/khoa-results/:mahocky', requireRole(['khoa', 'admin']), async (req, res) => {
  try {
    const makhoa = req.headers['x-user-makhoa'] || null;
    const result = await Scholarship.getResults(req.params.mahocky, 'khoa', makhoa);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /khoa-approve/:id — Khoa duyệt / từ chối (bước 1)
router.put('/khoa-approve/:id', requireRole(['khoa', 'admin']), async (req, res) => {
  try {
    const { trangthai, ghichu } = req.body;
    const makhoa = req.headers['x-user-makhoa'];
    const nguoiduyet = req.headers['x-user-username'] || req.headers['x-user-id'];
    if (!makhoa) return res.status(403).json({ error: 'Không xác định được khoa' });
    const result = await Scholarship.khoaApprove(req.params.id, nguoiduyet, trangthai, ghichu, makhoa);
    res.json(result);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// GET /results/:mahocky — CTSV xem kết quả đã qua khoa
router.get('/results/:mahocky', requireRole(['ctsv', 'admin']), async (req, res) => {
  try {
    const result = await Scholarship.getResults(req.params.mahocky, 'ctsv');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /approve/:id — CTSV duyệt / từ chối cuối + gửi thông báo
router.put('/approve/:id', requireRole(['ctsv', 'admin']), async (req, res) => {
  try {
    const { trangthai, ghichu } = req.body;
    const nguoiduyet = req.headers['x-user-id'] || req.headers['x-user-username'];
    const result = await Scholarship.approve(req.params.id, nguoiduyet, trangthai, ghichu);
    res.json(result);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// GET /my/:mahocky — Sinh viên xem kết quả của mình
router.get('/my/:mahocky', requireRole(['sinhvien']), async (req, res) => {
  try {
    const mssv = req.headers['x-user-mssv'];
    if (!mssv) return res.status(403).json({ error: 'Không xác định được sinh viên' });
    const rows = await Scholarship.getByStudent(mssv, req.params.mahocky);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /my — Sinh viên xem tất cả học bổng
router.get('/my', requireRole(['sinhvien']), async (req, res) => {
  try {
    const mssv = req.headers['x-user-mssv'];
    if (!mssv) return res.status(403).json({ error: 'Không xác định được sinh viên' });
    const rows = await Scholarship.getByStudent(mssv);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /export/:mahocky — CTSV xuất Excel
router.get('/export/:mahocky', requireRole(['ctsv', 'admin']), async (req, res) => {
  try {
    const buffer = await Scholarship.exportExcel(req.params.mahocky);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=hocbong_${req.params.mahocky}.xlsx`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
