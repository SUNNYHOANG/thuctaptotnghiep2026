import pool from '../config/database.js';

class Course {
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
      [Number(mamonhoc)]
    );
    return rows[0];
  }

  static async create(data) {
    const tenmonhoc = data.tenmonhoc == null ? '' : data.tenmonhoc;
    const sotinchi = data.sotinchi == null ? 3 : data.sotinchi;
    const makhoa = data.makhoa == null ? null : data.makhoa;
    const mota = data.mota == null ? null : data.mota;
    const hocphi = data.hocphi == null ? 0 : data.hocphi;
    const [result] = await pool.execute(
      `INSERT INTO monhoc (tenmonhoc, sotinchi, makhoa, mota, hocphi)
       VALUES (?, ?, ?, ?, ?)`,
      [tenmonhoc, sotinchi, makhoa, mota, hocphi]
    );
    return this.getById(result.insertId);
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

    values.push(Number(mamonhoc));
    await pool.execute(
      `UPDATE monhoc SET ${fields.join(', ')} WHERE mamonhoc = ?`,
      values
    );
    return this.getById(mamonhoc);
  }

  static async delete(mamonhoc) {
    const [result] = await pool.execute(
      'DELETE FROM monhoc WHERE mamonhoc = ?',
      [Number(mamonhoc)]
    );
    return result.affectedRows > 0;
  }

  static async getAvailableForRegistration(mahocky) {
    const [rows] = await pool.execute(
      `SELECT l.malophocphan, l.magiaovien, l.lichhoc, l.maphong, l.soluongtoida, 
              l.soluongdadangky, m.mamonhoc, m.tenmonhoc, m.sotinchi, m.hocphi,
              g.hoten AS tengiangvien, p.tenphong
       FROM lophocphan l
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
