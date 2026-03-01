import express from 'express';
import pool from '../config/database.js';
import { getHocKyList, getGiangVienList, getPhongHocList } from '../models/Lookup.js';

const router = express.Router();

router.get('/admin-stats', async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT COUNT(*) as cnt FROM users');
    const [students] = await pool.execute('SELECT COUNT(*) as cnt FROM sinhvien');
    const [teachers] = await pool.execute('SELECT COUNT(*) as cnt FROM giangvien');
    const [courses] = await pool.execute('SELECT COUNT(*) as cnt FROM monhoc');
    const [enrollments] = await pool.execute('SELECT COUNT(*) as cnt FROM dangkyhocphan');
    
    res.json({
      totalUsers: users[0].cnt,
      totalStudents: students[0].cnt,
      totalTeachers: teachers[0].cnt,
      totalCourses: courses[0].cnt,
      totalEnrollments: enrollments[0].cnt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/hocky', async (req, res) => {
  try {
    const list = await getHocKyList();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/giangvien', async (req, res) => {
  try {
    const list = await getGiangVienList();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/phonghoc', async (req, res) => {
  try {
    const list = await getPhongHocList();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Giảng viên/CTSV/Admin: danh sách sinh viên theo lớp
router.get('/students-by-class', async (req, res) => {
  try {
    const { malop } = req.query;
    if (!malop) {
      return res.status(400).json({ error: 'Thiếu tham số malop' });
    }
    const [rows] = await pool.execute(
      'SELECT mssv, hoten, malop, makhoa FROM sinhvien WHERE malop = ? ORDER BY mssv',
      [malop]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tiêu chí đánh giá điểm rèn luyện (SV xem)
router.get('/tieu-chi-drl', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT matieuchi, tentieuchi, diemtoida, loaitieuchi, mota FROM tieuchi_diemrenluyen ORDER BY loaitieuchi, matieuchi'
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Danh sách lớp (lớp hành chính - để GV chọn lớp xem SV)
router.get('/lop', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT malop, tenlop FROM lophanhchinh ORDER BY malop'
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin báo cáo: thống kê theo lớp hoặc theo khoa
router.get('/report-stats', async (req, res) => {
  try {
    const { group } = req.query; // 'malop' | 'makhoa'
    if (group === 'makhoa') {
      const [rows] = await pool.execute(
        `SELECT makhoa AS name, COUNT(*) AS total FROM sinhvien WHERE makhoa IS NOT NULL AND makhoa != '' GROUP BY makhoa ORDER BY total DESC`
      );
      return res.json({ data: rows });
    }
    if (group === 'malop') {
      const [rows] = await pool.execute(
        `SELECT malop AS name, COUNT(*) AS total FROM sinhvien WHERE malop IS NOT NULL AND malop != '' GROUP BY malop ORDER BY malop`
      );
      return res.json({ data: rows });
    }
    const [rows] = await pool.execute(
      'SELECT malop, makhoa, COUNT(*) AS total FROM sinhvien GROUP BY malop, makhoa ORDER BY makhoa, malop'
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
