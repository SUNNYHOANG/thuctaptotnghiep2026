import express from 'express';
import XLSX from 'xlsx';
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

// CTSV/Admin: Lấy danh sách SV đã được duyệt của một hoạt động
router.get('/activity/:mahoatdong/approved', requireRole(ctsvOrAdmin), async (req, res) => {
  try {
    const list = await StudentActivity.getApprovedByActivity(req.params.mahoatdong);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CTSV/Admin: Đóng hoạt động (chuyển trangthai -> dachot)
router.post('/activity/:mahoatdong/close', requireRole(ctsvOrAdmin), async (req, res) => {
  try {
    const activity = await Activity.update(req.params.mahoatdong, { trangthai: 'dachot' });
    if (!activity) return res.status(404).json({ error: 'Không tìm thấy hoạt động' });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CTSV/Admin: Export danh sách SV đăng ký thành công (XLSX)
router.get('/activity/:mahoatdong/export', requireRole(ctsvOrAdmin), async (req, res) => {
  try {
    const { mahoatdong } = req.params;
    const activity = await Activity.getById(mahoatdong);
    if (!activity) return res.status(404).json({ error: 'Không tìm thấy hoạt động' });

    const list = await StudentActivity.getApprovedByActivity(mahoatdong);

    const wsData = [
      ['STT', 'MSSV', 'Họ tên', 'Lớp', 'Vai trò', 'Ngày đăng ký', 'Ngày duyệt', 'Trạng thái'],
      ...list.map((r, i) => [
        i + 1,
        r.mssv || '',
        r.hoten || '',
        r.malop || '',
        r.vaitro === 'tochuc' ? 'Tổ chức' : r.vaitro === 'truongnhom' ? 'Trưởng nhóm' : 'Tham gia',
        r.ngaydangky ? new Date(r.ngaydangky).toLocaleString('vi-VN') : '',
        r.ngayduyet ? new Date(r.ngayduyet).toLocaleString('vi-VN') : '',
        'Đăng ký thành công',
      ])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Căn độ rộng cột
    ws['!cols'] = [5, 14, 28, 12, 12, 20, 20, 22].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `Danh_sach_${(activity.tenhoatdong || mahoatdong).replace(/\s+/g, '_')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buf);
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
