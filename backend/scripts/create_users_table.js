import pool from '../config/database.js';

async function run() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        hoten VARCHAR(255),
        email VARCHAR(100),
        role ENUM('admin','giangvien','ctsv') NOT NULL,
        magiangvien INT,
        status ENUM('active','inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin if not exists
    await pool.execute(`
      INSERT INTO users (username, password, hoten, email, role, status)
      VALUES ('admin', 'admin123', 'Quản Trị Viên Hệ Thống', 'admin@hva.edu.vn', 'admin', 'active')
      ON DUPLICATE KEY UPDATE username = username
    `);

    // Insert default CTSV if not exists
    await pool.execute(`
      INSERT INTO users (username, password, hoten, email, role, status)
      VALUES ('ctsv', 'ctsv123', 'Phòng CTSV', 'ctsv@hva.edu.vn', 'ctsv', 'active')
      ON DUPLICATE KEY UPDATE username = username
    `);

    const [rows] = await pool.execute('SELECT username, role, status, created_at FROM users LIMIT 5');
    console.log('Users:');
    rows.forEach(r => console.log(`  - ${r.username} (${r.role}) - ${r.status}`));
    console.log('\n✅ `users` table ensured and admin inserted.');
  } catch (err) {
    console.error('Error creating users table:', err.message);
  } finally {
    process.exit();
  }
}

run();
