import express from 'express';
import pool from '../config/database.js';
import { requireRole } from '../middleware/requireRole.js';
import { emitDonOnlineStatus } from '../socket.js';

const router = express.Router();

// Sinh viên: xem đơn của mình
router.get('/student', async (req, res) => {
  try {
    const mssv = req.headers['x-user-mssv'] || req.query.mssv;
    if (!mssv) return res.status(400).json({ error: 'Thiếu mssv' });
    const [rows] = await pool.execute(
      `SELECT d.*, s.hoten, s.malop FROM don_online d
       JOIN sinhvien s ON d.mssv = s.mssv
       WHERE d.mssv = ? ORDER BY d.ngaygui DESC`,
      [mssv]
    );
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sinh viên: tạo đơn
router.post('/', async (req, res) => {
  try {
    const { mssv, loaidon, tieude, noidung, ghichu } = req.body;
    if (!mssv || !loaidon || !tieude) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    const [result] = await pool.execute(
      `INSERT INTO don_online (mssv, loaidon, tieude, noidung, ghichu, trangthai, ngaygui)
       VALUES (?, ?, ?, ?, ?, 'cho', NOW())`,
      [mssv, loaidon, tieude, noidung || '', ghichu || '']
    );
    const [[row]] = await pool.execute('SELECT * FROM don_online WHERE madon = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Sinh viên: sửa đơn (chỉ khi trangthai = 'cho')
router.put('/:id', async (req, res) => {
  try {
    const { tieude, noidung, ghichu } = req.body;
    const mssv = req.headers['x-user-mssv'];
    const [[don]] = await pool.execute('SELECT * FROM don_online WHERE madon = ?', [req.params.id]);
    if (!don) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    if (don.mssv !== mssv) return res.status(403).json({ error: 'Không có quyền' });
    if (don.trangthai !== 'cho') return res.status(400).json({ error: 'Chỉ có thể sửa đơn đang chờ xử lý' });
    await pool.execute(
      'UPDATE don_online SET tieude=?, noidung=?, ghichu=? WHERE madon=?',
      [tieude, noidung || '', ghichu || '', req.params.id]
    );
    const [[updated]] = await pool.execute('SELECT * FROM don_online WHERE madon = ?', [req.params.id]);
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Sinh viên: xóa đơn (chỉ khi trangthai = 'cho')
router.delete('/:id', async (req, res) => {
  try {
    const mssv = req.headers['x-user-mssv'];
    const [[don]] = await pool.execute('SELECT * FROM don_online WHERE madon = ?', [req.params.id]);
    if (!don) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    if (don.mssv !== mssv) return res.status(403).json({ error: 'Không có quyền' });
    if (don.trangthai !== 'cho') return res.status(400).json({ error: 'Chỉ có thể xóa đơn đang chờ xử lý' });
    await pool.execute('DELETE FROM don_online WHERE madon = ?', [req.params.id]);
    res.json({ message: 'Xóa thành công' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CTSV/Admin: xem tất cả đơn
router.get('/', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const { trangthai, loaidon, mssv, malop } = req.query;
    let sql = `SELECT d.*, s.hoten, s.malop, s.makhoa,
               u.hoten AS ten_nguoi_duyet
               FROM don_online d
               JOIN sinhvien s ON d.mssv = s.mssv
               LEFT JOIN users u ON d.nguoiduyet = u.id
               WHERE 1=1`;
    const params = [];
    if (trangthai) { sql += ' AND d.trangthai = ?'; params.push(trangthai); }
    if (loaidon) { sql += ' AND d.loaidon = ?'; params.push(loaidon); }
    if (mssv) { sql += ' AND d.mssv LIKE ?'; params.push(`%${mssv}%`); }
    if (malop) { sql += ' AND s.malop = ?'; params.push(malop); }
    sql += ' ORDER BY d.ngaygui DESC';
    const [rows] = await pool.execute(sql, params);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CTSV/Admin: duyệt/từ chối đơn
router.put('/:id/status', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const { trangthai, ketqua } = req.body;
    const nguoiduyet = req.headers['x-user-id'];
    if (!['dangxuly', 'daduyet', 'tuchoi'].includes(trangthai)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    await pool.execute(
      `UPDATE don_online SET trangthai=?, ketqua=?, nguoiduyet=?, ngayduyet=NOW() WHERE madon=?`,
      [trangthai, ketqua || '', nguoiduyet, req.params.id]
    );
    const [[updated]] = await pool.execute(
      `SELECT d.*, s.hoten, s.malop FROM don_online d JOIN sinhvien s ON d.mssv = s.mssv WHERE d.madon = ?`,
      [req.params.id]
    );
    // Gửi thông báo realtime đến sinh viên
    if (updated?.mssv) {
      emitDonOnlineStatus(updated.mssv, updated.madon, trangthai, updated.loaidon || updated.tieude || 'Đơn trực tuyến');
    }
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Thống kê đơn online (CTSV/Admin)
router.get('/stats/summary', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT trangthai, COUNT(*) as cnt FROM don_online GROUP BY trangthai`
    );
    const [byLoai] = await pool.execute(
      `SELECT loaidon, COUNT(*) as cnt FROM don_online GROUP BY loaidon ORDER BY cnt DESC`
    );
    res.json({ byTrangthai: rows, byLoai });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
