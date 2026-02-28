import express from 'express';
import Grade from '../models/Grade.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

router.use(requireRole());

router.get('/class-section/:malophoc', async (req, res) => {
  try {
    const rows = await Grade.getByClassSection(req.params.malophoc);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/student/:mssv', async (req, res) => {
  try {
    const rows = await Grade.getByStudent(req.params.mssv, req.query.mahocky);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await Grade.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/log', async (req, res) => {
  try {
    const rows = await Grade.getLog(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body, nguoinhap: req.headers['x-user-id'] || req.body.nguoinhap };
    const row = await Grade.createOrUpdate(data);
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/init-class-section/:malophoc', async (req, res) => {
  try {
    const result = await Grade.initFromEnrollment(
      req.params.malophoc,
      req.headers['x-user-id'] || 'system'
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const row = await Grade.updateGrade(
      req.params.id,
      req.body,
      req.headers['x-user-id'] || req.body.nguoisua
    );
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/lock/:malophoc', async (req, res) => {
  try {
    const result = await Grade.lock(
      req.params.malophoc,
      req.headers['x-user-id'] || 'admin'
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
