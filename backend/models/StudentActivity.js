import pool from '../config/database.js';

class StudentActivity {
  // Đăng ký tham gia hoạt động - gửi yêu cầu qua CTSV (trạng thái dangky)
  // Mỗi sinh viên chỉ đăng ký 1 lần (UNIQUE mahoatdong+mssv)
  // Chỉ tăng soluongdadangky khi CTSV duyệt
  static async register(data) {
    const { mahoatdong, mssv, vaitro = 'thamgia' } = data;

    // Kiểm tra xem đã đăng ký chưa (đã có bản ghi bất kỳ trạng thái nào)
    const [existing] = await pool.execute(
      'SELECT * FROM thamgiahoatdong WHERE mahoatdong = ? AND mssv = ?',
      [mahoatdong, mssv]
    );

    if (existing.length > 0) {
      throw new Error('Bạn đã đăng ký hoạt động này rồi');
    }

    // Kiểm tra hoạt động còn mở đăng ký và chưa chốt
    const [activity] = await pool.execute(
      'SELECT soluongtoida, soluongdadangky, trangthai FROM hoatdong WHERE mahoatdong = ?',
      [mahoatdong]
    );

    if (!activity.length) {
      throw new Error('Không tìm thấy hoạt động');
    }
    if (activity[0].trangthai === 'dachot' || activity[0].trangthai === 'huy') {
      throw new Error('Hoạt động không còn nhận đăng ký');
    }
    if (activity[0].soluongdadangky >= activity[0].soluongtoida) {
      throw new Error('Hoạt động đã đủ số lượng đăng ký');
    }

    // Thêm yêu cầu đăng ký (trangthai=dangky - chờ CTSV duyệt), KHÔNG tăng soluongdadangky
    const [result] = await pool.execute(
      `INSERT INTO thamgiahoatdong (mahoatdong, mssv, vaitro, trangthai)
       VALUES (?, ?, ?, 'dangky')`,
      [mahoatdong, mssv, vaitro]
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

  // Duyệt đăng ký (CTSV) - tăng soluongdadangky, chốt khi đủ số lượng
  static async approve(mathamgia, nguoiduyet, diemcong = 0) {
    const reg = await this.getById(mathamgia);
    if (!reg) throw new Error('Không tìm thấy đăng ký');
    if (reg.trangthai !== 'dangky') {
      throw new Error('Chỉ có thể duyệt yêu cầu đang chờ');
    }

    const [act] = await pool.execute(
      'SELECT soluongtoida, soluongdadangky FROM hoatdong WHERE mahoatdong = ?',
      [reg.mahoatdong]
    );
    if (act[0].soluongdadangky >= act[0].soluongtoida) {
      throw new Error('Hoạt động đã đủ số lượng');
    }

    await pool.execute(
      `UPDATE thamgiahoatdong 
       SET trangthai = 'duocduyet', ngayduyet = NOW(), nguoiduyet = ?, diemcong = ?
       WHERE mathamgia = ?`,
      [nguoiduyet, diemcong, mathamgia]
    );

    // Tăng số lượng đã đăng ký
    await pool.execute(
      'UPDATE hoatdong SET soluongdadangky = soluongdadangky + 1 WHERE mahoatdong = ?',
      [reg.mahoatdong]
    );

    // Khi đủ số lượng -> chốt hoạt động (dachot)
    const [check] = await pool.execute(
      'SELECT soluongdadangky, soluongtoida FROM hoatdong WHERE mahoatdong = ?',
      [reg.mahoatdong]
    );
    if (check[0].soluongdadangky >= check[0].soluongtoida) {
      await pool.execute(
        "UPDATE hoatdong SET trangthai = 'dachot' WHERE mahoatdong = ?",
        [reg.mahoatdong]
      );
    }

    return this.getById(mathamgia);
  }

  // Từ chối đăng ký (CTSV) - chỉ trừ soluongdadangky nếu trước đó đã duocduyet
  static async reject(mathamgia, nguoiduyet, ghichu) {
    const registration = await this.getById(mathamgia);
    if (!registration) throw new Error('Không tìm thấy đăng ký');

    await pool.execute(
      `UPDATE thamgiahoatdong 
       SET trangthai = 'tuchoi', ngayduyet = NOW(), nguoiduyet = ?, ghichu = ?
       WHERE mathamgia = ?`,
      [nguoiduyet, ghichu, mathamgia]
    );

    // Chỉ giảm soluongdadangky nếu trước đó đã duocduyet (đã được tính vào)
    if (registration.trangthai === 'duocduyet') {
      await pool.execute(
        'UPDATE hoatdong SET soluongdadangky = soluongdadangky - 1 WHERE mahoatdong = ?',
        [registration.mahoatdong]
      );
    }

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

  // Hủy đăng ký (sinh viên) - chỉ hủy được khi dangky
  static async cancel(mathamgia) {
    const registration = await this.getById(mathamgia);

    if (registration.trangthai === 'duocduyet') {
      throw new Error('Không thể hủy đăng ký đã được duyệt');
    }

    await pool.execute('DELETE FROM thamgiahoatdong WHERE mathamgia = ?', [mathamgia]);

    // Chỉ giảm soluongdadangky nếu đã duocduyet (dangky chưa được tính)
    if (registration.trangthai === 'duocduyet') {
      await pool.execute(
        'UPDATE hoatdong SET soluongdadangky = soluongdadangky - 1 WHERE mahoatdong = ?',
        [registration.mahoatdong]
      );
    }

    return true;
  }

  // Lấy danh sách yêu cầu chờ CTSV duyệt (trangthai=dangky)
  static async getPendingForCTSV() {
    const [rows] = await pool.execute(
      `SELECT t.*, h.tenhoatdong, h.soluongtoida, h.soluongdadangky, h.trangthai as hd_trangthai, l.tenloai, s.hoten, s.malop
       FROM thamgiahoatdong t
       LEFT JOIN hoatdong h ON t.mahoatdong = h.mahoatdong
       LEFT JOIN loaihoatdong l ON h.maloaihoatdong = l.maloaihoatdong
       LEFT JOIN sinhvien s ON t.mssv = s.mssv
       WHERE t.trangthai = 'dangky' AND h.trangthai != 'huy'
       ORDER BY t.ngaydangky ASC`
    );
    return rows;
  }

  // Lấy danh sách sinh viên đăng ký thành công (duocduyet) để export
  static async getApprovedByActivity(mahoatdong) {
    const [rows] = await pool.execute(
      `SELECT t.mathamgia, t.mssv, s.hoten, s.malop, t.vaitro, t.ngaydangky, t.ngayduyet, t.trangthai
       FROM thamgiahoatdong t
       LEFT JOIN sinhvien s ON t.mssv = s.mssv
       WHERE t.mahoatdong = ? AND t.trangthai = 'duocduyet'
       ORDER BY t.ngayduyet ASC`,
      [mahoatdong]
    );
    return rows;
  }
}

export default StudentActivity;
