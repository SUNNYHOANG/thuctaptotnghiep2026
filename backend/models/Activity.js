import pool from '../config/database.js';

class Activity {
  // Lấy tất cả hoạt động
  static async getAll(filters = {}) {
    let query = `
      SELECT h.*, l.tenloai 
      FROM hoatdong h
      LEFT JOIN loaihoatdong l ON h.maloaihoatdong = l.maloaihoatdong
      WHERE 1=1
    `;
    const params = [];

    if (filters.trangthai) {
      query += ' AND h.trangthai = ?';
      params.push(filters.trangthai);
    }

    if (filters.maloaihoatdong) {
      query += ' AND h.maloaihoatdong = ?';
      params.push(filters.maloaihoatdong);
    }

    query += ' ORDER BY h.ngaybatdau DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Lấy hoạt động theo ID
  static async getById(mahoatdong) {
    const [rows] = await pool.execute(
      `SELECT h.*, l.tenloai 
       FROM hoatdong h
       LEFT JOIN loaihoatdong l ON h.maloaihoatdong = l.maloaihoatdong
       WHERE h.mahoatdong = ?`,
      [mahoatdong]
    );
    return rows[0];
  }

  // Tạo hoạt động mới
  static async create(data) {
    const {
      tenhoatdong,
      maloaihoatdong,
      mota,
      ngaybatdau,
      ngayketthuc,
      diadiem,
      magiaovien_pt,
      soluongtoida,
      nguoitao
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO hoatdong 
       (tenhoatdong, maloaihoatdong, mota, ngaybatdau, ngayketthuc, diadiem, magiaovien_pt, soluongtoida, nguoitao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenhoatdong, maloaihoatdong, mota, ngaybatdau, ngayketthuc, diadiem, magiaovien_pt || null, soluongtoida || 100, nguoitao]
    );

    return this.getById(result.insertId);
  }

  // Cập nhật hoạt động
  static async update(mahoatdong, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key] === undefined ? null : data[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(mahoatdong);
    await pool.execute(
      `UPDATE hoatdong SET ${fields.join(', ')} WHERE mahoatdong = ?`,
      values
    );

    return this.getById(mahoatdong);
  }

  // Xóa hoạt động
  static async delete(mahoatdong) {
    await pool.execute('DELETE FROM hoatdong WHERE mahoatdong = ?', [mahoatdong]);
    return true;
  }

  // Lấy loại hoạt động
  static async getActivityTypes() {
    const [rows] = await pool.execute('SELECT * FROM loaihoatdong ORDER BY tenloai');
    return rows;
  }
}

export default Activity;
