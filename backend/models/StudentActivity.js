import pool from '../config/database.js';

class StudentActivity {
  // Đăng ký tham gia hoạt động
  static async register(data) {
    const { mahoatdong, mssv, vaitro = 'thamgia' } = data;

    // Kiểm tra xem đã đăng ký chưa
    const [existing] = await pool.execute(
      'SELECT * FROM thamgiahoatdong WHERE mahoatdong = ? AND mssv = ?',
      [mahoatdong, mssv]
    );

    if (existing.length > 0) {
      throw new Error('Bạn đã đăng ký hoạt động này rồi');
    }

    // Kiểm tra số lượng còn lại
    const [activity] = await pool.execute(
      'SELECT soluongtoida, soluongdadangky FROM hoatdong WHERE mahoatdong = ?',
      [mahoatdong]
    );

    if (activity[0].soluongdadangky >= activity[0].soluongtoida) {
      throw new Error('Hoạt động đã đủ số lượng đăng ký');
    }

    // Thêm đăng ký
    const [result] = await pool.execute(
      `INSERT INTO thamgiahoatdong (mahoatdong, mssv, vaitro)
       VALUES (?, ?, ?)`,
      [mahoatdong, mssv, vaitro]
    );

    // Cập nhật số lượng đã đăng ký
    await pool.execute(
      'UPDATE hoatdong SET soluongdadangky = soluongdadangky + 1 WHERE mahoatdong = ?',
      [mahoatdong]
    );

    return this.getById(result.insertId);
  }

  // Lấy thông tin đăng ký theo ID
  static async getById(mathamgia) {
    const [rows] = await pool.execute(
      `SELECT t.*, h.tenhoatdong, s.hoten 
       FROM thamgiahoatdong t
       LEFT JOIN hoatdong h ON t.mahoatdong = h.mahoatdong
       LEFT JOIN sinhvien s ON t.mssv = s.mssv
       WHERE t.mathamgia = ?`,
      [mathamgia]
    );
    return rows[0];
  }

  // Lấy danh sách đăng ký của sinh viên
  static async getByStudent(mssv) {
    const [rows] = await pool.execute(
      `SELECT t.*, h.tenhoatdong, h.ngaybatdau, h.ngayketthuc, h.diadiem, l.tenloai
       FROM thamgiahoatdong t
       LEFT JOIN hoatdong h ON t.mahoatdong = h.mahoatdong
       LEFT JOIN loaihoatdong l ON h.maloaihoatdong = l.maloaihoatdong
       WHERE t.mssv = ?
       ORDER BY t.ngaydangky DESC`,
      [mssv]
    );
    return rows;
  }

  // Lấy danh sách sinh viên tham gia hoạt động
  static async getByActivity(mahoatdong) {
    const [rows] = await pool.execute(
      `SELECT t.*, s.hoten, s.malop
       FROM thamgiahoatdong t
       LEFT JOIN sinhvien s ON t.mssv = s.mssv
       WHERE t.mahoatdong = ?
       ORDER BY t.ngaydangky DESC`,
      [mahoatdong]
    );
    return rows;
  }

  // Duyệt đăng ký
  static async approve(mathamgia, nguoiduyet, diemcong = 0) {
    await pool.execute(
      `UPDATE thamgiahoatdong 
       SET trangthai = 'duocduyet', ngayduyet = NOW(), nguoiduyet = ?, diemcong = ?
       WHERE mathamgia = ?`,
      [nguoiduyet, diemcong, mathamgia]
    );
    return this.getById(mathamgia);
  }

  // Từ chối đăng ký
  static async reject(mathamgia, nguoiduyet, ghichu) {
    await pool.execute(
      `UPDATE thamgiahoatdong 
       SET trangthai = 'tuchoi', ngayduyet = NOW(), nguoiduyet = ?, ghichu = ?
       WHERE mathamgia = ?`,
      [nguoiduyet, ghichu, mathamgia]
    );

    // Giảm số lượng đã đăng ký
    const registration = await this.getById(mathamgia);
    await pool.execute(
      'UPDATE hoatdong SET soluongdadangky = soluongdadangky - 1 WHERE mahoatdong = ?',
      [registration.mahoatdong]
    );

    return this.getById(mathamgia);
  }

  // Đánh dấu hoàn thành
  static async complete(mathamgia, diemcong) {
    await pool.execute(
      `UPDATE thamgiahoatdong 
       SET trangthai = 'hoanthanh', diemcong = ?
       WHERE mathamgia = ?`,
      [diemcong, mathamgia]
    );
    return this.getById(mathamgia);
  }

  // Hủy đăng ký
  static async cancel(mathamgia) {
    const registration = await this.getById(mathamgia);
    
    if (registration.trangthai === 'duocduyet') {
      throw new Error('Không thể hủy đăng ký đã được duyệt');
    }

    await pool.execute('DELETE FROM thamgiahoatdong WHERE mathamgia = ?', [mathamgia]);

    // Giảm số lượng đã đăng ký
    await pool.execute(
      'UPDATE hoatdong SET soluongdadangky = soluongdadangky - 1 WHERE mahoatdong = ?',
      [registration.mahoatdong]
    );

    return true;
  }
}

export default StudentActivity;
