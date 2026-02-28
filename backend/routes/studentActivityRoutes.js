import express from 'express';
import StudentActivity from '../models/StudentActivity.js';

const router = express.Router();

// Đăng ký tham gia hoạt động
router.post('/register', async (req, res) => {
  try {
    const registration = await StudentActivity.register(req.body);
    res.status(201).json(registration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Lấy danh sách đăng ký của sinh viên
router.get('/student/:mssv', async (req, res) => {
  try {
    const registrations = await StudentActivity.getByStudent(req.params.mssv);
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy danh sách sinh viên tham gia hoạt động
router.get('/activity/:mahoatdong', async (req, res) => {
  try {
    const students = await StudentActivity.getByActivity(req.params.mahoatdong);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duyệt đăng ký
router.post('/:id/approve', async (req, res) => {
  try {
    const { nguoiduyet, diemcong } = req.body;
    const registration = await StudentActivity.approve(req.params.id, nguoiduyet, diemcong);
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Từ chối đăng ký
router.post('/:id/reject', async (req, res) => {
  try {
    const { nguoiduyet, ghichu } = req.body;
    const registration = await StudentActivity.reject(req.params.id, nguoiduyet, ghichu);
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Đánh dấu hoàn thành
router.post('/:id/complete', async (req, res) => {
  try {
    const { diemcong } = req.body;
    const registration = await StudentActivity.complete(req.params.id, diemcong);
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hủy đăng ký
router.delete('/:id', async (req, res) => {
  try {
    await StudentActivity.cancel(req.params.id);
    res.json({ message: 'Hủy đăng ký thành công' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
