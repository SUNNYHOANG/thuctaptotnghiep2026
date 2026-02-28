import pool from '../config/database.js';

class ThongBao {
  static async create(data) {
    const { tieude, noidung, loai, malop, mahocky, han_xem, guiemail, nguoitao } = data;
    const [result] = await pool.execute(
      `INSERT INTO thongbao (tieude, noidung, loai, malop, mahocky, han_xem, guiemail, nguoitao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tieude ?? '', noidung ?? null, loai ?? 'khac', malop ?? null, mahocky ?? null,
        han_xem ?? null, guiemail ? 1 : 0, nguoitao ?? null]
    );
    return this.getById(result.insertId);
  }

  static async getById(mathongbao) {
    const [rows] = await pool.execute(
      `SELECT t.*, h.tenhocky, h.namhoc
       FROM thongbao t
       LEFT JOIN hocky h ON t.mahocky = h.mahocky
       WHERE t.mathongbao = ?`,
      [mathongbao]
    );
    return rows[0];
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT t.*, h.tenhocky, h.namhoc
       FROM thongbao t
       LEFT JOIN hocky h ON t.mahocky = h.mahocky
       WHERE 1=1
    `;
    const params = [];
    if (filters.loai) {
      query += ' AND t.loai = ?';
      params.push(filters.loai);
    }
    if (filters.malop) {
      query += ' AND t.malop = ?';
      params.push(filters.malop);
    }
    if (filters.mahocky) {
      query += ' AND t.mahocky = ?';
      params.push(filters.mahocky);
    }
    query += ' ORDER BY t.ngaytao DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getForStudent(malop, mahocky = null) {
    let query = `
      SELECT t.*, h.tenhocky, h.namhoc
       FROM thongbao t
       LEFT JOIN hocky h ON t.mahocky = h.mahocky
       WHERE (t.loai = 'truong' OR t.loai = 'lichthi' OR t.loai = 'deadline_hocphi')
         OR (t.loai = 'lop' AND t.malop = ?)
    `;
    const params = [malop];
    if (mahocky) {
      query += ' AND (t.mahocky = ? OR t.mahocky IS NULL)';
      params.push(mahocky);
    }
    query += ' ORDER BY t.ngaytao DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async update(mathongbao, data) {
    const allowed = ['tieude', 'noidung', 'loai', 'malop', 'mahocky', 'han_xem', 'guiemail'];
    const fields = [];
    const values = [];
    allowed.forEach((k) => {
      if (data[k] !== undefined) {
        fields.push(k === 'guiemail' ? `${k} = ?` : `${k} = ?`);
        values.push(k === 'guiemail' ? (data[k] ? 1 : 0) : data[k]);
      }
    });
    if (fields.length === 0) return this.getById(mathongbao);
    values.push(mathongbao);
    await pool.execute(`UPDATE thongbao SET ${fields.join(', ')} WHERE mathongbao = ?`, values);
    return this.getById(mathongbao);
  }

  static async delete(mathongbao) {
    const [result] = await pool.execute('DELETE FROM thongbao WHERE mathongbao = ?', [mathongbao]);
    return result.affectedRows > 0;
  }
}

export default ThongBao;
