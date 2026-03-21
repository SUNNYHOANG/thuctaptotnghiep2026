import pool from '../config/database.js';

const sql = `
CREATE TABLE IF NOT EXISTS don_online (
  madon INT AUTO_INCREMENT PRIMARY KEY,
  mssv VARCHAR(50) NOT NULL,
  loaidon VARCHAR(100) NOT NULL,
  tieude VARCHAR(500) NOT NULL,
  noidung TEXT,
  ghichu TEXT,
  trangthai ENUM('cho','dangxuly','daduyet','tuchoi') DEFAULT 'cho',
  ketqua TEXT,
  nguoiduyet VARCHAR(50),
  ngaygui TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ngayduyet DATETIME,
  INDEX idx_mssv (mssv),
  INDEX idx_trangthai (trangthai),
  INDEX idx_loaidon (loaidon),
  INDEX idx_ngaygui (ngaygui)
);
`;

(async () => {
  try {
    await pool.execute(sql);
    console.log('✅ Tạo bảng don_online thành công');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
})();
