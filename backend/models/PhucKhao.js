import pool from '../config/database.js';

class PhucKhao {
  static async create(data) {
    const { mabangdiem, mssv, malophocphan, lydo } = data;
    const [result] = await pool.execute(
      `INSERT INTO phuckhao (mabangdiem, mssv, malophocphan, lydo) VALUES (?, ?, ?, ?)`,
      [mabangdiem, mssv, malophocphan, lydo ?? '']
    );
    return this.getById(result.insertId);
  }

  static async getById(maphuckhao) {
    const [rows] = await pool.execute(
      `SELECT p.*, s.hoten, m.tenmonhoc, b.diemtongket
       FROM phuckhao p
       JOIN sinhvien s ON p.mssv = s.mssv
       JOIN lophocphan l ON p.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       JOIN bangdiem b ON p.mabangdiem = b.mabangdiem
       WHERE p.maphuckhao = ?`,
      [maphuckhao]
    );
    return rows[0];
  }

  static async getByClassSection(malophocphan) {
    const [rows] = await pool.execute(
      `SELECT p.*, s.hoten, s.malop
       FROM phuckhao p
       JOIN sinhvien s ON p.mssv = s.mssv
       WHERE p.malophocphan = ? ORDER BY p.ngaygui DESC`,
      [malophocphan]
    );
    return rows;
  }

  static async getByStudent(mssv) {
    const [rows] = await pool.execute(
      `SELECT p.*, m.tenmonhoc, l.malophocphan
       FROM phuckhao p
       JOIN lophocphan l ON p.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE p.mssv = ? ORDER BY p.ngaygui DESC`,
      [mssv]
    );
    return rows;
  }

  /** Danh sách tất cả đơn phúc khảo (cho CTSV/Admin), có thể lọc theo trangthai */
  static async getAll(filters = {}) {
    let query = `
      SELECT p.*, s.hoten, s.malop, m.tenmonhoc
       FROM phuckhao p
       JOIN sinhvien s ON p.mssv = s.mssv
       JOIN lophocphan l ON p.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE 1=1
    `;
    const params = [];
    if (filters.trangthai) {
      query += ' AND p.trangthai = ?';
      params.push(filters.trangthai);
    }
    query += ' ORDER BY p.ngaygui DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async updateStatus(maphuckhao, trangthai, ketqua, nguoiduyet) {
    await pool.execute(
      `UPDATE phuckhao SET trangthai=?, ketqua=?, nguoiduyet=?, ngayduyet=NOW() WHERE maphuckhao=?`,
      [trangthai ?? 'dangxuly', ketqua ?? null, nguoiduyet ?? null, maphuckhao]
    );
    return this.getById(maphuckhao);
  }

  static async update(maphuckhao, data) {
    const { lydo } = data;
    await pool.execute(
      `UPDATE phuckhao SET lydo=? WHERE maphuckhao=?`,
      [lydo ?? '', maphuckhao]
    );
    return this.getById(maphuckhao);
  }

  static async delete(maphuckhao) {
    const [result] = await pool.execute(
      `DELETE FROM phuckhao WHERE maphuckhao = ?`,
      [maphuckhao]
    );
    return result.affectedRows > 0;
  }
}

export default PhucKhao;
