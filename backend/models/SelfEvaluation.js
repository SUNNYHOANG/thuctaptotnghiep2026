import pool from '../config/database.js';

class SelfEvaluation {
  static async upsertForStudent(mssv, mahocky, payload) {
    const {
      diem_ythuc_hoc_tap = 0,
      diem_noi_quy = 0,
      diem_hoat_dong = 0,
      diem_cong_dong = 0,
      diem_khen_thuong_ky_luat = 0,
      nhan_xet_sv = null,
    } = payload || {};

    const tong_diem =
      (Number(diem_ythuc_hoc_tap) || 0) +
      (Number(diem_noi_quy) || 0) +
      (Number(diem_hoat_dong) || 0) +
      (Number(diem_cong_dong) || 0) +
      (Number(diem_khen_thuong_ky_luat) || 0);

    const [existing] = await pool.execute(
      'SELECT id FROM drl_tudanhgia WHERE mssv = ? AND mahocky = ?',
      [mssv, mahocky]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE drl_tudanhgia
         SET diem_ythuc_hoc_tap = ?, diem_noi_quy = ?, diem_hoat_dong = ?,
             diem_cong_dong = ?, diem_khen_thuong_ky_luat = ?, tong_diem = ?,
             nhan_xet_sv = ?, trangthai = 'choduyet',
             -- khi SV gửi lại, reset duyệt cuối CTSV (nếu có)
             diem_ctsv = NULL, nhan_xet_ctsv = NULL, nguoi_duyet_ctsv = NULL, ngay_duyet_ctsv = NULL
         WHERE mssv = ? AND mahocky = ?`,
        [
          diem_ythuc_hoc_tap,
          diem_noi_quy,
          diem_hoat_dong,
          diem_cong_dong,
          diem_khen_thuong_ky_luat,
          tong_diem,
          nhan_xet_sv,
          mssv,
          mahocky,
        ]
      );
    } else {
      await pool.execute(
        `INSERT INTO drl_tudanhgia
         (mssv, mahocky, diem_ythuc_hoc_tap, diem_noi_quy, diem_hoat_dong,
          diem_cong_dong, diem_khen_thuong_ky_luat, tong_diem, nhan_xet_sv)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mssv,
          mahocky,
          diem_ythuc_hoc_tap,
          diem_noi_quy,
          diem_hoat_dong,
          diem_cong_dong,
          diem_khen_thuong_ky_luat,
          tong_diem,
          nhan_xet_sv,
        ]
      );
    }

    return this.getByStudentAndSemester(mssv, mahocky);
  }

  static async getByStudentAndSemester(mssv, mahocky) {
    const [rows] = await pool.execute(
      `SELECT t.*, h.tenhocky, h.namhoc
       FROM drl_tudanhgia t
       LEFT JOIN hocky h ON t.mahocky = h.mahocky
       WHERE t.mssv = ? AND t.mahocky = ?`,
      [mssv, mahocky]
    );
    return rows[0] || null;
  }

  static async getByStudent(mssv) {
    const [rows] = await pool.execute(
      `SELECT t.*, h.tenhocky, h.namhoc
       FROM drl_tudanhgia t
       LEFT JOIN hocky h ON t.mahocky = h.mahocky
       WHERE t.mssv = ?
       ORDER BY h.namhoc DESC, h.tenhocky DESC`,
      [mssv]
    );
    return rows;
  }

  static async getPendingByClassAndSemester(malop, mahocky, options = {}) {
    if (!mahocky) return [];
    const { makhoa } = options;
    let query = `SELECT t.*, s.hoten, s.malop, s.makhoa
       FROM drl_tudanhgia t
       JOIN sinhvien s ON t.mssv = s.mssv
       WHERE t.mahocky = ?`;
    const params = [mahocky];
    if (malop != null && String(malop).trim() !== '') {
      query += ' AND s.malop = ?';
      params.push(String(malop).trim());
    }
    if (makhoa != null && String(makhoa).trim() !== '') {
      query += ' AND s.makhoa = ?';
      params.push(String(makhoa).trim());
    }
    query += ' ORDER BY t.trangthai ASC, t.tong_diem DESC, t.id DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async reviewByRole(
    id,
    role,
    {
      trangthai,
      diem_cvht,
      nhan_xet_cvht,
      diem_khoa,
      nhan_xet_khoa,
      diem_ctsv,
      nhan_xet_ctsv,
      nguoi_duyet,
    }
  ) {
    // Allowed statuses including new 'chokhoaduyet'
    const allowed = ['choduyet', 'daduyet', 'bituchoi', 'chokhoaduyet'];
    let nextStatus = trangthai;
    if (!allowed.includes(nextStatus)) {
      nextStatus = 'daduyet';
    }

    if (role === 'giangvien') {
      // GV duyệt: chuyển sang 'chokhoaduyet' thay vì 'daduyet'
      const gvStatus = nextStatus === 'daduyet' ? 'chokhoaduyet' : nextStatus;
      await pool.execute(
        `UPDATE drl_tudanhgia
         SET trangthai = ?,
             diem_cvht = ?, nhan_xet_cvht = ?, nguoi_duyet_cvht = ?, ngay_duyet_cvht = NOW()
         WHERE id = ?`,
        [
          gvStatus,
          diem_cvht ?? null,
          nhan_xet_cvht || null,
          nguoi_duyet || null,
          id,
        ]
      );
    } else if (role === 'khoa') {
      // Khoa duyệt: cập nhật diem_khoa, nhan_xet_khoa, nguoi_duyet_khoa, ngay_duyet_khoa
      // Nếu duyệt (daduyet) -> chuyển sang 'daduyet' (chờ CTSV)
      // Nếu từ chối (bituchoi) -> chuyển sang 'bituchoi'
      await pool.execute(
        `UPDATE drl_tudanhgia
         SET trangthai = ?,
             diem_khoa = ?, nhan_xet_khoa = ?, nguoi_duyet_khoa = ?, ngay_duyet_khoa = NOW()
         WHERE id = ?`,
        [
          nextStatus,
          diem_khoa ?? null,
          nhan_xet_khoa || null,
          nguoi_duyet || null,
          id,
        ]
      );
    } else if (role === 'ctsv') {
      // CTSV duyệt cuối: trangthai thường là 'daduyet'; dấu hiệu "đã duyệt cuối" nằm ở nguoi_duyet_ctsv/ngay_duyet_ctsv
      await pool.execute(
        `UPDATE drl_tudanhgia
         SET trangthai = ?,
             diem_ctsv = ?, nhan_xet_ctsv = ?, nguoi_duyet_ctsv = ?, ngay_duyet_ctsv = NOW()
         WHERE id = ?`,
        [
          nextStatus,
          diem_ctsv ?? null,
          nhan_xet_ctsv || null,
          nguoi_duyet || null,
          id,
        ]
      );
    } else {
      // Admin: cập nhật cả các bước duyệt
      await pool.execute(
        `UPDATE drl_tudanhgia
         SET trangthai = ?,
             diem_cvht = COALESCE(?, diem_cvht),
             nhan_xet_cvht = COALESCE(?, nhan_xet_cvht),
             nguoi_duyet_cvht = COALESCE(?, nguoi_duyet_cvht),
             ngay_duyet_cvht = CASE WHEN ? IS NOT NULL OR ? IS NOT NULL THEN NOW() ELSE ngay_duyet_cvht END,
             diem_khoa = COALESCE(?, diem_khoa),
             nhan_xet_khoa = COALESCE(?, nhan_xet_khoa),
             nguoi_duyet_khoa = COALESCE(?, nguoi_duyet_khoa),
             ngay_duyet_khoa = CASE WHEN ? IS NOT NULL OR ? IS NOT NULL THEN NOW() ELSE ngay_duyet_khoa END,
             diem_ctsv = COALESCE(?, diem_ctsv),
             nhan_xet_ctsv = COALESCE(?, nhan_xet_ctsv),
             nguoi_duyet_ctsv = COALESCE(?, nguoi_duyet_ctsv),
             ngay_duyet_ctsv = CASE WHEN ? IS NOT NULL OR ? IS NOT NULL THEN NOW() ELSE ngay_duyet_ctsv END
         WHERE id = ?`,
        [
          nextStatus,
          diem_cvht ?? null,
          nhan_xet_cvht || null,
          nguoi_duyet || null,
          diem_cvht ?? null,
          nhan_xet_cvht || null,
          diem_khoa ?? null,
          nhan_xet_khoa || null,
          nguoi_duyet || null,
          diem_khoa ?? null,
          nhan_xet_khoa || null,
          diem_ctsv ?? null,
          nhan_xet_ctsv || null,
          nguoi_duyet || null,
          diem_ctsv ?? null,
          nhan_xet_ctsv || null,
          id,
        ]
      );
    }

    const [rows] = await pool.execute('SELECT * FROM drl_tudanhgia WHERE id = ?', [id]);
    return rows[0] || null;
  }
}

export default SelfEvaluation;
