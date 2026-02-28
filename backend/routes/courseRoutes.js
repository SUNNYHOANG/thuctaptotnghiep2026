import express from 'express';
import Course from '../models/Course.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const courses = await Course.getAll(req.query);
    res.json({ data: courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/available-for-registration/:mahocky', async (req, res) => {
  try {
    const courses = await Course.getAvailableForRegistration(req.params.mahocky);
    res.json({ data: courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await Course.getById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Không tìm thấy môn học' });
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const course = await Course.update(req.params.id, req.body);
    if (!course) {
      return res.status(404).json({ error: 'Không tìm thấy môn học' });
    }
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ok = await Course.delete(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Không tìm thấy môn học' });
    }
    res.json({ message: 'Xóa môn học thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
