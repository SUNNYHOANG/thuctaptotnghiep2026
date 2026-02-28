import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// ============================================================
// UTILITY FUNCTIONS - Tính toán GPA, xếp loại, cảnh báo
// ============================================================

/**
 * Tính GPA từ điểm tổng kết
 * @param {number} diemTongKet - Điểm từ 0-10
 * @returns {number} GPA từ 0-4
 */
function calculateGPA(diemTongKet) {
  if (diemTongKet === null || diemTongKet === undefined) return null;
  if (diemTongKet < 0 || diemTongKet > 10) return null;
  return (diemTongKet / 10) * 4;
}

/**
 * Xếp loại học lực
 * @param {number} gpa - GPA từ 0-4
 * @returns {string} Xếp loại
 */
function getClassification(gpa) {
  if (gpa === null || gpa === undefined) return 'Chưa xếp loại';
  if (gpa >= 3.6) return 'Xuất sắc';
  if (gpa >= 3.2) return 'Tốt';
  if (gpa >= 2.8) return 'Khá';
  if (gpa >= 2.4) return 'Trung bình';
  if (gpa >= 2.0) return 'Yếu';
  return 'Kém';
}

/**
 * Cảnh báo học vụ
 * @param {number} gpa - GPA từ 0-4
 * @returns {string|null} Cảnh báo hoặc null
 */
function getAcademicWarning(gpa) {
  if (gpa === null || gpa === undefined) return null;
  if (gpa < 2.0) return 'Cảnh báo: GPA dưới 2.0 - Cần cải thiện';
  if (gpa < 2.4) return 'Cảnh báo: GPA còn thấp - Nên tuyên bố học tập';
  return null;
}

// ============================================================
// API ROUTES
// ============================================================

/**
 * 1. Lấy điểm của sinh viên trong một học kỳ
 * GET /api/grades/student/:mssv?mahocky=1
 */
