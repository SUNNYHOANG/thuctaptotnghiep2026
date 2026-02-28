import pool from './config/database.js';

async function runMigration() {
  try {
    console.log('Chạy migration thêm cột học phí...');
    
    // Check if column exists
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='monhoc' AND COLUMN_NAME='hocphi'"
    );
    
    if (columns.length > 0) {
      console.log('✓ Cột hocphi đã tồn tại trong bảng monhoc');
      process.exit(0);
    }
    
    // Add hocphi column
    console.log('Thêm cột hocphi vào bảng monhoc...');
    await pool.execute(
      "ALTER TABLE monhoc ADD COLUMN hocphi DECIMAL(12, 0) DEFAULT 0 COMMENT 'Học phí của môn học (đơn vị: VND)'"
    );
    console.log('✓ Cột hocphi đã được thêm');
    
    // Update sample data
    console.log('Cập nhật dữ liệu mẫu...');
    await pool.execute("UPDATE monhoc SET hocphi = 2220000 WHERE hocphi = 0");
    console.log('✓ Dữ liệu đã được cập nhật');
    
    console.log('✓ Migration thành công!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Lỗi migration:', err.message);
    process.exit(1);
  }
}

runMigration();
