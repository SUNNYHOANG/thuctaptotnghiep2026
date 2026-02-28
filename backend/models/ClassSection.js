import pool from '../config/database.js';

class ClassSection {
  static async getAll(filters = {}) {
    let query = `
      SELECT l.*, m.tenmonhoc, m.sotinchi, m.hocphi,
             g.hoten AS tengiangvien,
             p.tenphong, p.toanha,
             h.tenhocky, h.namhoc
      FROM lophoc l
      JOIN monhoc m ON l.mamonhoc = m.mamonhoc
      LEFT JOIN giangvien g ON l.magiaovien = g.magiaovien
      LEFT JOIN phonghoc p ON l.maphong = p.maphong
      LEFT JOIN hocky h ON l.mahocky = h.mahocky
      WHERE 1=1
    `;
    const params = [];

    if (filters.mahocky) {
      query += ' AND l.mahocky = ?';
      params.push(filters.mahocky);
    }
    if (filters.mamonhoc) {
      query += ' AND l.mamonhoc = ?';
      params.push(filters.mamonhoc);
    }
    if (filters.trangthai) {
      query += ' AND l.trangthai = ?';
      params.push(filters.trangthai);
    }

    query += ' ORDER BY h.namhoc DESC, h.tenhocky, m.tenmonhoc';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getById(malophoc) {
    const [rows] = await pool.execute(
      `SELECT l.*, m.tenmonhoc, m.sotinchi, m.hocphi, m.makhoa,
              g.hoten AS tengiangvien, g.email AS email_giangvien,
              p.tenphong, p.toanha,
              h.tenhocky, h.namhoc
       FROM lophoc l
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       LEFT JOIN giangvien g ON l.magiaovien = g.magiaovien
       LEFT JOIN phonghoc p ON l.maphong = p.maphong
       LEFT JOIN hocky h ON l.mahocky = h.mahocky
       WHERE l.malophoc = ?`,
      [malophoc]
    );
    return rows[0];
  }

  static async create(data) {
    const {
      mamonhoc,
      mahocky,
      magiaovien,
      maphong,
      lichhoc,
      sogiohoc,
      soluongtoida,
      trangthai
    } = data;

    const vals = [
      mamonhoc == null ? null : mamonhoc,
      mahocky == null ? null : mahocky,
      magiaovien == null ? null : magiaovien,
      maphong == null ? null : maphong,
      lichhoc == null ? '' : lichhoc,
      sogiohoc == null ? null : sogiohoc,
      soluongtoida == null ? 60 : soluongtoida,
      trangthai == null ? 'dangmo' : trangthai
    ];
    const [result] = await pool.execute(
      `INSERT INTO lophoc
       (mamonhoc, mahocky, magiaovien, maphong, lichhoc, sogiohoc, soluongtoida, trangthai)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      vals
    );
    return this.getById(result.insertId);
  }

  static async update(malophoc, data) {
    const allowed = [
      'mamonhoc',
      'mahocky',
      'magiaovien',
      'maphong',
      'lichhoc',
      'sogiohoc',
      'soluongtoida',
      'trangthai'
    ];
    const fields = [];
    const values = [];

    allowed.forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key] === undefined ? null : data[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(malophoc);
    await pool.execute(
      `UPDATE lophoc SET ${fields.join(', ')} WHERE malophoc = ?`,
      values
    );
    return this.getById(malophoc);
  }

  static async delete(malophoc) {
    const [result] = await pool.execute(
      'DELETE FROM lophoc WHERE malophoc = ?',
      [malophoc]
    );
    return result.affectedRows > 0;
  }
}

export default ClassSection;
