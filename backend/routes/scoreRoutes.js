import express from 'express';
import Score from '../models/Score.js';
import { requireRole } from '../middleware/requireRole.js';
import { emitDrlScore } from '../socket.js';

const router = express.Router();

// Tính điểm rèn luyện (admin/giảng viên)
router.post('/calculate', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const { mssv, mahocky } = req.body;
    const score = await Score.calculateScore(mssv, mahocky);
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy điểm rèn luyện của sinh viên trong học kỳ
router.get('/student/:mssv/semester/:mahocky', async (req, res) => {
  try {
    const score = await Score.getByStudentAndSemester(req.params.mssv, req.params.mahocky);
    if (!score) {
      return res.status(404).json({ error: 'Chưa có điểm rèn luyện' });
    }
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy tất cả điểm rèn luyện của sinh viên
router.get('/student/:mssv', async (req, res) => {
  try {
    const scores = await Score.getByStudent(req.params.mssv);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy điểm rèn luyện theo học kỳ (admin/giảng viên)
router.get('/semester/:mahocky', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const scores = await Score.getBySemester(req.params.mahocky);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật điểm thủ công (admin/giảng viên)
router.put('/update', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const { mssv, mahocky, ...data } = req.body;
    const score = await Score.updateScore(mssv, mahocky, data);
    if (score && mssv) emitDrlScore(mssv, score.diemtong, score.xeploai);
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
