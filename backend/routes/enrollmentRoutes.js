import express from 'express';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const enrollment = await Enrollment.register(req.body);
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    await Enrollment.cancel(req.params.id);
    res.json({ message: 'Hủy đăng ký thành công' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/student/:mssv', async (req, res) => {
  try {
    const { mahocky } = req.query;
    const list = await Enrollment.getByStudent(req.params.mssv, mahocky || undefined);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/student/:mssv/timetable/:mahocky', async (req, res) => {
  try {
    const timetable = await Enrollment.getTimetable(
      req.params.mssv,
      req.params.mahocky
    );
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/class-section/:malophoc', async (req, res) => {
  try {
    const list = await Enrollment.getByClassSection(req.params.malophoc);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