router.get('/student/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const { mahocky } = req.query;

    let query = `
      SELECT 
        bd.mabangdiem,
        bd.malophocphan,
        bd.mssv,
        mh.tenmonhoc,
        lhp.thoigian,
        lhp.phonghoc,
        gv.tengiaovien,
        bd.diemchuyencan,
        bd.diemgiuaky,
        bd.diemcuoiky,
        bd.diemtongket,
        bd.gpa,
        bd.trangthai,
        bd.ghichu,
        hk.tenhocky,
        hk.mahocky
      FROM bangdiem bd
      JOIN lophocphan lhp ON bd.malophocphan = lhp.malophocphan
      JOIN monhoc mh ON lhp.mamonhoc = mh.mamonhoc
      JOIN giangvien gv ON lhp.magiaovien = gv.magiaovien
      JOIN hocky hk ON lhp.mahocky = hk.mahocky
      WHERE bd.mssv = ?
    `;

    const params = [mssv];
    if (mahocky) {
      query += ' AND lhp.mahocky = ?';
      params.push(mahocky);
    }

    query += ' ORDER BY hk.mahocky DESC, mh.tenmonhoc ASC';

    const [grades] = await pool.execute(query, params);
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Lấy điểm theo lớp học phần
 * GET /api/grades/class/:malophocphan
 */
router.get('/class/:malophocphan', async (req, res) => {
  try {
    const { malophocphan } = req.params;

    const query = `
      SELECT 
        bd.mabangdiem,
        bd.malophocphan,
        bd.mssv,
        sv.hoten,
        sv.malop,
        bd.diemchuyencan,
        bd.diemgiuaky,
        bd.diemcuoiky,
        bd.diemtongket,
        bd.gpa,
        bd.trangthai,
        bd.ghichu
      FROM bangdiem bd
      JOIN sinhvien sv ON bd.mssv = sv.mssv
      WHERE bd.malophocphan = ?
      ORDER BY sv.hoten ASC
    `;

    const [grades] = await pool.execute(query, [malophocphan]);
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Nhập/tạo bảng điểm từ danh sách đăng ký
 * POST /api/grades/init/:malophocphan
 */
router.post('/init/:malophocphan', async (req, res) => {
  try {
    const { malophocphan } = req.params;

    // Lấy danh sách sinh viên đã đăng ký
    const [students] = await pool.execute(
      `SELECT DISTINCT sv.mssv, sv.hoten 
       FROM dangky dk
       JOIN sinhvien sv ON dk.mssv = sv.mssv
       WHERE dk.malophocphan = ? AND dk.trangthai = 'dangky'`,
      [malophocphan]
    );

    // Tạo bảng điểm cho từng sinh viên
    let created = 0;
    for (const student of students) {
      try {
        await pool.execute(
          `INSERT IGNORE INTO bangdiem (malophocphan, mssv) 
           VALUES (?, ?)`,
          [malophocphan, student.mssv]
        );
        created++;
      } catch (e) {
        // Bỏ qua nếu đã tồn tại
      }
    }

    res.json({ 
      message: `Đã tạo ${created} bảng điểm`,
      created
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. Nhập điểm cho sinh viên
 * POST /api/grades
 * Body: { malophocphan, mssv, diemchuyencan, diemgiuaky, diemcuoiky }
 */
router.post('/', async (req, res) => {
  try {
    const { malophocphan, mssv, diemchuyencan, diemgiuaky, diemcuoiky, ghichu } = req.body;
    const nguoinhap = req.user?.username || 'system';

    // Tính điểm tổng kết
    const diemTongKet = (
      (diemchuyencan || 0) * 0.1 +
      (diemgiuaky || 0) * 0.3 +
      (diemcuoiky || 0) * 0.6
    ).toFixed(2);

    const gpa = calculateGPA(diemTongKet);
    const canhbao = getAcademicWarning(gpa);

    // Upsert vào bangdiem
    const [result] = await pool.execute(
      `INSERT INTO bangdiem (malophocphan, mssv, diemchuyencan, diemgiuaky, diemcuoiky, diemtongket, gpa, canhbao, ghichu, nguoinhap)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       diemchuyencan = ?, diemgiuaky = ?, diemcuoiky = ?, diemtongket = ?, gpa = ?, canhbao = ?, ghichu = ?, nguoinhap = ?`,
      [
        malophocphan, mssv, diemchuyencan || null, diemgiuaky || null, diemcuoiky || null,
        diemTongKet, gpa, canhbao, ghichu || null, nguoinhap,
        // Dùng lại cho UPDATE
        diemchuyencan || null, diemgiuaky || null, diemcuoiky || null,
        diemTongKet, gpa, canhbao, ghichu || null, nguoinhap
      ]
    );

    res.json({ 
      message: 'Nhập điểm thành công',
      mabangdiem: result.insertId,
      diemTongKet,
      gpa,
      xeploai: getClassification(gpa)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. Sửa điểm (tạo log)
 * PUT /api/grades/:mabangdiem
 */
router.put('/:mabangdiem', async (req, res) => {
  try {
    const { mabangdiem } = req.params;
    const { diemchuyencan, diemgiuaky, diemcuoiky, ghichu } = req.body;
    const nguoisua = req.user?.username || 'system';

    // Lấy điểm cũ để log
    const [oldGrade] = await pool.execute(
      'SELECT diemchuyencan, diemgiuaky, diemcuoiky, diemtongket, gpa FROM bangdiem WHERE mabangdiem = ?',
      [mabangdiem]
    );

    if (oldGrade.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bảng điểm' });
    }

    const oldData = oldGrade[0];

    // Tính điểm mới
    const diemTongKet = (
      (diemchuyencan || 0) * 0.1 +
      (diemgiuaky || 0) * 0.3 +
      (diemcuoiky || 0) * 0.6
    ).toFixed(2);

    const gpa = calculateGPA(diemTongKet);
    const canhbao = getAcademicWarning(gpa);

    // Cập nhật bảng điểm
    await pool.execute(
      `UPDATE bangdiem 
       SET diemchuyencan = ?, diemgiuaky = ?, diemcuoiky = ?, 
           diemtongket = ?, gpa = ?, canhbao = ?, ghichu = ? 
       WHERE mabangdiem = ?`,
      [diemchuyencan || null, diemgiuaky || null, diemcuoiky || null, diemTongKet, gpa, canhbao, ghichu || null, mabangdiem]
    );

    // Log các thay đổi
    if (diemchuyencan !== undefined && diemchuyencan !== oldData.diemchuyencan) {
      await pool.execute(
        `INSERT INTO log_suadiem (mabangdiem, loaidiem, giatricu, giatrimoi, nguoisua, lydo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [mabangdiem, 'diemchuyencan', oldData.diemchuyencan, diemchuyencan, nguoisua, ghichu || 'Sửa điểm']
      );
    }
    if (diemgiuaky !== undefined && diemgiuaky !== oldData.diemgiuaky) {
      await pool.execute(
        `INSERT INTO log_suadiem (mabangdiem, loaidiem, giatricu, giatrimoi, nguoisua, lydo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [mabangdiem, 'diemgiuaky', oldData.diemgiuaky, diemgiuaky, nguoisua, ghichu || 'Sửa điểm']
      );
    }
    if (diemcuoiky !== undefined && diemcuoiky !== oldData.diemcuoiky) {
      await pool.execute(
        `INSERT INTO log_suadiem (mabangdiem, loaidiem, giatricu, giatrimoi, nguoisua, lydo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [mabangdiem, 'diemcuoiky', oldData.diemcuoiky, diemcuoiky, nguoisua, ghichu || 'Sửa điểm']
      );
    }

    res.json({ 
      message: 'Cập nhật điểm thành công',
      diemTongKet,
      gpa,
      xeploai: getClassification(gpa)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. Lấy log sửa điểm
 * GET /api/grades/:mabangdiem/log
 */
router.get('/:mabangdiem/log', async (req, res) => {
  try {
    const { mabangdiem } = req.params;

    const [logs] = await pool.execute(
      `SELECT id, loaidiem, giatricu, giatrimoi, nguoisua, ngaysua, lydo
       FROM log_suadiem 
       WHERE mabangdiem = ?
       ORDER BY ngaysua DESC`,
      [mabangdiem]
    );

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 7. Khóa điểm lớp học phần
 * POST /api/grades/lock/:malophocphan
 */
router.post('/lock/:malophocphan', async (req, res) => {
  try {
    const { malophocphan } = req.params;
    const { ngaykhoa } = req.body;

    const [result] = await pool.execute(
      `UPDATE bangdiem 
       SET trangthai = 'dakhoa', ngaykhoa = ? 
       WHERE malophocphan = ? AND trangthai = 'dangnhap'`,
      [ngaykhoa || new Date(), malophocphan]
    );

    res.json({ 
      message: 'Đã khóa bảng điểm',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 8. Mở khóa điểm lớp học phần
 * POST /api/grades/unlock/:malophocphan
 */
router.post('/unlock/:malophocphan', async (req, res) => {
  try {
    const { malophocphan } = req.params;

    const [result] = await pool.execute(
      `UPDATE bangdiem 
       SET trangthai = 'dangnhap', ngaykhoa = NULL
       WHERE malophocphan = ? AND trangthai = 'dakhoa'`,
      [malophocphan]
    );

    res.json({ 
      message: 'Đã mở khóa bảng điểm',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 9. Xuất bảng điểm (JSON/CSV)
 * GET /api/grades/export/:malophocphan
 */
router.get('/export/:malophocphan', async (req, res) => {
  try {
    const { malophocphan } = req.params;

    const [grades] = await pool.execute(
      `SELECT 
        bd.mabangdiem,
        bd.mssv,
        sv.hoten,
        bd.diemchuyencan,
        bd.diemgiuaky,
        bd.diemcuoiky,
        bd.diemtongket,
        bd.gpa,
        bd.trangthai
      FROM bangdiem bd
      JOIN sinhvien sv ON bd.mssv = sv.mssv
      WHERE bd.malophocphan = ?
      ORDER BY sv.hoten ASC`,
      [malophocphan]
    );

    // Tạo CSV
    const headers = ['MSSV', 'Họ Tên', 'Điểm Chuyên Cần', 'Điểm Giữa Kỳ', 'Điểm Cuối Kỳ', 'Điểm Tổng Kết', 'GPA', 'Trạng Thái'];
    const csvContent = [
      headers.join(','),
      ...grades.map(g => [
        g.mssv,
        g.hoten,
        g.diemchuyencan || '',
        g.diemgiuaky || '',
        g.diemcuoiky || '',
        g.diemtongket || '',
        g.gpa || '',
        g.trangthai
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=bangdiem.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 10. Thống kê theo học kỳ
 * GET /api/grades/stats/:mahocky
 */
router.get('/stats/:mahocky', async (req, res) => {
  try {
    const { mahocky } = req.params;

    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        AVG(gpa) as avgGPA,
        MAX(diemtongket) as maxDiem,
        MIN(diemtongket) as minDiem,
        SUM(CASE WHEN gpa >= 3.6 THEN 1 ELSE 0 END) as xuatSac,
        SUM(CASE WHEN gpa >= 3.2 AND gpa < 3.6 THEN 1 ELSE 0 END) as tot,
        SUM(CASE WHEN gpa >= 2.8 AND gpa < 3.2 THEN 1 ELSE 0 END) as kha,
        SUM(CASE WHEN gpa >= 2.4 AND gpa < 2.8 THEN 1 ELSE 0 END) as trungbinh,
        SUM(CASE WHEN gpa >= 2.0 AND gpa < 2.4 THEN 1 ELSE 0 END) as yeu,
        SUM(CASE WHEN gpa < 2.0 THEN 1 ELSE 0 END) as kem
      FROM bangdiem bd
      JOIN lophocphan lhp ON bd.malophocphan = lhp.malophocphan
      WHERE lhp.mahocky = ?`,
      [mahocky]
    );

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
