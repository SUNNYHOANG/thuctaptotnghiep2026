import pool from '../config/database.js';

class Enrollment {
  static async register(data) {
    const { malophoc, mssv } = data;

    if (!malophoc) {
      throw new Error('Thiếu mã lớp học phần');
    }
    if (!mssv) {
      throw new Error('Thiếu mã số sinh viên');
    }

    const [existing] = await pool.execute(
      `SELECT madangky FROM dsdangky 
       WHERE malophoc = ? AND mssv = ? AND trangthai != 'huy'`,
      [malophoc, mssv]
    );
    if (existing.length > 0) {
      throw new Error('Bạn đã đăng ký lớp học phần này rồi');
    }

    const [lop] = await pool.execute(
      'SELECT soluongtoida, soluongdadangky, trangthai FROM lophoc WHERE malophoc = ?',
      [malophoc]
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
      `INSERT INTO dsdangky (malophoc, mssv, trangthai)
       VALUES (?, ?, 'dangcho')`,
      [malophoc, mssv]
    );

    await pool.execute(
      'UPDATE lophoc SET soluongdadangky = soluongdadangky + 1 WHERE malophoc = ?',
      [malophoc]
    );

    return this.getById(result.insertId);
  }

  static async getById(madangky) {
    const [rows] = await pool.execute(
      `SELECT d.madangky, d.mssv, d.malophoc, d.thoidiemdk, d.trangthai,
              l.lichhoc, l.mahocky, l.maphong, l.magiaovien,
              l.soluongtoida, l.soluongdadangky,
              m.mamonhoc, m.tenmonhoc, m.sotinchi, m.hocphi
       FROM dsdangky d
       JOIN lophoc l ON d.malophoc = l.malophoc
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
      "UPDATE dsdangky SET trangthai = 'huy' WHERE madangky = ?",
      [madangky]
    );
    await pool.execute(
      'UPDATE lophoc SET soluongdadangky = GREATEST(0, soluongdadangky - 1) WHERE malophoc = ?',
      [reg.malophoc]
    );
    return true;
  }

  static async getByStudent(mssv, mahocky = null) {
    let query = `
      SELECT d.madangky, d.mssv, d.malophoc, d.thoidiemdk, d.trangthai,
             l.lichhoc, l.mahocky, l.maphong, l.magiaovien,
             l.soluongtoida, l.soluongdadangky,
             m.mamonhoc, m.tenmonhoc, m.sotinchi, m.hocphi
      FROM dsdangky d
      JOIN lophoc l ON d.malophoc = l.malophoc
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
      `SELECT d.madangky, d.mssv, d.malophoc, d.thoidiemdk, d.trangthai,
              m.mamonhoc, m.tenmonhoc, m.sotinchi, m.hocphi,
              l.lichhoc, l.maphong, l.magiaovien
       FROM dsdangky d
       JOIN lophoc l ON d.malophoc = l.malophoc
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE d.mssv = ? AND d.trangthai != 'huy' AND l.mahocky = ?
       ORDER BY m.tenmonhoc`,
      [mssv, mahocky]
    );
    return rows;
  }

  static async getByClassSection(malophoc) {
    const [rows] = await pool.execute(
      `SELECT d.madangky, d.mssv, d.malophoc, d.thoidiemdk, d.trangthai,
              l.lichhoc, l.mahocky, l.maphong, l.magiaovien,
              l.soluongtoida, l.soluongdadangky,
              m.mamonhoc, m.tenmonhoc, m.sotinchi, m.hocphi
       FROM dsdangky d
       JOIN lophoc l ON d.malophoc = l.malophoc
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE d.malophoc = ? AND d.trangthai != 'huy'
       ORDER BY d.thoidiemdk`,
      [malophoc]
    );
    return rows;
  }
}

export default Enrollment;
