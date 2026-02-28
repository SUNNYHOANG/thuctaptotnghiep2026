import express from 'express';
import pool from '../config/database.js';
import HocBong from '../models/HocBong.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rows = await HocBong.getList(req.query.mahocky);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/student/:mssv/history', async (req, res) => {
  try {
    const rows = await HocBong.getHistoryByStudent(req.params.mssv);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await HocBong.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sinh viên: xem danh sách người đã nhận học bổng (chỉ mssv, hoten)
router.get('/:id/recipients', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT sh.mssv, sv.hoten FROM sinhvien_hocbong sh JOIN sinhvien sv ON sh.mssv = sv.mssv WHERE sh.mahocbong = ? AND sh.trangthai = 'duyet' ORDER BY sv.hoten`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/students', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const rows = await HocBong.getStudents(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const row = await HocBong.create(req.body);
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const row = await HocBong.update(req.params.id, req.body);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/students', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const { mssv } = req.body;
    const result = await HocBong.addStudent(
      req.params.id,
      mssv,
      req.headers['x-user-id']
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id/students/:mssv', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const result = await HocBong.removeStudent(req.params.id, req.params.mssv);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
