import pool from '../config/database.js';

class HocBong {
  static async getList(mahocky = null) {
    let query = `
      SELECT h.*, COUNT(s.id) as soluong_nhan,
             k.tenhocky, k.namhoc
       FROM hocbong h
       LEFT JOIN sinhvien_hocbong s ON h.mahocbong = s.mahocbong AND s.trangthai = 'duyet'
       LEFT JOIN hocky k ON h.mahocky = k.mahocky
       WHERE 1=1
    `;
    const params = [];
    if (mahocky) {
      query += ' AND h.mahocky = ?';
      params.push(mahocky);
    }
    query += ' GROUP BY h.mahocbong ORDER BY h.hanchot DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getById(mahocbong) {
    const [rows] = await pool.execute(
      `SELECT h.*, k.tenhocky, k.namhoc FROM hocbong h JOIN hocky k ON h.mahocky = k.mahocky WHERE h.mahocbong = ?`,
      [mahocbong]
    );
    return rows[0];
  }

  static async create(data) {
    const { tenhocbong, mahocky, giatri, dieukien, soluong, hanchot, trangthai } = data;
    const [result] = await pool.execute(
      `INSERT INTO hocbong (tenhocbong, mahocky, giatri, dieukien, soluong, hanchot, trangthai)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenhocbong ?? '', mahocky, giatri ?? 0, dieukien ?? null, soluong ?? 0,
        hanchot ?? null, trangthai ?? 'mo']
    );
    return this.getById(result.insertId);
  }

  static async update(mahocbong, data) {
    const allowed = ['tenhocbong', 'giatri', 'dieukien', 'soluong', 'hanchot', 'trangthai'];
    const fields = [];
    const values = [];
    allowed.forEach((k) => {
      if (data[k] !== undefined) {
        fields.push(`${k} = ?`);
        values.push(data[k] === undefined ? null : data[k]);
      }
    });
    if (fields.length === 0) return this.getById(mahocbong);
    values.push(mahocbong);
    await pool.execute(`UPDATE hocbong SET ${fields.join(', ')} WHERE mahocbong = ?`, values);
    return this.getById(mahocbong);
  }

  static async getStudents(mahocbong) {
    const [rows] = await pool.execute(
      `SELECT s.*, sv.hoten, sv.malop
       FROM sinhvien_hocbong s
       JOIN sinhvien sv ON s.mssv = sv.mssv
       WHERE s.mahocbong = ? AND s.trangthai = 'duyet'
       ORDER BY s.created_at`,
      [mahocbong]
    );
    return rows;
  }

  static async addStudent(mahocbong, mssv, nguoixet) {
    await pool.execute(
      `INSERT INTO sinhvien_hocbong (mssv, mahocbong, ngayxet, nguoixet) VALUES (?, ?, CURDATE(), ?)
       ON DUPLICATE KEY UPDATE trangthai='duyet', ngayxet=CURDATE(), nguoixet=?`,
      [mssv, mahocbong, nguoixet ?? null, nguoixet ?? null]
    );
    return { message: 'Đã thêm sinh viên' };
  }

  static async removeStudent(mahocbong, mssv) {
    await pool.execute(
      'DELETE FROM sinhvien_hocbong WHERE mahocbong = ? AND mssv = ?',
      [mahocbong, mssv]
    );
    return { message: 'Đã xóa' };
  }

  static async getHistoryByStudent(mssv) {
    const [rows] = await pool.execute(
      `SELECT s.*, h.tenhocbong, h.giatri, k.tenhocky, k.namhoc
       FROM sinhvien_hocbong s
       JOIN hocbong h ON s.mahocbong = h.mahocbong
       JOIN hocky k ON h.mahocky = k.mahocky
       WHERE s.mssv = ? AND s.trangthai = 'duyet'
       ORDER BY s.created_at DESC`,
      [mssv]
    );
    return rows;
  }
}

export default HocBong;
