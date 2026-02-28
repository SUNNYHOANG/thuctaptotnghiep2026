import pool from '../config/database.js';

const HESO = { chuyencan: 0.1, giuaky: 0.3, cuoiky: 0.6 };

class Grade {
  static _tinhDiemTongKet(diemchuyencan, diemgiuaky, diemcuoiky) {
    const cc = Number(diemchuyencan ?? 0);
    const gk = Number(diemgiuaky ?? 0);
    const ck = Number(diemcuoiky ?? 0);
    return cc * HESO.chuyencan + gk * HESO.giuaky + ck * HESO.cuoiky;
  }

  static _tinhXepLoai(diem) {
    if (!diem || diem < 0) return 'Chưa xếp loại';
    if (diem >= 9) return 'Xuất sắc';
    if (diem >= 8) return 'Giỏi';
    if (diem >= 7) return 'Khá';
    if (diem >= 5) return 'Trung bình';
    return 'Yếu';
  }

  static _tinhCanhBao(diem) {
    if (!diem || diem < 0) return null;
    if (diem < 4) return 'Cảnh báo học vụ';
    if (diem < 5) return 'Nguy cơ học vụ';
    return null;
  }

  static async getByClassSection(malophoc) {
    const [rows] = await pool.execute(
      `SELECT b.*, s.hoten, s.malop, m.tenmonhoc, m.sotinchi
       FROM bangdiem b
       JOIN sinhvien s ON b.mssv = s.mssv
       JOIN lophoc l ON b.malophoc = l.malophoc
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE b.malophoc = ?
       ORDER BY s.mssv`,
      [malophoc]
    );
    return rows;
  }

  static async getByStudent(mssv, mahocky = null) {
    let query = `
       SELECT b.*, m.tenmonhoc, m.sotinchi, l.mahocky, h.tenhocky, h.namhoc
       FROM bangdiem b
       JOIN lophoc l ON b.malophoc = l.malophoc
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       LEFT JOIN hocky h ON l.mahocky = h.mahocky
       WHERE b.mssv = ?
    `;
    const params = [mssv];
    if (mahocky) {
      query += ' AND l.mahocky = ?';
      params.push(mahocky);
    }
    query += ' ORDER BY h.namhoc DESC, h.tenhocky, m.tenmonhoc';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getById(mabangdiem) {
    const [rows] = await pool.execute(
      `SELECT b.*, s.hoten, s.malop, m.tenmonhoc, m.sotinchi, l.mahocky
       FROM bangdiem b
       JOIN sinhvien s ON b.mssv = s.mssv
       JOIN lophoc l ON b.malophoc = l.malophoc
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE b.mabangdiem = ?`,
      [mabangdiem]
    );
    return rows[0];
  }

  static async createOrUpdate(data) {
    const { malophoc, mssv, diemchuyencan, diemgiuaky, diemcuoiky, nguoinhap } = data;
    const diemtongket = this._tinhDiemTongKet(diemchuyencan, diemgiuaky, diemcuoiky);
    const canhbao = this._tinhCanhBao(diemtongket);

    const [existing] = await pool.execute(
      'SELECT mabangdiem, trangthai FROM bangdiem WHERE malophoc = ? AND mssv = ?',
      [malophoc, mssv]
    );

    if (existing.length > 0) {
      if (existing[0].trangthai === 'dakhoa') {
        throw new Error('Bảng điểm đã khóa, không thể sửa');
      }
      await pool.execute(
        `UPDATE bangdiem SET diemchuyencan=?, diemgiuaky=?, diemcuoiky=?, 
         diemtongket=?, gpa=?, canhbao=?, nguoinhap=?
         WHERE mabangdiem = ?`,
        [diemchuyencan ?? null, diemgiuaky ?? null, diemcuoiky ?? null,
          diemtongket, diemtongket, canhbao, nguoinhap ?? null, existing[0].mabangdiem]
      );
      return this.getById(existing[0].mabangdiem);
    }

    const [result] = await pool.execute(
      `INSERT INTO bangdiem (malophoc, mssv, diemchuyencan, diemgiuaky, diemcuoiky, diemtongket, gpa, canhbao, nguoinhap)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [malophoc, mssv, diemchuyencan ?? null, diemgiuaky ?? null, diemcuoiky ?? null,
        diemtongket, diemtongket, canhbao, nguoinhap ?? null]
    );
    return this.getById(result.insertId);
  }

  static async updateGrade(mabangdiem, data, nguoisua) {
    const b = await this.getById(mabangdiem);
    if (!b) throw new Error('Không tìm thấy bảng điểm');
    if (b.trangthai === 'dakhoa') throw new Error('Bảng điểm đã khóa');

    const cc = data.diemchuyencan !== undefined ? data.diemchuyencan : b.diemchuyencan;
    const gk = data.diemgiuaky !== undefined ? data.diemgiuaky : b.diemgiuaky;
    const ck = data.diemcuoiky !== undefined ? data.diemcuoiky : b.diemcuoiky;
    const diemtongket = this._tinhDiemTongKet(cc, gk, ck);
    const canhbao = this._tinhCanhBao(diemtongket);

    const logFields = [
      { field: 'diemchuyencan', old: b.diemchuyencan, new: cc },
      { field: 'diemgiuaky', old: b.diemgiuaky, new: gk },
      { field: 'diemcuoiky', old: b.diemcuoiky, new: ck }
    ];
    for (const { field, old, new: n } of logFields) {
      if (old != n) {
        await pool.execute(
          'INSERT INTO log_suadiem (mabangdiem, loaidiem, giatricu, giatrimoi, nguoisua) VALUES (?, ?, ?, ?, ?)',
          [mabangdiem, field, old, n, nguoisua ?? 'system']
        );
      }
    }

    await pool.execute(
      `UPDATE bangdiem SET diemchuyencan=?, diemgiuaky=?, diemcuoiky=?, diemtongket=?, gpa=?, canhbao=?
       WHERE mabangdiem = ?`,
      [cc ?? null, gk ?? null, ck ?? null, diemtongket, diemtongket, canhbao, mabangdiem]
    );
    return this.getById(mabangdiem);
  }

  static async lock(malophoc, nguoikhoa) {
    await pool.execute(
      `UPDATE bangdiem SET trangthai='dakhoa', ngaykhoa=NOW() WHERE malophoc = ?`,
      [malophoc]
    );
    return { message: 'Đã khóa điểm lớp học phần' };
  }

  static async getLog(mabangdiem) {
    const [rows] = await pool.execute(
      'SELECT * FROM log_suadiem WHERE mabangdiem = ? ORDER BY ngaysua DESC',
      [mabangdiem]
    );
    return rows;
  }

  static async initFromEnrollment(malophoc, nguoinhap) {
    const [enrollments] = await pool.execute(
      `SELECT mssv FROM dangkyhocphan WHERE malophoc = ? AND trangthai = 'dangky'`,
      [malophoc]
    );
    let count = 0;
    for (const e of enrollments) {
      await this.createOrUpdate({ malophoc, mssv: e.mssv, nguoinhap });
      count++;
    }
    return { message: `Đã tạo ${count} bảng điểm` };
  }
}

export default Grade;
