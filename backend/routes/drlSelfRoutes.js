import express from 'express';
import SelfEvaluation from '../models/SelfEvaluation.js';
import { requireRole } from '../middleware/requireRole.js';
import Score from '../models/Score.js';
import { emitDrlScore } from '../socket.js';

const router = express.Router();

// Sinh viên gửi / cập nhật phiếu tự đánh giá cho một học kỳ
router.post('/', async (req, res) => {
  try {
    const { mssv, mahocky, ...payload } = req.body || {};
    if (!mssv || !mahocky) {
      return res.status(400).json({ error: 'Thiếu mssv hoặc mahocky' });
    }
    const record = await SelfEvaluation.upsertForStudent(mssv, mahocky, payload);
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy lịch sử tự đánh giá của một sinh viên
router.get('/student/:mssv', async (req, res) => {
  try {
    const records = await SelfEvaluation.getByStudent(req.params.mssv);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy phiếu tự đánh giá theo sinh viên + học kỳ
router.get('/student/:mssv/semester/:mahocky', async (req, res) => {
  try {
    const record = await SelfEvaluation.getByStudentAndSemester(
      req.params.mssv,
      req.params.mahocky
    );
    if (!record) {
      return res.status(404).json({ error: 'Chưa có phiếu tự đánh giá' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CVHT/CTSV/Admin xem danh sách phiếu tự đánh giá theo lớp + học kỳ (malop rỗng = tất cả lớp)
router.get(
  '/class/:malop/semester/:mahocky',
  requireRole(['admin', 'giangvien', 'ctsv']),
  async (req, res) => {
    try {
      const { malop, mahocky } = req.params;
      const records = await SelfEvaluation.getPendingByClassAndSemester(malop, mahocky);
      const role = (req.user && req.user.role) || req.userRole || '';

      // Tách bước duyệt:
      // - GV: thấy 'choduyet' (SV vừa gửi) + 'bituchoi'
      // - CTSV: thấy 'daduyet' nhưng CHƯA duyệt cuối (nguoi_duyet_ctsv NULL)
      // - Admin: thấy tất cả
      let filtered = records;
      if (role === 'giangvien') {
        filtered = records.filter((r) => r.trangthai === 'choduyet' || r.trangthai === 'bituchoi');
      } else if (role === 'ctsv') {
        filtered = records.filter((r) => r.trangthai === 'daduyet' && (r.nguoi_duyet_ctsv == null));
      }
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GV/CTSV/Admin duyệt phiếu
router.put('/:id/review', requireRole(['admin', 'giangvien', 'ctsv']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || {};
    const role = user.role || req.userRole || '';
    const updated = await SelfEvaluation.reviewByRole(id, role, {
      trangthai: req.body.trangthai,
      diem_cvht: req.body.diem_cvht,
      nhan_xet_cvht: req.body.nhan_xet_cvht,
      diem_ctsv: req.body.diem_ctsv,
      nhan_xet_ctsv: req.body.nhan_xet_ctsv,
      nguoi_duyet: user.username || user.id || null,
    });

    // Nếu CTSV duyệt cuối (dấu hiệu: role=ctsv & trangthai='daduyet' & có nguoi_duyet_ctsv hoặc fallback)
    const isFinalApproved =
      role === 'ctsv' &&
      updated &&
      updated.trangthai === 'daduyet' &&
      (updated.nguoi_duyet_ctsv != null || req.body.diem_ctsv != null || req.body.nhan_xet_ctsv != null);

    if (isFinalApproved) {
      const mssv = updated.mssv;
      const mahocky = updated.mahocky;
      const finalTotal =
        updated.diem_ctsv != null
          ? Number(updated.diem_ctsv)
          : updated.diem_cvht != null
            ? Number(updated.diem_cvht)
            : Number(updated.tong_diem || 0);

      // Map từ phiếu tự đánh giá sang bảng diemrenluyen (giữ breakdown cơ bản)
      const diemhoctap = Number(updated.diem_ythuc_hoc_tap || 0);
      const diemhoatdong = Number(updated.diem_hoat_dong || 0) + Number(updated.diem_cong_dong || 0);
      const diemkyluat =
        Number(updated.diem_noi_quy || 0) + Number(updated.diem_khen_thuong_ky_luat || 0);

      const saved = await Score.updateScore(mssv, mahocky, {
        diemhoatdong,
        diemhoctap,
        diemkyluat,
        ghichu: `Điểm chính thức (CTSV duyệt). Tổng điểm: ${finalTotal}`,
      });
      if (saved) emitDrlScore(mssv, saved.diemtong, saved.xeploai);
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

