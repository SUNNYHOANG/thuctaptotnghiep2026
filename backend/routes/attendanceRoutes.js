import express from 'express';
import Attendance from '../models/Attendance.js';

const router = express.Router();

// Ghi nhận điểm danh từ hệ thống bên ngoài (ví dụ app1.py)
router.post('/', async (req, res) => {
  try {
    const { mssv, hoten, method, note, time } = req.body || {};
    if (!mssv) {
      return res.status(400).json({ error: 'Thiếu mssv' });
    }
    const record = await Attendance.mark({ mssv, hoten, method, note, time });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy lịch sử điểm danh của 1 sinh viên
router.get('/student/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const list = await Attendance.getByStudent(mssv);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

