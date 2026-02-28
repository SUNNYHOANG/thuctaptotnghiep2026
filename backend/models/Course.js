import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class Course {
  // Generate random course code
  static generateRandomCode() {
    return 'MH' + uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase();
  }
  static async getAll(filters = {}) {
    let query = 'SELECT * FROM monhoc WHERE 1=1';
    const params = [];

    if (filters.makhoa) {
      query += ' AND makhoa = ?';
      params.push(filters.makhoa);
    }

    query += ' ORDER BY tenmonhoc';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getById(mamonhoc) {
    const [rows] = await pool.execute(
      'SELECT * FROM monhoc WHERE mamonhoc = ?',
      [mamonhoc]
    );
    return rows[0];
  }

  static async create(data) {
    const mamonhoc = data.mamonhoc || this.generateRandomCode();
    const tenmonhoc = data.tenmonhoc == null ? '' : data.tenmonhoc;
    const sotinchi = data.sotinchi == null ? 3 : data.sotinchi;
    const makhoa = data.makhoa == null ? null : data.makhoa;
    const mota = data.mota == null ? null : data.mota;
    const hocphi = data.hocphi == null ? 0 : data.hocphi;
    const [result] = await pool.execute(
      `INSERT INTO monhoc (mamonhoc, tenmonhoc, sotinchi, makhoa, mota, hocphi)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [mamonhoc, tenmonhoc, sotinchi, makhoa, mota, hocphi]
    );
    return this.getById(mamonhoc);
  }

  static async update(mamonhoc, data) {
    const allowed = ['tenmonhoc', 'sotinchi', 'makhoa', 'mota', 'hocphi'];
    const fields = [];
    const values = [];

    allowed.forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key] === undefined ? null : data[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(mamonhoc);
    await pool.execute(
      `UPDATE monhoc SET ${fields.join(', ')} WHERE mamonhoc = ?`,
      values
    );
    return this.getById(mamonhoc);
  }

  static async delete(mamonhoc) {
    const [result] = await pool.execute(
      'DELETE FROM monhoc WHERE mamonhoc = ?',
      [mamonhoc]
    );
    return result.affectedRows > 0;
  }

  static async getAvailableForRegistration(mahocky) {
    const [rows] = await pool.execute(
      `SELECT l.malophoc, l.magiaovien, l.lichhoc, l.maphong, l.soluongtoida, 
              l.soluongdadangky, m.mamonhoc, m.tenmonhoc, m.sotinchi, m.hocphi,
              g.hoten AS tengiangvien, p.tenphong
       FROM lophoc l
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       LEFT JOIN giangvien g ON l.magiaovien = g.magiaovien
       LEFT JOIN phonghoc p ON l.maphong = p.maphong
       WHERE l.mahocky = ? AND l.trangthai = 'dangmo'
       ORDER BY m.tenmonhoc`,
      [mahocky]
    );
    return rows;
  }
}

export default Course;
