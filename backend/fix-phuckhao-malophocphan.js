import pool from './config/database.js';

async function run() {
  try {
    console.log('Đang alter bảng phuckhao...');
    await pool.execute(
      'ALTER TABLE phuckhao MODIFY COLUMN malophocphan INT DEFAULT NULL'
    );
    console.log('✓ malophocphan -> nullable. Xong!');
  } catch (err) {
    if (err.message.includes("doesn't exist") || err.message.includes('Unknown column')) {
      console.log('Cột malophocphan không tồn tại, bỏ qua.');
    } else {
      console.error('Lỗi:', err.message);
    }
  } finally {
    process.exit(0);
  }
}

run();
