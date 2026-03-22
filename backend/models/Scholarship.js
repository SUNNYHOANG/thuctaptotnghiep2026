import pool from '../config/database.js';
import xlsx from 'xlsx';
import ThongBao from './ThongBao.js';

const MUC_ORDER = ['xuat_sac', 'gioi', 'kha', 'trung_binh', 'khong_du_dieu_kien'];

// Luồng: cho_khoa_duyet → khoa_da_duyet / khoa_tuchoi → duyet / tuchoi
class Scholarship {
  static classifyMucHocBong(gpa, drl) {
    if (gpa === null || gpa === undefined || drl === null || drl === undefined)
      return 'khong_du_dieu_kien';
    const g = Number(gpa), d = Number(drl);
    if (isNaN(g) || isNaN(d)) return 'khong_du_dieu_kien';
    if (g >= 3.6 && d >= 80) return 'xuat_sac';
    if (g >= 3.2 && d >= 80) return 'gioi';
    if (g >= 3.2 && d >= 65) return 'kha';
    if (g >= 2.5 && d >= 50) return 'trung_binh';
    return 'khong_du_dieu_kien';
  }

  static _mucLabel(muc) {
    const map = {
      xuat_sac: 'Xuất sắc', gioi: 'Giỏi', kha: 'Khá',
      trung_binh: 'Trung bình', khong_du_dieu_kien: 'Không đủ điều kiện',
    };
    return map[muc] || muc;
  }

  /**
   * Khoa chạy xét học bổng — tính GPA + DRL cho SV thuộc khoa, upsert với cho_khoa_duyet
   */
  static async evaluateSemester(mahocky, makhoa = null) {
    let gpaQuery = `
      SELECT b.mssv,
        ROUND(SUM(b.gpa * m.sotinchi) / SUM(m.sotinchi), 2) AS gpa_hocky
      FROM bangdiem b
      JOIN lophocphan l ON b.malophocphan = l.malophocphan
      JOIN monhoc m ON l.mamonhoc = m.mamonhoc
      JOIN sinhvien sv ON b.mssv = sv.mssv
      WHERE l.mahocky = ? AND b.trangthai = 'dakhoa' AND b.gpa IS NOT NULL`;
    const gpaParams = [mahocky];
    if (makhoa) {
      gpaQuery += ` AND sv.malop IN (SELECT malop FROM lophanhchinh WHERE makhoa = ?)`;
      gpaParams.push(makhoa);
    }
    gpaQuery += ' GROUP BY b.mssv';

    const [gpaRows] = await pool.execute(gpaQuery, gpaParams);
    if (!gpaRows.length) {
      return { mahocbong: null, total: 0, results: [], message: 'Không có sinh viên nào có điểm đã khóa thuộc khoa này' };
    }

    const mssvList = gpaRows.map(r => r.mssv);
    const placeholders = mssvList.map(() => '?').join(',');
    const [drlRows] = await pool.execute(
      `SELECT mssv, diemtong AS drl FROM diemrenluyen WHERE mahocky = ? AND mssv IN (${placeholders})`,
      [mahocky, ...mssvList]
    );
    const drlMap = {};
    drlRows.forEach(r => { drlMap[r.mssv] = r.drl; });

    let [hbRows] = await pool.execute(`SELECT mahocbong FROM hocbong WHERE mahocky = ? LIMIT 1`, [mahocky]);
    let mahocbong;
    if (hbRows.length) {
      mahocbong = hbRows[0].mahocbong;
    } else {
      const [hkRows] = await pool.execute('SELECT tenhocky, namhoc FROM hocky WHERE mahocky = ?', [mahocky]);
      const tenHK = hkRows.length ? `${hkRows[0].tenhocky} ${hkRows[0].namhoc}` : `HK ${mahocky}`;
      const [ins] = await pool.execute(
        `INSERT INTO hocbong (tenhocbong, mahocky, giatri, trangthai) VALUES (?, ?, 0, 'mo')`,
        [`Học bổng ${tenHK}`, mahocky]
      );
      mahocbong = ins.insertId;
    }

    const results = [];
    for (const { mssv, gpa_hocky } of gpaRows) {
      const drl = drlMap[mssv] ?? null;
      const muc = this.classifyMucHocBong(gpa_hocky, drl);
      await pool.execute(
        `INSERT INTO sinhvien_hocbong (mssv, mahocbong, mucxeploai, trangthai)
         VALUES (?, ?, ?, 'cho_khoa_duyet')
         ON DUPLICATE KEY UPDATE mucxeploai = VALUES(mucxeploai), trangthai = 'cho_khoa_duyet'`,
        [mssv, mahocbong, muc]
      );
      results.push({ mssv, gpa: gpa_hocky, drl, mucxeploai: muc });
    }

    // Sắp xếp GPA cao → thấp
    results.sort((a, b) => (b.gpa || 0) - (a.gpa || 0));
    return { mahocbong, total: results.length, results };
  }

