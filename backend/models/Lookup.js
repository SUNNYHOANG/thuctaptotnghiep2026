import pool from '../config/database.js';

/** Danh sách học kỳ (cho dropdown, filter) */
export async function getHocKyList() {
  const [rows] = await pool.execute(
    'SELECT mahocky, tenhocky, namhoc FROM hocky ORDER BY namhoc DESC, tenhocky'
  );
  return rows;
}

/** Danh sách giảng viên */
export async function getGiangVienList() {
  const [rows] = await pool.execute(
    'SELECT magiaovien, hoten, email, makhoa FROM giangvien ORDER BY hoten'
  );
  return rows;
}

/** Danh sách phòng học */
export async function getPhongHocList() {
  const [rows] = await pool.execute(
    'SELECT maphong, tenphong, toanha, succhua FROM phonghoc ORDER BY toanha, maphong'
  );
  return rows;
}
