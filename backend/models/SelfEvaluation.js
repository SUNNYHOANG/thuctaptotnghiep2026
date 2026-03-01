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

  static async getPendingByClassAndSemester(malop, mahocky) {
    if (!mahocky) return [];
    let query = `SELECT t.*, s.hoten, s.malop
       FROM drl_tudanhgia t
       JOIN sinhvien s ON t.mssv = s.mssv
       WHERE t.mahocky = ?`;
    const params = [mahocky];
    if (malop != null && String(malop).trim() !== '') {
      query += ' AND s.malop = ?';
      params.push(String(malop).trim());
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
      diem_ctsv,
      nhan_xet_ctsv,
      nguoi_duyet,
    }
  ) {
    // Backward-compatible status set (schema.sql): 'choduyet','daduyet','bituchoi'
    const allowed = ['choduyet', 'daduyet', 'bituchoi'];
    let nextStatus = trangthai;
    if (!allowed.includes(nextStatus)) {
      // default approve: GV -> daduyet, CTSV -> daduyet, Admin -> daduyet
      nextStatus = 'daduyet';
    }

    if (role === 'giangvien') {
      await pool.execute(
        `UPDATE drl_tudanhgia
         SET trangthai = ?,
             diem_cvht = ?, nhan_xet_cvht = ?, nguoi_duyet_cvht = ?, ngay_duyet_cvht = NOW()
         WHERE id = ?`,
        [
          nextStatus,
          diem_cvht ?? null,
          nhan_xet_cvht || null,
          nguoi_duyet || null,
          id,
        ]
      );
    } else if (role === 'ctsv') {
      // CTSV duyệt cuối: trangthai thường là 'daduyet'; dấu hiệu "đã duyệt cuối" nằm ở nguoi_duyet_ctsv/ngay_duyet_ctsv
      try {
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
      } catch (err) {
        // Schema đã có cột CTSV (nguoi_duyet_ctsv), không fallback nữa
        throw err;
      }
    } else {
      // Admin: cập nhật cả 2 bước duyệt (CVHT + CTSV)
      await pool.execute(
        `UPDATE drl_tudanhgia
         SET trangthai = ?,
             diem_cvht = COALESCE(?, diem_cvht),
             nhan_xet_cvht = COALESCE(?, nhan_xet_cvht),
             nguoi_duyet_cvht = COALESCE(?, nguoi_duyet_cvht),
             ngay_duyet_cvht = CASE WHEN ? IS NOT NULL OR ? IS NOT NULL THEN NOW() ELSE ngay_duyet_cvht END,
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

