import express from 'express';
import ThongBao from '../models/ThongBao.js';
import { requireRole } from '../middleware/requireRole.js';
import { emitThongBaoMoi } from '../socket.js';

const router = express.Router();

// Danh sách thông báo (sinh viên: filter theo lớp; admin/GV: tất cả)
router.get('/', async (req, res) => {
  try {
    const { malop, mahocky } = req.query;
    let rows;
    if (malop) {
      rows = await ThongBao.getForStudent(malop, mahocky || undefined);
    } else {
      rows = await ThongBao.getAll(req.query);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/CTSV/GV: lịch sử nhắc nhở đã gửi
router.get('/reminder-history', requireRole(['admin', 'ctsv', 'giangvien']), async (req, res) => {
  try {
    const { loai, mahocky } = req.query;

    // Xác định filter loai: nếu không truyền thì lấy cả 2 loại nhắc nhở
    const validLoai = ['nhacnho_drl', 'nhacnho_hoso'];
    let rows;

    if (loai && validLoai.includes(loai)) {
      const filters = { loai };
      if (mahocky) filters.mahocky = mahocky;
      rows = await ThongBao.getAll(filters);
    } else {
      // Lấy cả 2 loại nhắc nhở
      const filtersDrl = { loai: 'nhacnho_drl' };
      const filtersHoso = { loai: 'nhacnho_hoso' };
      if (mahocky) {
        filtersDrl.mahocky = mahocky;
        filtersHoso.mahocky = mahocky;
      }
      const [drlRows, hosoRows] = await Promise.all([
        ThongBao.getAll(filtersDrl),
        ThongBao.getAll(filtersHoso),
      ]);
      rows = [...drlRows, ...hosoRows].sort(
        (a, b) => new Date(b.ngaytao) - new Date(a.ngaytao)
      );
    }

    res.json({ data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại' });
  }
});

// Sinh viên: lấy nhắc nhở cá nhân chưa đọc (theo mssv từ token)
router.get('/my-reminders', async (req, res) => {
  try {
    const mssv = req.user?.mssv || req.headers['x-mssv'];
    if (!mssv) return res.json({ data: [] });
    const rows = await ThongBao.getPersonalReminders(mssv);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chi tiết thông báo
router.get('/:id', async (req, res) => {
  try {
    const row = await ThongBao.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/CTSV/GV: gửi nhắc nhở có danh sách MSSV mục tiêu
router.post('/reminder', requireRole(['admin', 'ctsv', 'giangvien']), async (req, res) => {
  try {
    const { tieude, noidung, loai, mahocky, mssv_list, malop, makhoa } = req.body;

    if (!tieude || tieude.trim() === '') {
      return res.status(400).json({ error: 'Tiêu đề không được để trống' });
    }
    if (tieude.length > 255) {
      return res.status(400).json({ error: 'Tiêu đề không được vượt quá 255 ký tự' });
    }

    const nguoitao = req.user?.id || req.headers['x-user-id'] || null;
    const list = Array.isArray(mssv_list) ? mssv_list : [];

    const row = await ThongBao.create({
      tieude: tieude.trim(),
      noidung: noidung || null,
      loai: loai || 'nhacnho_drl',
      mahocky: mahocky || null,
      malop: malop || null,
      nguoitao,
      nguoi_nhan: list,
    });

    // Emit realtime đến từng sinh viên trong danh sách
    emitThongBaoMoi(row);

    res.status(201).json({ ...row, so_nguoi_nhan: list.length });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại' });
  }
});

// Admin/GV/CTSV: tạo thông báo (CTSV: nhắc nhở sinh viên)
router.post('/', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const data = {
      ...req.body,
      nguoitao: req.user?.id || req.headers['x-user-id'] || req.body.nguoitao
    };
    const row = await ThongBao.create(data);
    emitThongBaoMoi(row);
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Admin/GV/CTSV: sửa thông báo
router.put('/:id', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const row = await ThongBao.update(req.params.id, req.body);
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin/GV/CTSV: xóa thông báo
router.delete('/:id', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const ok = await ThongBao.delete(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json({ message: 'Đã xóa thông báo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
