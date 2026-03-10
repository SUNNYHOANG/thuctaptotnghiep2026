import express from 'express';
import StudentActivity from '../models/StudentActivity.js';
import Activity from '../models/Activity.js';
import { requireRole } from '../middleware/requireRole.js';
import { emitActivityApproval } from '../socket.js';

const router = express.Router();
const ctsvOrAdmin = ['admin', 'ctsv'];

// Đăng ký tham gia hoạt động
router.post('/register', async (req, res) => {
  try {
    const registration = await StudentActivity.register(req.body);
    res.status(201).json(registration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Lấy danh sách đăng ký của sinh viên
router.get('/student/:mssv', async (req, res) => {
  try {
    const registrations = await StudentActivity.getByStudent(req.params.mssv);
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy danh sách sinh viên tham gia hoạt động
router.get('/activity/:mahoatdong', async (req, res) => {
  try {
    const students = await StudentActivity.getByActivity(req.params.mahoatdong);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CTSV/Admin: Lấy danh sách yêu cầu chờ duyệt
router.get('/ctsv/pending', requireRole(ctsvOrAdmin), async (req, res) => {
  try {
    const list = await StudentActivity.getPendingForCTSV();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CTSV/Admin: Export danh sách SV đăng ký thành công (CSV)
router.get('/activity/:mahoatdong/export', requireRole(ctsvOrAdmin), async (req, res) => {
  try {
    const { mahoatdong } = req.params;
    const activity = await Activity.getById(mahoatdong);
    if (!activity) return res.status(404).json({ error: 'Không tìm thấy hoạt động' });

    const list = await StudentActivity.getApprovedByActivity(mahoatdong);
    const BOM = '\uFEFF';
    const headers = ['STT', 'MSSV', 'Họ tên', 'Lớp', 'Vai trò', 'Ngày đăng ký', 'Ngày duyệt', 'Trạng thái'];
    const rows = list.map((r, i) => [
      i + 1,
      r.mssv || '',
      (r.hoten || '').replace(/"/g, '""'),
      r.malop || '',
      r.vaitro === 'tochuc' ? 'Tổ chức' : r.vaitro === 'truongnhom' ? 'Trưởng nhóm' : 'Tham gia',
      r.ngaydangky ? new Date(r.ngaydangky).toLocaleString('vi-VN') : '',
      r.ngayduyet ? new Date(r.ngayduyet).toLocaleString('vi-VN') : '',
      'Đăng ký thành công'
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${String(c)}"`).join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Danh_sach_dang_ky_thanh_cong_${activity.tenhoatdong || mahoatdong}.csv"`);
    res.send(BOM + csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duyệt đăng ký (CTSV/Admin)
router.post('/:id/approve', requireRole(ctsvOrAdmin), async (req, res) => {
  try {
    const { nguoiduyet, diemcong } = req.body;
    const registration = await StudentActivity.approve(req.params.id, nguoiduyet || req.user?.username || req.user?.id || 'ctsv', diemcong);
    emitActivityApproval(registration.mssv, 'duocduyet', registration.tenhoatdong);
    res.json(registration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Từ chối đăng ký (CTSV/Admin)
router.post('/:id/reject', requireRole(ctsvOrAdmin), async (req, res) => {
  try {
    const { nguoiduyet, ghichu } = req.body;
    const registration = await StudentActivity.reject(req.params.id, nguoiduyet || req.user?.username || req.user?.id || 'ctsv', ghichu);
    emitActivityApproval(registration.mssv, 'tuchoi', registration.tenhoatdong);
    res.json(registration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Đánh dấu hoàn thành
router.post('/:id/complete', async (req, res) => {
  try {
    const { diemcong } = req.body;
    const registration = await StudentActivity.complete(req.params.id, diemcong);
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hủy đăng ký
router.delete('/:id', async (req, res) => {
  try {
    await StudentActivity.cancel(req.params.id);
    res.json({ message: 'Hủy đăng ký thành công' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
