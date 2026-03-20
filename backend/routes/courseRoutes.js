import express from 'express';
import pool from '../config/database.js';
import Course from '../models/Course.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

/** Học kỳ đang mở đăng ký (chỉ 1 học kỳ) - cho sinh viên */
router.get('/current-registration-semester', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT config_value FROM config WHERE config_key = 'hocky_dang_mo_dang_ky' LIMIT 1"
    ).catch(() => [[]]);
    const row = rows && rows[0];
    const mahocky = row?.config_value != null && row?.config_value !== '' ? parseInt(row.config_value, 10) : null;
    return res.json({ data: mahocky != null && !isNaN(mahocky) ? { mahocky } : null });
  } catch (err) {
    return res.json({ data: null });
  }
});

/** Admin: đặt học kỳ đang mở đăng ký (chỉ 1 học kỳ) */
router.post('/set-current-registration-semester', requireRole(['admin']), async (req, res) => {
  try {
    const { mahocky } = req.body;
    await pool.execute(
      "INSERT INTO config (config_key, config_value) VALUES ('hocky_dang_mo_dang_ky', ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)",
      [mahocky != null ? String(mahocky) : null]
    );
    const [rows] = await pool.execute(
      "SELECT config_value FROM config WHERE config_key = 'hocky_dang_mo_dang_ky' LIMIT 1"
    );
    const row = rows && rows[0];
    const value = row?.config_value != null && row?.config_value !== '' ? parseInt(row.config_value, 10) : null;
    return res.json({ data: value != null && !isNaN(value) ? { mahocky: value } : null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

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
