import pool from '../config/database.js';

class KhenThuongKyLuat {
  static async create(data) {
    const { mssv, mahocky, loai, noidung, hinhthuc, soquyetdinh, ngayquyetdinh, nguoilap, ghichu, makhoa, muc, trangthai } = data;
    const [result] = await pool.execute(
      `INSERT INTO khenthuong_kyluat (mssv, mahocky, loai, noidung, hinhthuc, soquyetdinh, ngayquyetdinh, nguoilap, ghichu, makhoa, muc, trangthai)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mssv, mahocky, loai, noidung ?? '', hinhthuc ?? null, soquyetdinh ?? null,
        ngayquyetdinh ?? null, nguoilap ?? null, ghichu ?? null,
        makhoa ?? null, muc ?? null, trangthai ?? 'cho_duyet']
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

  static async getBySemester(mahocky, loai = null, trangthai = null) {
    let query = `
      SELECT k.*, s.hoten, s.malop, s.makhoa, h.tenhocky, h.namhoc
       FROM khenthuong_kyluat k
       JOIN sinhvien s ON k.mssv = s.mssv
       LEFT JOIN hocky h ON k.mahocky = h.mahocky
       WHERE 1=1
    `;
    const params = [];
    if (mahocky) { query += ' AND k.mahocky = ?'; params.push(mahocky); }
    if (loai)    { query += ' AND k.loai = ?';    params.push(loai); }
    if (trangthai) { query += ' AND k.trangthai = ?'; params.push(trangthai); }
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

  static async approve(id) {
    await pool.execute(
      `UPDATE khenthuong_kyluat SET trangthai = 'da_duyet' WHERE id = ?`, [id]
    );
    return this.getById(id);
  }

  static async reject(id, lydo = null) {
    await pool.execute(
      `UPDATE khenthuong_kyluat SET trangthai = 'tu_choi', ghichu = ? WHERE id = ?`, [lydo, id]
    );
    return this.getById(id);
  }

  static async khoaApprove(id) {
    await pool.execute(
      `UPDATE khenthuong_kyluat SET trangthai = 'khoa_duyet' WHERE id = ? AND trangthai = 'cho_duyet'`, [id]
    );
    return this.getById(id);
  }

  static async khoaReject(id, lydo = null) {
    await pool.execute(
      `UPDATE khenthuong_kyluat SET trangthai = 'khoa_tuchoi', ghichu = ? WHERE id = ? AND trangthai = 'cho_duyet'`, [lydo, id]
    );
    return this.getById(id);
  }
}

export default KhenThuongKyLuat;
