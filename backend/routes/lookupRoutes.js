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
    
    res.json({
      totalUsers: users[0].cnt,
      totalStudents: students[0].cnt,
      totalTeachers: teachers[0].cnt,
      totalCourses: courses[0].cnt
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

// Chỉ trả về học kỳ đang mở (trangthai = 'dangmo') — dùng cho dropdown người dùng nộp/đăng ký
router.get('/hocky-dangmo', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT mahocky, tenhocky, namhoc FROM hocky WHERE trangthai = 'dangmo' ORDER BY namhoc DESC, tenhocky"
    );
    res.json(rows);
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

// Lấy sinh viên theo MSSV
router.get('/student/:mssv', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT mssv, hoten, malop, makhoa FROM sinhvien WHERE mssv = ?',
      [req.params.mssv]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    res.json(rows[0]);
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

// Danh sách khoa (lấy từ bảng khoa, fallback về sinhvien DISTINCT)
router.get('/khoa-list', async (req, res) => {
  try {
    let rows = [];
    try {
      [rows] = await pool.execute('SELECT makhoa, tenkhoa FROM khoa ORDER BY makhoa');
    } catch {
      // fallback nếu không có bảng khoa
      const [sv] = await pool.execute(
        `SELECT DISTINCT makhoa, makhoa AS tenkhoa FROM sinhvien
         WHERE makhoa IS NOT NULL AND makhoa != '' ORDER BY makhoa`
      );
      rows = sv;
    }
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Danh sách lớp theo khoa (GV chỉ thấy lớp của khoa mình)
router.get('/lop-by-khoa', async (req, res) => {
  try {
    // Ưu tiên makhoa từ query, fallback về header (GV gửi qua interceptor)
    const makhoa = req.query.makhoa || req.headers['x-user-makhoa'] || null;
    const role = req.headers['x-user-role'] || '';

    // GV bắt buộc phải có makhoa — không cho xem tất cả lớp
    if (role === 'giangvien' && !makhoa) {
      return res.json({ data: [] });
    }

    let rows = [];
    const table = await (async () => {
      try { await pool.execute('SELECT 1 FROM lophanhchinh LIMIT 1'); return 'lophanhchinh'; }
      catch { return 'lophoc'; }
    })();
    if (makhoa) {
      [rows] = await pool.execute(
        `SELECT malop, tenlop FROM ${table} WHERE makhoa = ? ORDER BY malop`,
        [makhoa]
      );
      // fallback: lọc qua bảng sinhvien nếu bảng lớp không có cột makhoa
      if (rows.length === 0) {
        [rows] = await pool.execute(
          `SELECT DISTINCT s.malop, l.tenlop FROM sinhvien s
           LEFT JOIN ${table} l ON s.malop = l.malop
           WHERE s.makhoa = ? ORDER BY s.malop`,
          [makhoa]
        );
      }
    } else {
      [rows] = await pool.execute(`SELECT malop, tenlop FROM ${table} ORDER BY malop`);
    }
    res.json({ data: rows || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Danh sách lớp (lớp hành chính - để GV/CTSV chọn lớp gửi thông báo)
// Hỗ trợ cả bảng lophanhchinh (UPDATE_ALL_DATABASE) và lophoc (setup-complete-v2)
router.get('/lop', async (req, res) => {
  try {
    let rows = [];
    try {
      [rows] = await pool.execute(
        'SELECT malop, tenlop FROM lophanhchinh ORDER BY malop'
      );
    } catch (e) {
      if (e.code === 'ER_NO_SUCH_TABLE' || e.message?.includes('lophanhchinh')) {
        [rows] = await pool.execute(
          'SELECT malop, tenlop FROM lophoc ORDER BY malop'
        );
      } else throw e;
    }
    res.json({ data: rows || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin báo cáo: thống kê nâng cao (học bổng, DRL, GPA, đạt/rớt %)
router.get('/report-advanced', async (req, res) => {
  try {
    const { mahocky } = req.query;
    const hk = mahocky || null;

    // Số SV đạt học bổng
    let hocbongSql = 'SELECT COUNT(DISTINCT mssv) AS cnt FROM sinhvien_hocbong sh JOIN hocbong h ON sh.mahocbong = h.mahocbong WHERE sh.trangthai = ?';
    const hbParams = ['duyet'];
    if (hk) {
      hocbongSql += ' AND h.mahocky = ?';
      hbParams.push(hk);
    }
    const [[hb]] = await pool.execute(hocbongSql, hbParams);

    // DRL: đạt (diemtong >= 50) vs rớt
    let drlSql = 'SELECT COUNT(*) AS total, SUM(CASE WHEN diemtong >= 50 THEN 1 ELSE 0 END) AS dat FROM diemrenluyen WHERE 1=1';
    const drlParams = [];
    if (hk) {
      drlSql += ' AND mahocky = ?';
      drlParams.push(hk);
    }
    const [[drl]] = await pool.execute(drlSql, drlParams);

    // GPA cao nhất (từ bangdiem nếu có)
    let gpaSql = 'SELECT MAX(diemtongket) AS maxDiem FROM bangdiem b JOIN lophocphan l ON b.malophocphan = l.malophocphan WHERE 1=1';
    const gpaParams = [];
    if (hk) {
      gpaSql += ' AND l.mahocky = ?';
      gpaParams.push(hk);
    }
    try {
      const [[gpaRow]] = await pool.execute(gpaSql, gpaParams);
      var maxGPA = gpaRow?.maxDiem;
    } catch (_) {
      var maxGPA = null;
    }

    const totalDRL = Number(drl?.total) || 0;
    const datDRL = Number(drl?.dat) || 0;
    const rotDRL = totalDRL - datDRL;

    res.json({
      hocbongDat: Number(hb?.cnt) || 0,
      drlTotal: totalDRL,
      drlDat: datDRL,
      drlRot: rotDRL,
      drlDatPercent: totalDRL > 0 ? Math.round((datDRL / totalDRL) * 100) : 0,
      drlRotPercent: totalDRL > 0 ? Math.round((rotDRL / totalDRL) * 100) : 0,
      maxGPA: maxGPA != null ? maxGPA : null,
      mahocky: hk,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin báo cáo: thống kê theo lớp hoặc theo khoa
router.get('/report-stats', async (req, res) => {
  try {
    const { group } = req.query; // 'malop' | 'makhoa'

    if (group === 'makhoa') {
      // Lấy tất cả khoa từ bảng khoa, đếm SV tương ứng
      const [rows] = await pool.execute(`
        SELECT k.makhoa AS code, k.tenkhoa AS name,
               COUNT(s.mssv) AS total
        FROM khoa k
        LEFT JOIN sinhvien s ON s.makhoa = k.makhoa
        GROUP BY k.makhoa, k.tenkhoa
        ORDER BY k.makhoa
      `);
      return res.json({ data: rows });
    }

    if (group === 'malop') {
      // Lấy tất cả lớp từ bảng lophanhchinh, đếm SV tương ứng
      const [rows] = await pool.execute(`
        SELECT l.malop AS code, l.tenlop AS name, l.makhoa,
               COUNT(s.mssv) AS total
        FROM lophanhchinh l
        LEFT JOIN sinhvien s ON s.malop = l.malop
        GROUP BY l.malop, l.tenlop, l.makhoa
        ORDER BY l.makhoa, l.malop
      `);
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