  /**
   * Lấy kết quả — JOIN GPA và DRL, sắp xếp GPA cao→thấp trong từng mức
   * role='khoa': SV thuộc khoa, trạng thái cho_khoa_duyet + khoa_da_duyet + khoa_tuchoi
   * role='ctsv': SV đã qua khoa (khoa_da_duyet + duyet + tuchoi)
   */
  static async getResults(mahocky, role = 'ctsv', makhoa = null) {
    let whereExtra = '';
    const extraParams = [];

    if (role === 'khoa' && makhoa) {
      whereExtra = `AND sv.malop IN (SELECT malop FROM lophanhchinh WHERE makhoa = ?)
                    AND sh.trangthai IN ('cho_khoa_duyet','khoa_da_duyet','khoa_tuchoi')`;
      extraParams.push(makhoa);
    } else {
      // CTSV thấy tất cả đã qua khoa
      whereExtra = `AND sh.trangthai IN ('khoa_da_duyet','cho_ctsv_duyet','duyet','tuchoi')`;
    }

    const [rows] = await pool.execute(
      `SELECT sh.id, sh.mssv, sv.hoten, sv.malop, sh.mucxeploai, sh.trangthai,
              sh.ghichu, sh.nguoiduyet, sh.ngayduyet, sh.mahocbong, hb.tenhocbong,
              sh.nguoi_khoa_duyet, sh.ngay_khoa_duyet, sh.ghichu_khoa,
              gpa_sub.gpa_hocky AS gpa,
              drl_sub.diemtong AS drl
       FROM sinhvien_hocbong sh
       JOIN sinhvien sv ON sh.mssv = sv.mssv
       JOIN hocbong hb ON sh.mahocbong = hb.mahocbong
       LEFT JOIN (
         SELECT b.mssv,
           ROUND(SUM(b.gpa * m.sotinchi) / SUM(m.sotinchi), 2) AS gpa_hocky
         FROM bangdiem b
         JOIN lophocphan l ON b.malophocphan = l.malophocphan
         JOIN monhoc m ON l.mamonhoc = m.mamonhoc
         WHERE l.mahocky = ? AND b.trangthai = 'dakhoa' AND b.gpa IS NOT NULL
         GROUP BY b.mssv
       ) gpa_sub ON sh.mssv = gpa_sub.mssv
       LEFT JOIN diemrenluyen drl_sub ON sh.mssv = drl_sub.mssv AND drl_sub.mahocky = ?
       WHERE hb.mahocky = ? ${whereExtra}
       ORDER BY FIELD(sh.mucxeploai,'xuat_sac','gioi','kha','trung_binh','khong_du_dieu_kien'),
                COALESCE(gpa_sub.gpa_hocky, 0) DESC, sv.hoten`,
      [mahocky, mahocky, mahocky, ...extraParams]
    );

    const grouped = {};
    MUC_ORDER.forEach(m => { grouped[m] = []; });
    rows.forEach(r => {
      const key = r.mucxeploai || 'khong_du_dieu_kien';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    return { total: rows.length, grouped, list: rows };
  }

  /**
   * Khoa duyệt hoặc từ chối (bước 1)
   */
  static async khoaApprove(id, nguoiduyet, trangthai, ghichu, makhoa) {
    if (!['khoa_da_duyet', 'khoa_tuchoi'].includes(trangthai)) {
      throw Object.assign(new Error('Trạng thái không hợp lệ'), { status: 400 });
    }
    if (trangthai === 'khoa_tuchoi' && !ghichu) {
      throw Object.assign(new Error('Vui lòng nhập lý do từ chối'), { status: 400 });
    }

    // Kiểm tra SV thuộc khoa và đang chờ khoa duyệt
    const [rows] = await pool.execute(
      `SELECT sh.id FROM sinhvien_hocbong sh
       JOIN sinhvien sv ON sh.mssv = sv.mssv
       JOIN lophanhchinh l ON sv.malop = l.malop
       WHERE sh.id = ? AND l.makhoa = ? AND sh.trangthai = 'cho_khoa_duyet'`,
      [id, makhoa]
    );
    if (!rows.length) {
      throw Object.assign(new Error('Không tìm thấy hoặc không có quyền duyệt'), { status: 403 });
    }

    await pool.execute(
      `UPDATE sinhvien_hocbong
       SET trangthai = ?, nguoi_khoa_duyet = ?, ngay_khoa_duyet = NOW(), ghichu_khoa = ?
       WHERE id = ?`,
      [trangthai, nguoiduyet, ghichu ?? null, id]
    );

    const [updated] = await pool.execute('SELECT * FROM sinhvien_hocbong WHERE id = ?', [id]);
    return updated[0];
  }

  /**
   * CTSV duyệt hoặc từ chối cuối (bước 2) — gửi thông báo nếu duyệt
   */
  static async approve(id, nguoiduyet, trangthai, ghichu) {
    if (!['duyet', 'tuchoi'].includes(trangthai)) {
      throw Object.assign(new Error('Trạng thái không hợp lệ'), { status: 400 });
    }
    if (trangthai === 'tuchoi' && !ghichu) {
      throw Object.assign(new Error('Vui lòng nhập lý do từ chối'), { status: 400 });
    }

    const [check] = await pool.execute(
      `SELECT sh.id, sh.mssv, sh.mucxeploai, sh.mahocbong, hb.tenhocbong, hb.mahocky
       FROM sinhvien_hocbong sh
       JOIN hocbong hb ON sh.mahocbong = hb.mahocbong
       WHERE sh.id = ? AND sh.trangthai IN ('khoa_da_duyet','cho_ctsv_duyet','cho_khoa_duyet')`,
      [id]
    );
    if (!check.length) {
      throw Object.assign(new Error('Học bổng chưa được xét hoặc đã xử lý'), { status: 400 });
    }

    await pool.execute(
      `UPDATE sinhvien_hocbong SET trangthai = ?, nguoiduyet = ?, ngayduyet = NOW(), ghichu = ? WHERE id = ?`,
      [trangthai, nguoiduyet, ghichu ?? null, id]
    );

    // Gửi thông báo cho SV nếu được duyệt
    if (trangthai === 'duyet') {
      const { mssv, mucxeploai, tenhocbong } = check[0];
      try {
        await ThongBao.create({
          tieude: `🎓 Bạn được nhận học bổng ${this._mucLabel(mucxeploai)}`,
          noidung: `Chúc mừng! Bạn đã được CTSV duyệt học bổng loại ${this._mucLabel(mucxeploai)} cho ${tenhocbong}. Vui lòng liên hệ phòng CTSV để nhận học bổng.`,
          loai: 'nhacnho',
          nguoitao: nguoiduyet,
          nguoi_nhan: [mssv],
        });
      } catch (e) {
        console.error('Gửi thông báo học bổng thất bại:', e.message);
      }
    }

    const [rows] = await pool.execute('SELECT * FROM sinhvien_hocbong WHERE id = ?', [id]);
    return rows[0];
  }

  /**
   * Sinh viên xem kết quả học bổng của mình
   */
  static async getByStudent(mssv, mahocky = null) {
    let query = `
      SELECT sh.*, hb.tenhocbong, hb.giatri, hk.tenhocky, hk.namhoc
      FROM sinhvien_hocbong sh
      JOIN hocbong hb ON sh.mahocbong = hb.mahocbong
      JOIN hocky hk ON hb.mahocky = hk.mahocky
      WHERE sh.mssv = ?`;
    const params = [mssv];
    if (mahocky) { query += ' AND hb.mahocky = ?'; params.push(mahocky); }
    query += ' ORDER BY hk.namhoc DESC, hk.tenhocky';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  /**
   * Xuất Excel — chỉ SV được CTSV duyệt
   */
  static async exportExcel(mahocky) {
    const { list } = await this.getResults(mahocky, 'ctsv');
    const data = list.map(r => ({
      'MSSV': r.mssv,
      'Họ tên': r.hoten,
      'Lớp': r.malop,
      'GPA': r.gpa ?? '',
      'DRL': r.drl ?? '',
      'Mức học bổng': this._mucLabel(r.mucxeploai),
      'Trạng thái': r.trangthai === 'duyet' ? 'Đã duyệt' : r.trangthai === 'tuchoi' ? 'Từ chối' : 'Chờ duyệt',
      'Lý do từ chối': r.ghichu || '',
      'Người duyệt': r.nguoiduyet || '',
      'Ngày duyệt': r.ngayduyet ? new Date(r.ngayduyet).toLocaleDateString('vi-VN') : '',
    }));
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Học bổng');
    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}

export default Scholarship;
