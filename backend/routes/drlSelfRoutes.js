import express from 'express';
import pool from '../config/database.js';
import SelfEvaluation from '../models/SelfEvaluation.js';
import { requireRole } from '../middleware/requireRole.js';
import Score from '../models/Score.js';
import { emitDrlScore } from '../socket.js';
import multer from 'multer';
import XLSX from 'xlsx';

// Multer: lưu file trong bộ nhớ (không ghi ra đĩa)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

/**
 * POST /api/drl-self/parse-excel
 * Nhận file .xlsx biểu mẫu DRL đã điền, trả về điểm từng mục (cột SV - cột E)
 * Mapping dòng (0-indexed): mục1=38, mục2=67, mục3=85, mục4=97, mục5=122
 */
router.post('/parse-excel', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Không có file được gửi lên' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Cột E = index 4 (điểm SV tự đánh giá)
    const COL_SV = 4;
    const toNum = (v) => {
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    };

    const result = {
      diem_ythuc_hoc_tap: toNum(data[38]?.[COL_SV]),   // Mục 1 - dòng 39
      diem_noi_quy: toNum(data[67]?.[COL_SV]),          // Mục 2 - dòng 68
      diem_hoat_dong: toNum(data[85]?.[COL_SV]),        // Mục 3 - dòng 86
      diem_cong_dong: toNum(data[97]?.[COL_SV]),        // Mục 4 - dòng 98
      diem_khen_thuong_ky_luat: toNum(data[122]?.[COL_SV]), // Mục 5 - dòng 123
    };

    // Đọc nhận xét SV nếu có (dòng 125, cột A)
    const nhan_xet_raw = String(data[125]?.[0] || '');
    // Lấy phần sau dấu ":" nếu có
    const colonIdx = nhan_xet_raw.indexOf(':');
    result.nhan_xet_sv = colonIdx >= 0 ? nhan_xet_raw.slice(colonIdx + 1).trim() : '';

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Không thể đọc file Excel: ' + err.message });
  }
});
// Sinh viên gửi / cập nhật phiếu tự đánh giá cho một học kỳ
router.post('/', async (req, res) => {
  try {
    const { mssv, mahocky, ...payload } = req.body || {};
    if (!mssv || !mahocky) {
      return res.status(400).json({ error: 'Thiếu mssv hoặc mahocky' });
    }
    // Chặn nếu CTSV đã chốt điểm chính thức
    const [locked] = await pool.execute(
      'SELECT id FROM drl_tudanhgia WHERE mssv = ? AND mahocky = ? AND nguoi_duyet_ctsv IS NOT NULL',
      [mssv, mahocky]
    );
    if (locked.length > 0) {
      return res.status(403).json({ error: 'Điểm học kỳ này đã được CTSV chốt chính thức, không thể chỉnh sửa.' });
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

// CVHT/CTSV/Admin/Khoa xem danh sách phiếu tự đánh giá theo lớp + học kỳ (malop rỗng = tất cả lớp)
router.get(
  '/class/:malop/semester/:mahocky',
  requireRole(['admin', 'giangvien', 'ctsv', 'khoa']),
  async (req, res) => {
    try {
      const { malop, mahocky } = req.params;
      const role = (req.user && req.user.role) || req.userRole || '';
      const makhoa = (req.user && req.user.makhoa) || req.headers['x-user-makhoa'] || null;

      // Khoa_Manager và Giảng viên: chỉ lấy phiếu thuộc khoa mình
      const queryOptions = {};
      if ((role === 'khoa' || role === 'giangvien') && makhoa) {
        queryOptions.makhoa = makhoa;
      }

      const records = await SelfEvaluation.getPendingByClassAndSemester(malop, mahocky, queryOptions);

      // Tách bước duyệt theo role:
      // - GV: thấy 'choduyet' (SV vừa gửi) + 'bituchoi'
      // - Khoa: thấy 'chokhoaduyet' thuộc khoa mình
      // - CTSV: thấy 'daduyet' nhưng CHƯA duyệt cuối (nguoi_duyet_ctsv NULL)
      //         Tương thích ngược: phiếu cũ có nguoi_duyet_khoa IS NULL nhưng trangthai='daduyet' vẫn hiển thị
      // - Admin: thấy tất cả
      let filtered = records;
      if (role === 'giangvien') {
        filtered = records.filter((r) => r.trangthai === 'choduyet' || r.trangthai === 'bituchoi');
      } else if (role === 'khoa') {
        filtered = records.filter((r) => r.trangthai === 'chokhoaduyet');
      } else if (role === 'ctsv') {
        // CTSV thấy phiếu 'daduyet' chưa duyệt cuối:
        // - Phiếu mới: nguoi_duyet_khoa IS NOT NULL (đã qua bước khoa)
        // - Phiếu cũ (tương thích ngược): nguoi_duyet_khoa IS NULL nhưng trangthai='daduyet'
        filtered = records.filter(
          (r) =>
            r.trangthai === 'daduyet' &&
            r.nguoi_duyet_ctsv == null &&
            (r.nguoi_duyet_khoa != null || r.nguoi_duyet_khoa == null)
        );
      }
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// CTSV/Admin: Xuất danh sách DRL ra Excel
router.get('/export-excel', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const { mahocky, makhoa, malop, trangthai } = req.query;
    let query = `
      SELECT t.mssv, s.hoten, s.malop, s.makhoa,
             h.tenhocky, h.namhoc,
             t.tong_diem, t.diem_cvht, t.diem_khoa, t.diem_ctsv,
             t.trangthai, t.nguoi_duyet_ctsv, t.ngay_duyet_ctsv
      FROM drl_tudanhgia t
      JOIN sinhvien s ON t.mssv = s.mssv
      LEFT JOIN hocky h ON t.mahocky = h.mahocky
      WHERE 1=1
    `;
    const params = [];
    if (mahocky)   { query += ' AND t.mahocky = ?';   params.push(mahocky); }
    if (makhoa)    { query += ' AND s.makhoa = ?';    params.push(makhoa); }
    if (malop)     { query += ' AND s.malop = ?';     params.push(malop); }
    if (trangthai) { query += ' AND t.trangthai = ?'; params.push(trangthai); }
    query += ' ORDER BY s.makhoa, s.malop, s.mssv';

    const [rows] = await pool.execute(query, params);

    const STATUS_LABEL = {
      choduyet: 'Chờ GV duyệt',
      chokhoaduyet: 'Chờ Khoa duyệt',
      daduyet: 'Đã chốt',
      bituchoi: 'Bị từ chối',
    };

    const wsData = [
      ['MSSV', 'Họ tên', 'Lớp', 'Khoa', 'Học kỳ', 'Điểm SV', 'Điểm CVHT', 'Điểm Khoa', 'Điểm CTSV (chính thức)', 'Trạng thái', 'Người chốt', 'Ngày chốt'],
      ...rows.map((r) => [
        r.mssv,
        r.hoten,
        r.malop,
        r.makhoa,
        r.tenhocky ? `${r.tenhocky} - ${r.namhoc}` : (r.mahocky || ''),
        r.tong_diem ?? '',
        r.diem_cvht ?? '',
        r.diem_khoa ?? '',
        r.diem_ctsv ?? '',
        STATUS_LABEL[r.trangthai] || r.trangthai,
        r.nguoi_duyet_ctsv ?? '',
        r.ngay_duyet_ctsv ? new Date(r.ngay_duyet_ctsv).toLocaleDateString('vi-VN') : '',
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Độ rộng cột
    ws['!cols'] = [
      { wch: 14 }, { wch: 28 }, { wch: 12 }, { wch: 10 },
      { wch: 22 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'DRL');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `DRL_${mahocky || 'tatca'}_${makhoa || ''}_${malop || ''}.xlsx`.replace(/_{2,}/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CTSV: Quản lý tổng hợp tất cả phiếu DRL (lọc theo khoa, lớp, học kỳ, trạng thái)
router.get('/manage', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const { mahocky, makhoa, malop, trangthai } = req.query;
    let query = `
      SELECT t.*, s.hoten, s.malop, s.makhoa, h.tenhocky, h.namhoc
      FROM drl_tudanhgia t
      JOIN sinhvien s ON t.mssv = s.mssv
      LEFT JOIN hocky h ON t.mahocky = h.mahocky
      WHERE 1=1
    `;
    const params = [];
    if (mahocky) { query += ' AND t.mahocky = ?'; params.push(mahocky); }
    if (makhoa)  { query += ' AND s.makhoa = ?';  params.push(makhoa); }
    if (malop)   { query += ' AND s.malop = ?';   params.push(malop); }
    if (trangthai) { query += ' AND t.trangthai = ?'; params.push(trangthai); }
    query += ' ORDER BY s.makhoa, s.malop, t.trangthai, t.tong_diem DESC';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy danh sách sinh viên theo trạng thái DRL trong một học kỳ
router.get(
  '/students-by-status',
  requireRole(['admin', 'ctsv', 'giangvien', 'khoa']),
  async (req, res) => {
    try {
      const { mahocky, trangthai, makhoa, malop } = req.query;

      // Validate mahocky bắt buộc
      if (!mahocky) {
        return res.status(400).json({ error: 'mahocky là bắt buộc' });
      }

      // Validate trangthai
      const VALID_TRANGTHAI = ['chua_nop', 'choduyet', 'chokhoaduyet', 'bituchoi', 'daduyet'];
      if (!trangthai || !VALID_TRANGTHAI.includes(trangthai)) {
        return res.status(400).json({
          error: 'Trạng thái không hợp lệ. Các giá trị hợp lệ: chua_nop, choduyet, chokhoaduyet, bituchoi, daduyet',
        });
      }

      const role = (req.user && req.user.role) || '';
      const userMakhoa = (req.user && req.user.makhoa) || null;

      // Xác định filter makhoa theo role
      const effectiveMakhoa =
        role === 'giangvien' || role === 'khoa'
          ? userMakhoa
          : makhoa || null;

      let rows;

      if (trangthai === 'chua_nop') {
        // Sinh viên KHÔNG có bản ghi trong drl_tudanhgia cho mahocky này
        let query = `
          SELECT s.mssv, s.hoten, s.malop, s.makhoa, 'chua_nop' AS trangthai
          FROM sinhvien s
          WHERE s.mssv NOT IN (
            SELECT mssv FROM drl_tudanhgia WHERE mahocky = ?
          )
        `;
        const params = [mahocky];

        if (effectiveMakhoa) {
          query += ' AND s.makhoa = ?';
          params.push(effectiveMakhoa);
        }
        if (malop && role !== 'giangvien' && role !== 'khoa') {
          query += ' AND s.malop = ?';
          params.push(malop);
        } else if (malop && (role === 'giangvien' || role === 'khoa')) {
          query += ' AND s.malop = ?';
          params.push(malop);
        }

        [rows] = await pool.execute(query, params);
      } else {
        // JOIN drl_tudanhgia với sinhvien theo trangthai + mahocky
        let query = `
          SELECT t.mssv, s.hoten, s.malop, s.makhoa, t.trangthai, t.tong_diem
          FROM drl_tudanhgia t
          JOIN sinhvien s ON t.mssv = s.mssv
          WHERE t.mahocky = ? AND t.trangthai = ?
        `;
        const params = [mahocky, trangthai];

        if (effectiveMakhoa) {
          query += ' AND s.makhoa = ?';
          params.push(effectiveMakhoa);
        }
        if (malop) {
          query += ' AND s.malop = ?';
          params.push(malop);
        }

        [rows] = await pool.execute(query, params);
      }

      res.json({ data: rows, total: rows.length });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại' });
    }
  }
);

// CTSV: Lấy danh sách khoa có phiếu DRL
router.get('/manage/khoa-list', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT s.makhoa FROM drl_tudanhgia t
       JOIN sinhvien s ON t.mssv = s.mssv
       WHERE s.makhoa IS NOT NULL AND s.makhoa != ''
       ORDER BY s.makhoa`
    );
    res.json(rows.map((r) => r.makhoa));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GV/CTSV/Admin/Khoa duyệt phiếu
router.put('/:id/review', requireRole(['admin', 'giangvien', 'ctsv', 'khoa']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || {};
    const role = user.role || req.userRole || '';
    const makhoa = user.makhoa || req.headers['x-user-makhoa'] || null;

    // Lấy phiếu hiện tại để kiểm tra
    const [phieuRows] = await pool.execute(
      `SELECT t.*, s.makhoa as sv_makhoa
       FROM drl_tudanhgia t
       JOIN sinhvien s ON t.mssv = s.mssv
       WHERE t.id = ?`,
      [id]
    );
    if (phieuRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phiếu tự đánh giá' });
    }
    const phieu = phieuRows[0];

    // Kiểm tra makhoa của Khoa_Manager vs makhoa của sinh viên
    if (role === 'khoa') {
      if (!makhoa || phieu.sv_makhoa !== makhoa) {
        return res.status(403).json({ error: 'Không có quyền duyệt phiếu của khoa khác' });
      }
    }

    // Giảng viên chỉ được duyệt phiếu thuộc khoa mình
    if (role === 'giangvien' && makhoa) {
      if (phieu.sv_makhoa !== makhoa) {
        return res.status(403).json({ error: 'Không có quyền duyệt phiếu của sinh viên khoa khác' });
      }
    }

    // Kiểm tra thứ tự workflow: CTSV không được duyệt phiếu chưa qua bước khoa
    // Trừ phiếu cũ tương thích ngược: nguoi_duyet_khoa IS NULL nhưng trangthai='daduyet'
    if (role === 'ctsv') {
      const isOldPhieu = phieu.nguoi_duyet_khoa == null && phieu.trangthai === 'daduyet';
      const hasKhoaApproved = phieu.nguoi_duyet_khoa != null;
      if (!isOldPhieu && !hasKhoaApproved) {
        return res.status(400).json({ error: 'Phiếu chưa đến bước duyệt của bạn' });
      }
    }

    const updated = await SelfEvaluation.reviewByRole(id, role, {
      trangthai: req.body.trangthai,
      diem_cvht: req.body.diem_cvht,
      nhan_xet_cvht: req.body.nhan_xet_cvht,
      diem_khoa: req.body.diem_khoa,
      nhan_xet_khoa: req.body.nhan_xet_khoa,
      diem_ctsv: req.body.diem_ctsv,
      nhan_xet_ctsv: req.body.nhan_xet_ctsv,
      nguoi_duyet: user.username || user.id || role || 'system',
    });

    // Logging hành động duyệt/từ chối của Khoa_Manager
    if (role === 'khoa') {
      console.log(
        `[KHOA_REVIEW] id=${id} mssv=${phieu.mssv} username=${user.username || user.id} makhoa=${makhoa} trangthai=${updated?.trangthai} timestamp=${new Date().toISOString()}`
      );
    }

    // Nếu CTSV duyệt cuối: role=ctsv & trangthai='daduyet'
    const isFinalApproved =
      role === 'ctsv' &&
      updated &&
      updated.trangthai === 'daduyet';

    if (isFinalApproved) {
      const mssv = updated.mssv;
      const mahocky = updated.mahocky;
      // Ưu tiên diem_ctsv (điểm CTSV chốt chính thức), fallback về diem_cvht hoặc tong_diem
      const finalTotal =
        updated.diem_ctsv != null
          ? Number(updated.diem_ctsv)
          : updated.diem_cvht != null
            ? Number(updated.diem_cvht)
            : Number(updated.tong_diem || 0);

      const ghichu = updated.nhan_xet_ctsv
        ? `CTSV: ${updated.nhan_xet_ctsv}`
        : `Điểm chính thức do CTSV chốt`;

      // Ghi thẳng diem_ctsv vào diemtong (không tính lại từ thành phần)
      const saved = await Score.updateScoreFromCtsv(mssv, mahocky, finalTotal, ghichu);
      if (saved) emitDrlScore(mssv, saved.diemtong, saved.xeploai);
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
