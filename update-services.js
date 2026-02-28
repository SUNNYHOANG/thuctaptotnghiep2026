import pool from './backend/config/database.js';

async function updateServices() {
  try {
    const query = `INSERT IGNORE INTO loai_dichvu (maloaidichvu, tendichvu, mota, thutu) 
                   VALUES 
                   (7, 'Xin chuyển điểm tiếng Anh', 'Đơn xin chuyển kết quả tiếng Anh', 7),
                   (8, 'Xin chuyển ngành', 'Đơn xin chuyển ngành học', 8),
                   (9, 'Xin học vượt', 'Đơn xin học vượt lên lớp cao hơn', 9),
                   (10, 'Xin nghỉ ốm', 'Đơn xin nghỉ học do ốm đau', 10)`;
    
    const [result] = await pool.execute(query);
    console.log('✅ Updated services:', result.affectedRows, 'rows affected');
    
    // Verify
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM loai_dichvu');
    console.log('📊 Total service types:', rows[0].count);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

updateServices();
