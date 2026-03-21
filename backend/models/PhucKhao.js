import pool from '../config/database.js';

class PhucKhao {
  static async create(data) {
    const { mamonhoc, mssv, lydo } = data;
    if (!mamonhoc) throw new Error('Thiếu mã môn học');
    if (!mssv)     throw new Error('Thiếu MSSV');
    if (!lydo?.trim()) throw new Error('Thiếu lý do phúc khảo');

    // Kiểm tra môn học tồn tại
    const [check] = await pool.execute(
      'SELECT mamonhoc FROM monhoc WHERE mamonhoc = ?',
      [mamonhoc]
    );
    if (check.length === 0) throw new Error('Môn học không tồn tại');

    const [result] = await pool.execute(
      `INSERT INTO phuckhao (mssv, mamonhoc, lydo) VALUES (?, ?, ?)`,
      [mssv, mamonhoc, lydo.trim()]
    );
    return this.getById(result.insertId);
  }

  static async getById(maphuckhao) {
    const [rows] = await pool.execute(
      `SELECT p.*, s.hoten, m.tenmonhoc
       FROM phuckhao p
       JOIN sinhvien s ON p.mssv = s.mssv
       LEFT JOIN monhoc m ON p.mamonhoc = m.mamonhoc
       WHERE p.maphuckhao = ?`,
      [maphuckhao]
    );
    return rows[0];
  }

  static async getByStudent(mssv) {
    const [rows] = await pool.execute(
      `SELECT p.*, m.tenmonhoc
       FROM phuckhao p
       LEFT JOIN monhoc m ON p.mamonhoc = m.mamonhoc
       WHERE p.mssv = ? ORDER BY p.ngaygui DESC`,
      [mssv]
    );
    return rows;
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT p.*, s.hoten, s.malop, m.tenmonhoc
       FROM phuckhao p
       JOIN sinhvien s ON p.mssv = s.mssv
       LEFT JOIN monhoc m ON p.mamonhoc = m.mamonhoc
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
    await pool.execute(
      `UPDATE phuckhao SET lydo=? WHERE maphuckhao=?`,
      [data.lydo ?? '', maphuckhao]
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
