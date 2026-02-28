import pool from '../config/database.js';

class PhucKhao {
  static async create(data) {
    const { mabangdiem, mssv, malophoc, lydo } = data;
    const [result] = await pool.execute(
      `INSERT INTO phuckhao (mabangdiem, mssv, malophoc, lydo) VALUES (?, ?, ?, ?)`,
      [mabangdiem, mssv, malophoc, lydo ?? '']
    );
    return this.getById(result.insertId);
  }

  static async getById(maphuckhao) {
    const [rows] = await pool.execute(
      `SELECT p.*, s.hoten, m.tenmonhoc, b.diemtongket
       FROM phuckhao p
       JOIN sinhvien s ON p.mssv = s.mssv
       JOIN lophoc l ON p.malophoc = l.malophoc
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       JOIN bangdiem b ON p.mabangdiem = b.mabangdiem
       WHERE p.maphuckhao = ?`,
      [maphuckhao]
    );
    return rows[0];
  }

  static async getByClassSection(malophoc) {
    const [rows] = await pool.execute(
      `SELECT p.*, s.hoten, s.malop
       FROM phuckhao p
       JOIN sinhvien s ON p.mssv = s.mssv
       WHERE p.malophoc = ? ORDER BY p.ngaygui DESC`,
      [malophoc]
    );
    return rows;
  }

  static async getByStudent(mssv) {
    const [rows] = await pool.execute(
      `SELECT p.*, m.tenmonhoc, l.malophoc
       FROM phuckhao p
       JOIN lophoc l ON p.malophoc = l.malophoc
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE p.mssv = ? ORDER BY p.ngaygui DESC`,
      [mssv]
    );
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
