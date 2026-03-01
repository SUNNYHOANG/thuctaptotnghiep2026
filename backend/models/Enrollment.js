import pool from '../config/database.js';

class Enrollment {
  static async register(data) {
    const { malophocphan, mssv } = data;
    const malophoc = malophocphan; // alias

    if (!malophocphan && !malophoc) {
      throw new Error('Thiếu mã lớp học phần');
    }
    if (!mssv) {
      throw new Error('Thiếu mã số sinh viên');
    }

    const [existing] = await pool.execute(
      `SELECT madangky FROM dangkyhocphan 
       WHERE malophocphan = ? AND mssv = ? AND trangthai != 'huy'`,
      [malophocphan || malophoc, mssv]
    );
    if (existing.length > 0) {
      throw new Error('Bạn đã đăng ký lớp học phần này rồi');
    }

    const [lop] = await pool.execute(
      'SELECT soluongtoida, soluongdadangky, trangthai FROM lophocphan WHERE malophocphan = ?',
      [malophocphan || malophoc]
    );
    if (lop.length === 0) {
      throw new Error('Không tìm thấy lớp học phần');
    }
    const l = lop[0];
    if (l.trangthai !== 'dangmo') {
      throw new Error('Lớp học phần không còn mở đăng ký');
    }
    if (Number(l.soluongdadangky) >= Number(l.soluongtoida)) {
      throw new Error('Lớp học phần đã đủ số lượng');
    }

    const [result] = await pool.execute(
      `INSERT INTO dangkyhocphan (malophocphan, mssv, trangthai)
       VALUES (?, ?, 'dangky')`,
      [malophocphan || malophoc, mssv]
    );

    await pool.execute(
      'UPDATE lophocphan SET soluongdadangky = soluongdadangky + 1 WHERE malophocphan = ?',
      [malophocphan || malophoc]
    );

    return this.getById(result.insertId);
  }

  static async getById(madangky) {
    const [rows] = await pool.execute(
      `SELECT d.madangky, d.mssv, d.malophocphan, d.ngaydangky, d.trangthai,
              l.lichhoc, l.mahocky, l.maphong, l.magiaovien,
              l.soluongtoida, l.soluongdadangky,
              m.mamonhoc, m.tenmonhoc, m.sotinchi, m.hocphi
       FROM dangkyhocphan d
       JOIN lophocphan l ON d.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE d.madangky = ?`,
      [madangky]
    );
    return rows[0];
  }

  static async cancel(madangky) {
    const reg = await this.getById(madangky);
    if (!reg) {
      throw new Error('Không tìm thấy đăng ký');
    }
    if (reg.trangthai === 'huy') {
      throw new Error('Đăng ký đã được hủy trước đó');
    }

    await pool.execute(
      "UPDATE dangkyhocphan SET trangthai = 'huy' WHERE madangky = ?",
      [madangky]
    );
    await pool.execute(
      'UPDATE lophocphan SET soluongdadangky = GREATEST(0, soluongdadangky - 1) WHERE malophocphan = ?',
      [reg.malophocphan]
    );
    return true;
  }

  static async getByStudent(mssv, mahocky = null) {
    let query = `
      SELECT d.madangky, d.mssv, d.malophocphan, d.ngaydangky, d.trangthai,
             l.lichhoc, l.mahocky, l.maphong, l.magiaovien,
             l.soluongtoida, l.soluongdadangky,
             m.mamonhoc, m.tenmonhoc, m.sotinchi, m.hocphi
      FROM dangkyhocphan d
      JOIN lophocphan l ON d.malophocphan = l.malophocphan
      JOIN monhoc m ON l.mamonhoc = m.mamonhoc
      WHERE d.mssv = ? AND d.trangthai != 'huy'
    `;
    const params = [mssv];
    if (mahocky != null && mahocky !== '') {
      query += ' AND l.mahocky = ?';
      params.push(mahocky);
    }
    query += ' ORDER BY l.mahocky DESC, m.tenmonhoc';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getTimetable(mssv, mahocky) {
    const [rows] = await pool.execute(
      `SELECT d.madangky, d.mssv, d.malophocphan, d.ngaydangky, d.trangthai,
              m.mamonhoc, m.tenmonhoc, m.sotinchi, m.hocphi,
              l.lichhoc, l.maphong, l.magiaovien
       FROM dangkyhocphan d
       JOIN lophocphan l ON d.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE d.mssv = ? AND d.trangthai != 'huy' AND l.mahocky = ?
       ORDER BY m.tenmonhoc`,
      [mssv, mahocky]
    );
    return rows;
  }

  static async getByClassSection(malophocphan) {
    const [rows] = await pool.execute(
      `SELECT d.madangky, d.mssv, d.malophocphan, d.ngaydangky, d.trangthai,
              l.lichhoc, l.mahocky, l.maphong, l.magiaovien,
              l.soluongtoida, l.soluongdadangky,
              m.mamonhoc, m.tenmonhoc, m.sotinchi, m.hocphi
       FROM dangkyhocphan d
       JOIN lophocphan l ON d.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE d.malophocphan = ? AND d.trangthai != 'huy'
       ORDER BY d.ngaydangky`,
      [malophocphan]
    );
    return rows;
  }
}

export default Enrollment;
