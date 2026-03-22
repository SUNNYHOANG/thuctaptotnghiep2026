import pool from '../config/database.js';
import xlsx from 'xlsx';

const HESO = { chuyencan: 0.1, giuaky: 0.3, cuoiky: 0.6 };

class Grade {
  // Validate điểm trong [0,10]
  static _validateDiem(value, fieldName) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (isNaN(n)) throw new Error(`Điểm ${fieldName} không hợp lệ`);
    if (n < 0 || n > 10) throw new Error(`Điểm ${fieldName} phải nằm trong khoảng [0, 10]`);
    return n;
  }

  // Tính điểm tổng kết theo công thức trọng số
  static _tinhDiemTongKet(diemchuyencan, diemgiuaky, diemcuoiky) {
    const cc = Number(diemchuyencan ?? 0);
    const gk = Number(diemgiuaky ?? 0);
    const ck = Number(diemcuoiky ?? 0);
    return Math.round((cc * HESO.chuyencan + gk * HESO.giuaky + ck * HESO.cuoiky) * 100) / 100;
  }

  // Tính GPA theo thang 4: gpa = round((diemtongket / 10) * 4, 2)
  static _tinhGPA(diemtongket) {
    if (diemtongket === null || diemtongket === undefined) return null;
    const d = Number(diemtongket);
    if (isNaN(d) || d < 0 || d > 10) return null;
    return Math.round((d / 10) * 4 * 100) / 100;
  }

  static _tinhXepLoai(diem) {
    if (diem === null || diem === undefined || diem < 0) return 'Chưa xếp loại';
    if (diem >= 9) return 'Xuất sắc';
    if (diem >= 8) return 'Giỏi';
    if (diem >= 7) return 'Khá';
    if (diem >= 5) return 'Trung bình';
    return 'Yếu';
  }

  static _tinhCanhBao(diem) {
    if (diem === null || diem === undefined || diem < 0) return null;
    if (diem < 4) return 'Cảnh báo học vụ';
    if (diem < 5) return 'Nguy cơ học vụ';
    return null;
  }

  // Lấy điểm theo lớp học phần (không kiểm tra quyền)
  static async getByClassSection(malophocphan) {
    const [rows] = await pool.execute(
      `SELECT b.*, s.hoten, s.malop, m.tenmonhoc, m.sotinchi
       FROM bangdiem b
       JOIN sinhvien s ON b.mssv = s.mssv
       JOIN lophocphan l ON b.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE b.malophocphan = ?
       ORDER BY s.mssv`,
      [malophocphan]
    );
    return rows;
  }

  // Lấy điểm theo lớp học phần với kiểm tra quyền
  static async getByClassSectionWithAuth(malophocphan, userId, role) {
    if (role === 'giangvien') {
      const [lhp] = await pool.execute(
        'SELECT magiaovien FROM lophocphan WHERE malophocphan = ?',
        [malophocphan]
      );
      if (!lhp.length) throw Object.assign(new Error('Lớp học phần không tồn tại'), { status: 404 });
      if (String(lhp[0].magiaovien) !== String(userId)) {
        throw Object.assign(new Error('Bạn không có quyền nhập điểm cho lớp học phần này'), { status: 403 });
      }
    }
    return this.getByClassSection(malophocphan);
  }

  static async getByStudent(mssv, mahocky = null, onlyLocked = false) {
    let query = `
       SELECT b.*, m.tenmonhoc, m.sotinchi, l.mahocky, h.tenhocky, h.namhoc
       FROM bangdiem b
       JOIN lophocphan l ON b.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       LEFT JOIN hocky h ON l.mahocky = h.mahocky
       WHERE b.mssv = ?
    `;
    const params = [mssv];
    if (mahocky) {
      query += ' AND l.mahocky = ?';
      params.push(mahocky);
    }
    if (onlyLocked) {
      query += " AND b.trangthai = 'dakhoa'";
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
       JOIN lophocphan l ON b.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE b.mabangdiem = ?`,
      [mabangdiem]
    );
    return rows[0];
  }

  static async createOrUpdate(data) {
    const { malophocphan, mssv, nguoinhap } = data;

    const cc = this._validateDiem(data.diemchuyencan, 'chuyên cần');
    const gk = this._validateDiem(data.diemgiuaky, 'giữa kỳ');
    const ck = this._validateDiem(data.diemcuoiky, 'cuối kỳ');

    const diemtongket = this._tinhDiemTongKet(cc ?? 0, gk ?? 0, ck ?? 0);
    const gpa = this._tinhGPA(diemtongket);
    const canhbao = this._tinhCanhBao(diemtongket);

    const [existing] = await pool.execute(
      'SELECT mabangdiem, trangthai FROM bangdiem WHERE malophocphan = ? AND mssv = ?',
      [malophocphan, mssv]
    );

    if (existing.length > 0) {
      if (existing[0].trangthai === 'dakhoa') {
        throw new Error('Bảng điểm đã khóa, không thể sửa');
      }
      await pool.execute(
        `UPDATE bangdiem SET diemchuyencan=?, diemgiuaky=?, diemcuoiky=?, 
         diemtongket=?, gpa=?, canhbao=?, nguoinhap=?
         WHERE mabangdiem = ?`,
        [cc, gk, ck, diemtongket, gpa, canhbao, nguoinhap ?? null, existing[0].mabangdiem]
      );
      return this.getById(existing[0].mabangdiem);
    }

    const [result] = await pool.execute(
      `INSERT INTO bangdiem (malophocphan, mssv, diemchuyencan, diemgiuaky, diemcuoiky, diemtongket, gpa, canhbao, nguoinhap)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [malophocphan, mssv, cc, gk, ck, diemtongket, gpa, canhbao, nguoinhap ?? null]
    );
    return this.getById(result.insertId);
  }

  static async updateGrade(mabangdiem, data, nguoisua) {
    const b = await this.getById(mabangdiem);
    if (!b) throw new Error('Không tìm thấy bảng điểm');
    if (b.trangthai === 'dakhoa') throw new Error('Bảng điểm đã khóa, không thể sửa');

    const cc = data.diemchuyencan !== undefined
      ? this._validateDiem(data.diemchuyencan, 'chuyên cần')
      : b.diemchuyencan;
    const gk = data.diemgiuaky !== undefined
      ? this._validateDiem(data.diemgiuaky, 'giữa kỳ')
      : b.diemgiuaky;
    const ck = data.diemcuoiky !== undefined
      ? this._validateDiem(data.diemcuoiky, 'cuối kỳ')
      : b.diemcuoiky;

    const diemtongket = this._tinhDiemTongKet(cc ?? 0, gk ?? 0, ck ?? 0);
    const gpa = this._tinhGPA(diemtongket);
    const canhbao = this._tinhCanhBao(diemtongket);

    // Ghi log cho từng trường thay đổi
    const logFields = [
      { field: 'diemchuyencan', old: b.diemchuyencan, new: cc },
      { field: 'diemgiuaky', old: b.diemgiuaky, new: gk },
      { field: 'diemcuoiky', old: b.diemcuoiky, new: ck },
    ];
    for (const { field, old, new: n } of logFields) {
      if (String(old) !== String(n)) {
        await pool.execute(
          'INSERT INTO log_suadiem (mabangdiem, loaidiem, giatricu, giatrimoi, nguoisua) VALUES (?, ?, ?, ?, ?)',
          [mabangdiem, field, old ?? null, n ?? null, nguoisua ?? 'system']
        );
      }
    }

    await pool.execute(
      `UPDATE bangdiem SET diemchuyencan=?, diemgiuaky=?, diemcuoiky=?, diemtongket=?, gpa=?, canhbao=?
       WHERE mabangdiem = ?`,
      [cc, gk, ck, diemtongket, gpa, canhbao, mabangdiem]
    );
    return this.getById(mabangdiem);
  }

  static async lock(malophocphan) {
    await pool.execute(
      `UPDATE bangdiem SET trangthai='dakhoa', ngaykhoa=NOW() WHERE malophocphan = ?`,
      [malophocphan]
    );
    return { message: 'Đã khóa bảng điểm lớp học phần' };
  }

  static async unlock(malophocphan) {
    await pool.execute(
      `UPDATE bangdiem SET trangthai='dangnhap', ngaykhoa=NULL WHERE malophocphan = ?`,
      [malophocphan]
    );
    return { message: 'Đã mở khóa bảng điểm lớp học phần' };
  }

  static async getLog(mabangdiem) {
    const [rows] = await pool.execute(
      'SELECT * FROM log_suadiem WHERE mabangdiem = ? ORDER BY ngaysua DESC',
      [mabangdiem]
    );
    return rows;
  }

  // Lấy điểm theo khoa (read-only cho role khoa)
  static async getByKhoa(makhoa, mahocky = null, malophocphan = null) {
    let query = `
      SELECT b.*, s.hoten, s.malop, m.tenmonhoc, m.sotinchi,
             lhp.malophocphan, h.tenhocky, h.namhoc,
             gv.hoten AS tengiaovien
      FROM bangdiem b
      JOIN sinhvien s ON b.mssv = s.mssv
      JOIN lophocphan lhp ON b.malophocphan = lhp.malophocphan
      JOIN monhoc m ON lhp.mamonhoc = m.mamonhoc
      LEFT JOIN hocky h ON lhp.mahocky = h.mahocky
      LEFT JOIN giangvien gv ON lhp.magiaovien = gv.magiaovien
      WHERE m.makhoa = ?
    `;
    const params = [makhoa];
    if (mahocky) { query += ' AND lhp.mahocky = ?'; params.push(mahocky); }
    if (malophocphan) { query += ' AND b.malophocphan = ?'; params.push(malophocphan); }
    query += ' ORDER BY s.mssv, m.tenmonhoc';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Import điểm hàng loạt từ dữ liệu Excel đã parse
  static async importFromExcel(rows, userId, role) {
    const errors = [];
    let success = 0;
    const total = rows.length;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (header = 1)
      const { mssv, malophocphan, diemchuyencan, diemgiuaky, diemcuoiky } = row;

      try {
        if (!mssv) throw new Error('Thiếu MSSV');
        if (!malophocphan) throw new Error('Thiếu mã lớp học phần');

        // Kiểm tra MSSV tồn tại
        const [sv] = await pool.execute('SELECT mssv FROM sinhvien WHERE mssv = ?', [mssv]);
        if (!sv.length) throw new Error('MSSV không tồn tại trong hệ thống');

        // Kiểm tra lớp học phần tồn tại
        const [lhp] = await pool.execute(
          'SELECT malophocphan, magiaovien FROM lophocphan WHERE malophocphan = ?',
          [malophocphan]
        );
        if (!lhp.length) throw new Error('Mã lớp học phần không tồn tại');

        // Kiểm tra quyền giảng viên
        if (role === 'giangvien' && String(lhp[0].magiaovien) !== String(userId)) {
          throw new Error('Bạn không có quyền nhập điểm cho lớp học phần này');
        }

        // Validate điểm
        this._validateDiem(diemchuyencan, 'chuyên cần');
        this._validateDiem(diemgiuaky, 'giữa kỳ');
        this._validateDiem(diemcuoiky, 'cuối kỳ');

        await this.createOrUpdate({ mssv, malophocphan, diemchuyencan, diemgiuaky, diemcuoiky, nguoinhap: userId });
        success++;
      } catch (err) {
        errors.push({ row: rowNum, mssv: mssv || '', message: err.message });
      }
    }

    return { total, success, errors };
  }
}

export default Grade;
