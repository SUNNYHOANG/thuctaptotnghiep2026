import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import pool from '../config/database.js';
import Grade from '../models/Grade.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── Helper ──────────────────────────────────────────────────────────────────

function getUser(req) {
  const role = req.headers['x-user-role'];
  // Giảng viên dùng magiaovien để so sánh với lophocphan.magiaovien
  const id = role === 'giangvien'
    ? (req.headers['x-user-magiaovien'] || req.headers['x-user-id'])
    : req.headers['x-user-id'];
  return {
    id,
    role,
    mssv: req.headers['x-user-mssv'],
  };
}

// ─── Giảng viên / CTSV: lấy điểm theo lớp học phần ─────────────────────────

router.get('/class/:malophocphan', requireRole(['giangvien', 'ctsv', 'admin', 'khoa']), async (req, res) => {
  try {
    const { id, role } = getUser(req);
    // Khoa: kiểm tra lớp học phần thuộc khoa của mình
    if (role === 'khoa') {
      const makhoa = req.headers['x-user-makhoa'];
      const [lhp] = await pool.execute(
        `SELECT lhp.malophocphan FROM lophocphan lhp
         JOIN monhoc m ON lhp.mamonhoc = m.mamonhoc
         WHERE lhp.malophocphan = ? AND m.makhoa = ?`,
        [req.params.malophocphan, makhoa]
      );
      if (!lhp.length) return res.status(403).json({ error: 'Lớp học phần không thuộc khoa của bạn' });
      const rows = await Grade.getByClassSection(req.params.malophocphan);
      return res.json(rows);
    }
    const rows = await Grade.getByClassSectionWithAuth(req.params.malophocphan, id, role);
    res.json(rows);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Sinh viên: xem điểm của bản thân (chỉ dakhoa) ──────────────────────────

router.get('/student/:mssv', requireRole(), async (req, res) => {
  try {
    const { role, mssv: userMssv } = getUser(req);
    const { mssv } = req.params;

    // Sinh viên chỉ xem điểm của mình
    if (role === 'sinhvien' && String(userMssv) !== String(mssv)) {
      return res.status(403).json({ error: 'Bạn không có quyền xem điểm của sinh viên khác' });
    }

    const onlyLocked = role === 'sinhvien';
    const rows = await Grade.getByStudent(mssv, req.query.mahocky, onlyLocked);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Lấy điểm theo ID ────────────────────────────────────────────────────────

router.get('/:id/log', requireRole(['giangvien', 'ctsv', 'admin', 'khoa']), async (req, res) => {
  try {
    const rows = await Grade.getLog(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireRole(['giangvien', 'ctsv', 'admin']), async (req, res) => {
  try {
    const row = await Grade.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy bảng điểm' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Nhập / cập nhật điểm ────────────────────────────────────────────────────

router.post('/', requireRole(['giangvien', 'ctsv', 'admin']), async (req, res) => {
  try {
    const { id, role } = getUser(req);
    const data = { ...req.body, nguoinhap: id };

    // Kiểm tra quyền giảng viên
    if (role === 'giangvien') {
      const [lhp] = await pool.execute(
        'SELECT magiaovien FROM lophocphan WHERE malophocphan = ?',
        [data.malophocphan]
      );
      if (!lhp.length) return res.status(404).json({ error: 'Lớp học phần không tồn tại' });
      if (String(lhp[0].magiaovien) !== String(id)) {
        return res.status(403).json({ error: 'Bạn không có quyền nhập điểm cho lớp học phần này' });
      }
    }

    const row = await Grade.createOrUpdate(data);
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireRole(['giangvien', 'ctsv', 'admin']), async (req, res) => {
  try {
    const { id: userId, role } = getUser(req);

    // Kiểm tra quyền giảng viên
    if (role === 'giangvien') {
      const existing = await Grade.getById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Không tìm thấy bảng điểm' });
      const [lhp] = await pool.execute(
        'SELECT magiaovien FROM lophocphan WHERE malophocphan = ?',
        [existing.malophocphan]
      );
      if (!lhp.length || String(lhp[0].magiaovien) !== String(userId)) {
        return res.status(403).json({ error: 'Bạn không có quyền sửa điểm cho lớp học phần này' });
      }
    }

    const row = await Grade.updateGrade(req.params.id, req.body, userId);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Import Excel ─────────────────────────────────────────────────────────────

router.post('/import-excel', requireRole(['giangvien', 'ctsv', 'admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Vui lòng upload file Excel' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    if (!rawRows.length) return res.status(400).json({ error: 'File Excel không có dữ liệu' });

    // Kiểm tra cột bắt buộc
    const required = ['mssv', 'malophocphan', 'diemcuoiky'];
    const firstRow = rawRows[0];
    const missing = required.filter(c => !(c in firstRow));
    if (missing.length) {
      return res.status(400).json({ error: `File Excel thiếu cột bắt buộc: ${missing.join(', ')}` });
    }

    const { id, role } = getUser(req);
    const result = await Grade.importFromExcel(rawRows, id, role);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Khóa / Mở khóa bảng điểm ───────────────────────────────────────────────

router.post('/lock/:malophocphan', requireRole(['giangvien', 'ctsv', 'admin']), async (req, res) => {
  try {
    const { id, role } = getUser(req);

    if (role === 'giangvien') {
      const [lhp] = await pool.execute(
        'SELECT magiaovien FROM lophocphan WHERE malophocphan = ?',
        [req.params.malophocphan]
      );
      if (!lhp.length || String(lhp[0].magiaovien) !== String(id)) {
        return res.status(403).json({ error: 'Bạn không có quyền khóa bảng điểm này' });
      }
    }

    const result = await Grade.lock(req.params.malophocphan);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/unlock/:malophocphan', requireRole(['ctsv', 'admin']), async (req, res) => {
  try {
    const result = await Grade.unlock(req.params.malophocphan);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Thống kê ─────────────────────────────────────────────────────────────────

// Khoa: lấy tất cả điểm SV thuộc khoa (read-only)
router.get('/by-khoa', requireRole(['khoa', 'admin']), async (req, res) => {
  try {
    const makhoa = req.headers['x-user-makhoa'] || req.query.makhoa;
    const { mahocky, malophocphan } = req.query;
    const rows = await Grade.getByKhoa(makhoa, mahocky, malophocphan);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Khoa: lấy danh sách lớp học phần thuộc khoa
router.get('/lophocphan-by-khoa', requireRole(['khoa', 'admin']), async (req, res) => {
  try {
    const makhoa = req.headers['x-user-makhoa'] || req.query.makhoa;
    const { mahocky } = req.query;
    let query = `
      SELECT lhp.malophocphan, lhp.mahocky, m.tenmonhoc, m.sotinchi,
             gv.hoten AS tengiaovien, h.tenhocky, h.namhoc,
             COUNT(bd.mabangdiem) AS sosinhvien,
             SUM(CASE WHEN bd.trangthai = 'dakhoa' THEN 1 ELSE 0 END) AS sodakhoa
      FROM lophocphan lhp
      JOIN monhoc m ON lhp.mamonhoc = m.mamonhoc
      LEFT JOIN giangvien gv ON lhp.magiaovien = gv.magiaovien
      LEFT JOIN hocky h ON lhp.mahocky = h.mahocky
      LEFT JOIN bangdiem bd ON lhp.malophocphan = bd.malophocphan
      WHERE m.makhoa = ?
    `;
    const params = [makhoa];
    if (mahocky) { query += ' AND lhp.mahocky = ?'; params.push(mahocky); }
    query += ' GROUP BY lhp.malophocphan ORDER BY h.namhoc DESC, h.tenhocky, m.tenmonhoc';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/:mahocky', requireRole(['giangvien', 'ctsv', 'admin', 'khoa']), async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        ROUND(AVG(gpa), 2) as avgGPA,
        MAX(diemtongket) as maxDiem,
        MIN(diemtongket) as minDiem,
        SUM(CASE WHEN gpa >= 3.6 THEN 1 ELSE 0 END) as xuatSac,
        SUM(CASE WHEN gpa >= 3.2 AND gpa < 3.6 THEN 1 ELSE 0 END) as gioi,
        SUM(CASE WHEN gpa >= 2.8 AND gpa < 3.2 THEN 1 ELSE 0 END) as kha,
        SUM(CASE WHEN gpa >= 2.0 AND gpa < 2.8 THEN 1 ELSE 0 END) as trungBinh,
        SUM(CASE WHEN gpa < 2.0 THEN 1 ELSE 0 END) as yeu
      FROM bangdiem bd
      JOIN lophocphan lhp ON bd.malophocphan = lhp.malophocphan
      WHERE lhp.mahocky = ? AND bd.trangthai = 'dakhoa'`,
      [req.params.mahocky]
    );
    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
