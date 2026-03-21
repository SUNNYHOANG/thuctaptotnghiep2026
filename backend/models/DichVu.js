import pool from '../config/database.js';

class DichVu {
  static async getLoaiDichVu() {
    const [rows] = await pool.execute(
      'SELECT * FROM loai_dichvu ORDER BY thutu, tendichvu'
    );
    return rows;
  }

  static async create(data) {
    const { mssv, maloaidichvu, tieude, noidung_yeucau, ghichu, file_dinh_kem } = data;
    
    if (!mssv) throw new Error('Mã sinh viên không được để trống');
    if (!maloaidichvu) throw new Error('Loại dịch vụ không được để trống');
    
    const maloaidichvuInt = parseInt(maloaidichvu);
    if (isNaN(maloaidichvuInt)) throw new Error('Loại dịch vụ không hợp lệ');
    
    const [result] = await pool.execute(
      `INSERT INTO dichvu_sinhvien (mssv, maloaidichvu, tieude, file_dinh_kem, noidung_yeucau, ghichu, trangthai)
       VALUES (?, ?, ?, ?, ?, ?, 'cho')`,
      [mssv, maloaidichvuInt, tieude ?? null, file_dinh_kem ?? null, noidung_yeucau ?? null, ghichu ?? null]
    );
    return this.getById(result.insertId);
  }

  static async getById(madon) {
    const [rows] = await pool.execute(
      `SELECT d.*, s.hoten, s.malop, s.makhoa, l.tendichvu
       FROM dichvu_sinhvien d
       JOIN sinhvien s ON d.mssv = s.mssv
       JOIN loai_dichvu l ON d.maloaidichvu = l.maloaidichvu
       WHERE d.madon = ?`,
      [madon]
    );
    return rows[0];
  }

  static async getByStudent(mssv) {
    const [rows] = await pool.execute(
      `SELECT d.*, l.tendichvu
       FROM dichvu_sinhvien d
       JOIN loai_dichvu l ON d.maloaidichvu = l.maloaidichvu
       WHERE d.mssv = ?
       ORDER BY d.ngaygui DESC`,
      [mssv]
    );
    return rows;
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT d.*, s.hoten, s.malop, l.tendichvu
       FROM dichvu_sinhvien d
       JOIN sinhvien s ON d.mssv = s.mssv
       JOIN loai_dichvu l ON d.maloaidichvu = l.maloaidichvu
       WHERE 1=1
    `;
    const params = [];
    if (filters.trangthai) {
      query += ' AND d.trangthai = ?';
      params.push(filters.trangthai);
    }
    if (filters.maloaidichvu) {
      query += ' AND d.maloaidichvu = ?';
      params.push(filters.maloaidichvu);
    }
    if (filters.mssv) {
      query += ' AND d.mssv = ?';
      params.push(filters.mssv);
    }
    query += ' ORDER BY d.ngaygui DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async updateStatus(madon, trangthai, ketqua, nguoiduyet, file_ketqua) {
    await pool.execute(
      `UPDATE dichvu_sinhvien SET trangthai=?, ketqua=?, nguoiduyet=?, ngayduyet=NOW(), file_ketqua=?
       WHERE madon=?`,
      [trangthai ?? null, ketqua ?? null, nguoiduyet ?? null, file_ketqua ?? null, madon]
    );
    return this.getById(madon);
  }

  static async update(madon, data) {
    const { maloaidichvu, tieude, noidung_yeucau, ghichu, file_dinh_kem } = data;
    const updates = ['maloaidichvu=?', 'tieude=?', 'noidung_yeucau=?', 'ghichu=?'];
    const values = [maloaidichvu, tieude ?? null, noidung_yeucau ?? null, ghichu ?? null];
    if (file_dinh_kem !== undefined) {
      updates.push('file_dinh_kem=?');
      values.push(file_dinh_kem);
    }
    values.push(madon);
    await pool.execute(`UPDATE dichvu_sinhvien SET ${updates.join(', ')} WHERE madon=?`, values);
    return this.getById(madon);
  }

  static async delete(madon) {
    const [result] = await pool.execute(
      `DELETE FROM dichvu_sinhvien WHERE madon = ?`,
      [madon]
    );
    return result.affectedRows > 0;
  }
}

export default DichVu;
