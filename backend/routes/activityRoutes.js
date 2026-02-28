import express from 'express';
import Activity from '../models/Activity.js';

const router = express.Router();

// Lấy tất cả hoạt động
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.getAll(req.query);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy loại hoạt động
router.get('/types', async (req, res) => {
  try {
    const types = await Activity.getActivityTypes();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy hoạt động theo ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.getById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Không tìm thấy hoạt động' });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tạo hoạt động mới
router.post('/', async (req, res) => {
  try {
    const activity = await Activity.create(req.body);
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật hoạt động
router.put('/:id', async (req, res) => {
  try {
    const activity = await Activity.update(req.params.id, req.body);
    if (!activity) {
      return res.status(404).json({ error: 'Không tìm thấy hoạt động' });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Xóa hoạt động
router.delete('/:id', async (req, res) => {
  try {
    await Activity.delete(req.params.id);
    res.json({ message: 'Xóa hoạt động thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
