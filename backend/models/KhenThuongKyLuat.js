import pool from '../config/database.js';

class KhenThuongKyLuat {
  static async create(data) {
    const { mssv, mahocky, loai, noidung, hinhthuc, soquyetdinh, ngayquyetdinh, nguoilap, ghichu } = data;
    const [result] = await pool.execute(
      `INSERT INTO khenthuong_kyluat (mssv, mahocky, loai, noidung, hinhthuc, soquyetdinh, ngayquyetdinh, nguoilap, ghichu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mssv, mahocky, loai, noidung ?? '', hinhthuc ?? null, soquyetdinh ?? null,
        ngayquyetdinh ?? null, nguoilap ?? null, ghichu ?? null]
    );
    return this.getById(result.insertId);
  }

  static async getById(id) {
    const [rows] = await pool.execute(
      `SELECT k.*, s.hoten, s.malop, h.tenhocky, h.namhoc
       FROM khenthuong_kyluat k
       JOIN sinhvien s ON k.mssv = s.mssv
       LEFT JOIN hocky h ON k.mahocky = h.mahocky
       WHERE k.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async getByStudent(mssv, mahocky = null) {
    let query = `
      SELECT k.*, h.tenhocky, h.namhoc
       FROM khenthuong_kyluat k
       JOIN hocky h ON k.mahocky = h.mahocky
       WHERE k.mssv = ?
    `;
    const params = [mssv];
    if (mahocky) {
      query += ' AND k.mahocky = ?';
      params.push(mahocky);
    }
    query += ' ORDER BY k.ngayquyetdinh DESC, k.created_at DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getBySemester(mahocky, loai = null) {
    let query = `
      SELECT k.*, s.hoten, s.malop, h.tenhocky, h.namhoc
       FROM khenthuong_kyluat k
       JOIN sinhvien s ON k.mssv = s.mssv
       LEFT JOIN hocky h ON k.mahocky = h.mahocky
       WHERE 1=1
    `;
    const params = [];
    if (mahocky) {
      query += ' AND k.mahocky = ?';
      params.push(mahocky);
    }
    if (loai) {
      query += ' AND k.loai = ?';
      params.push(loai);
    }
    query += ' ORDER BY k.loai, k.ngayquyetdinh DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async update(id, data) {
    const { mssv, mahocky, loai, noidung, hinhthuc, soquyetdinh, ngayquyetdinh, ghichu } = data;
    const [result] = await pool.execute(
      `UPDATE khenthuong_kyluat 
       SET mssv = ?, mahocky = ?, loai = ?, noidung = ?, hinhthuc = ?, soquyetdinh = ?, ngayquyetdinh = ?, ghichu = ?
       WHERE id = ?`,
      [mssv, mahocky, loai, noidung ?? '', hinhthuc ?? null, soquyetdinh ?? null, ngayquyetdinh ?? null, ghichu ?? null, id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      `DELETE FROM khenthuong_kyluat WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

export default KhenThuongKyLuat;
