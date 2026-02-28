import express from 'express';
import pool from '../config/database.js';
import ClassSection from '../models/ClassSection.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const sections = await ClassSection.getAll(req.query);
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const section = await ClassSection.getById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học phần' });
    }
    res.json(section);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get class sections by teacher
router.get('/teacher/:magiangvien', async (req, res) => {
  try {
    const { magiangvien } = req.params;
    const [sections] = await pool.execute(
      `SELECT 
        lhp.malophocphan,
        lhp.mamonhoc,
        mh.tenmonhoc,
        lhp.magiaovien,
        gv.tengiaovien,
        lhp.malop,
        lh.tenlop,
        lhp.mahocky,
        hk.tenhocky,
        lhp.thoigian,
        lhp.phonghoc,
        lhp.soluongsv,
        lhp.sicham
      FROM lophocphan lhp
      JOIN monhoc mh ON lhp.mamonhoc = mh.mamonhoc
      JOIN giangvien gv ON lhp.magiaovien = gv.magiaovien
      JOIN lophoc lh ON lhp.malop = lh.malop
      JOIN hocky hk ON lhp.mahocky = hk.mahocky
      WHERE lhp.magiaovien = ?
      ORDER BY hk.mahocky DESC, mh.tenmonhoc ASC`,
      [magiangvien]
    );
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const section = await ClassSection.create(req.body);
    res.status(201).json(section);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const section = await ClassSection.update(req.params.id, req.body);
    if (!section) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học phần' });
    }
    res.json(section);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ok = await ClassSection.delete(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học phần' });
    }
    res.json({ message: 'Xóa lớp học phần thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
