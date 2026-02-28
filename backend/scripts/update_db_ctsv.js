import pool from '../config/database.js';

async function tableExists(tableName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return Number(rows?.[0]?.cnt || 0) > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Number(rows?.[0]?.cnt || 0) > 0;
}

async function getColumnType(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT COLUMN_TYPE AS columnType
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return rows?.[0]?.columnType || null;
}

async function run() {
  try {
    if (!(await tableExists('users'))) {
      console.error('❌ Không tìm thấy bảng `users`. Hãy setup database trước (vd: chạy `node setup-final.js` hoặc `node setup-db.js`).');
      process.exit(1);
    }

    // 1) Ensure role enum contains 'ctsv' (nếu role là ENUM)
    const roleType = await getColumnType('users', 'role');
    if (!roleType) {
      console.error('❌ Không tìm thấy cột `users.role`.');
      process.exit(1);
    }

    const roleTypeLower = String(roleType).toLowerCase();
    if (roleTypeLower.startsWith('enum(') && !roleTypeLower.includes("'ctsv'")) {
      await pool.execute(
        "ALTER TABLE users MODIFY role ENUM('admin','giangvien','ctsv') NOT NULL"
      );
      console.log('✅ Updated users.role enum to include ctsv');
    } else {
      console.log('ℹ️ users.role đã hỗ trợ ctsv (hoặc không phải ENUM), bỏ qua');
    }

    // 2) Ensure status column exists (một số schema cũ không có)
    const hasStatus = await columnExists('users', 'status');
    if (!hasStatus) {
      await pool.execute(
        "ALTER TABLE users ADD COLUMN status ENUM('active','inactive') DEFAULT 'active'"
      );
      console.log('✅ Added users.status column');
    } else {
      console.log('ℹ️ users.status đã tồn tại, bỏ qua');
    }

    // 3) Ensure CTSV account exists and is active
    if (await columnExists('users', 'status')) {
      await pool.execute(
        `INSERT INTO users (username, password, hoten, role, status)
         SELECT 'ctsv', 'ctsv123', 'Phòng CTSV', 'ctsv', 'active'
         WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'ctsv')`
      );
      await pool.execute(
        `UPDATE users
         SET password = 'ctsv123',
             role = 'ctsv',
             hoten = COALESCE(hoten, 'Phòng CTSV'),
             status = 'active'
         WHERE username = 'ctsv'`
      );
    } else {
      await pool.execute(
        `INSERT INTO users (username, password, hoten, role)
         SELECT 'ctsv', 'ctsv123', 'Phòng CTSV', 'ctsv'
         WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'ctsv')`
      );
      await pool.execute(
        `UPDATE users
         SET password = 'ctsv123',
             role = 'ctsv',
             hoten = COALESCE(hoten, 'Phòng CTSV')
         WHERE username = 'ctsv'`
      );
    }

    console.log('✅ Ensured CTSV account: ctsv / ctsv123');
    console.log('✨ Database update for CTSV completed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Update failed:', err.message);
    process.exit(1);
  }
}

run();

