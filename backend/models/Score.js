import pool from '../config/database.js';

class Score {
  // Tính điểm rèn luyện cho sinh viên trong học kỳ
  static async calculateScore(mssv, mahocky) {
    // Lấy điểm từ các hoạt động đã hoàn thành
    const [activities] = await pool.execute(
      `SELECT SUM(diemcong) as tongdiemhoatdong
       FROM thamgiahoatdong
       WHERE mssv = ? AND trangthai = 'hoanthanh'`,
      [mssv]
    );

    const diemhoatdong = activities[0].tongdiemhoatdong || 0;

    // Lấy điểm học tập (có thể tính từ điểm trung bình học kỳ)
    // Tạm thời để mặc định, có thể mở rộng sau
    const diemhoctap = 0;

    // Lấy điểm kỷ luật (mặc định 20 điểm nếu không có vi phạm)
    const diemkyluat = 20;

    // Tính tổng điểm
    const diemtong = Math.min(100, diemhoatdong + diemhoctap + diemkyluat);

    // Xếp loại
    let xeploai = 'Chưa đạt';
    if (diemtong >= 90) xeploai = 'Xuất sắc';
    else if (diemtong >= 80) xeploai = 'Tốt';
    else if (diemtong >= 70) xeploai = 'Khá';
    else if (diemtong >= 60) xeploai = 'Trung bình';
    else if (diemtong >= 50) xeploai = 'Yếu';

    // Lưu hoặc cập nhật điểm
    const [existing] = await pool.execute(
      'SELECT * FROM diemrenluyen WHERE mssv = ? AND mahocky = ?',
      [mssv, mahocky]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE diemrenluyen 
         SET diemhoatdong = ?, diemhoctap = ?, diemkyluat = ?, diemtong = ?, xeploai = ?
         WHERE mssv = ? AND mahocky = ?`,
        [diemhoatdong, diemhoctap, diemkyluat, diemtong, xeploai, mssv, mahocky]
      );
    } else {
      await pool.execute(
        `INSERT INTO diemrenluyen 
         (mssv, mahocky, diemhoatdong, diemhoctap, diemkyluat, diemtong, xeploai)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [mssv, mahocky, diemhoatdong, diemhoctap, diemkyluat, diemtong, xeploai]
      );
    }

    return this.getByStudentAndSemester(mssv, mahocky);
  }

  // Lấy điểm rèn luyện của sinh viên trong học kỳ
  static async getByStudentAndSemester(mssv, mahocky) {
    const [rows] = await pool.execute(
      `SELECT d.*, s.hoten, h.tenhocky, h.namhoc
       FROM diemrenluyen d
       LEFT JOIN sinhvien s ON d.mssv = s.mssv
       LEFT JOIN hocky h ON d.mahocky = h.mahocky
       WHERE d.mssv = ? AND d.mahocky = ?`,
      [mssv, mahocky]
    );
    return rows[0];
  }

  // Lấy tất cả điểm rèn luyện của sinh viên
  static async getByStudent(mssv) {
    const [rows] = await pool.execute(
      `SELECT d.*, h.tenhocky, h.namhoc
       FROM diemrenluyen d
       LEFT JOIN hocky h ON d.mahocky = h.mahocky
       WHERE d.mssv = ?
       ORDER BY h.namhoc DESC, h.tenhocky DESC`,
      [mssv]
    );
    return rows;
  }

  // Lấy điểm rèn luyện theo học kỳ
  static async getBySemester(mahocky) {
    const [rows] = await pool.execute(
      `SELECT d.*, s.hoten, s.malop
       FROM diemrenluyen d
       LEFT JOIN sinhvien s ON d.mssv = s.mssv
       WHERE d.mahocky = ?
       ORDER BY d.diemtong DESC`,
      [mahocky]
    );
    return rows;
  }

  // Cập nhật điểm thủ công (cho admin)
  static async updateScore(mssv, mahocky, data) {
    const diemhoatdong = data.diemhoatdong == null ? 0 : data.diemhoatdong;
    const diemhoctap = data.diemhoctap == null ? 0 : data.diemhoctap;
    const diemkyluat = data.diemkyluat == null ? 0 : data.diemkyluat;
    const ghichu = data.ghichu == null ? null : data.ghichu;
    const diemtong = Math.min(100, diemhoatdong + diemhoctap + diemkyluat);

    let xeploai = 'Chưa đạt';
    if (diemtong >= 90) xeploai = 'Xuất sắc';
    else if (diemtong >= 80) xeploai = 'Tốt';
    else if (diemtong >= 70) xeploai = 'Khá';
    else if (diemtong >= 60) xeploai = 'Trung bình';
    else if (diemtong >= 50) xeploai = 'Yếu';

    const [existing] = await pool.execute(
      'SELECT * FROM diemrenluyen WHERE mssv = ? AND mahocky = ?',
      [mssv, mahocky]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE diemrenluyen 
         SET diemhoatdong = ?, diemhoctap = ?, diemkyluat = ?, diemtong = ?, xeploai = ?, ghichu = ?
         WHERE mssv = ? AND mahocky = ?`,
        [diemhoatdong, diemhoctap, diemkyluat, diemtong, xeploai, ghichu, mssv, mahocky]
      );
    } else {
      await pool.execute(
        `INSERT INTO diemrenluyen 
         (mssv, mahocky, diemhoatdong, diemhoctap, diemkyluat, diemtong, xeploai, ghichu)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [mssv, mahocky, diemhoatdong, diemhoctap, diemkyluat, diemtong, xeploai, ghichu]
      );
    }

    return this.getByStudentAndSemester(mssv, mahocky);
  }
}

export default Score;
