/**
 * Script chạy migration 06_khoa_role.sql
 * Usage: node run-khoa-migration.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dkhp1',
  multipleStatements: true,
};

async function runMigration() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Kết nối database thành công:', config.database);

  try {
    // ── 1. Thêm cột makhoa vào users ──────────────────────────────────────
    try {
      await conn.execute('ALTER TABLE users ADD COLUMN makhoa VARCHAR(50) DEFAULT NULL');
      console.log('✅ Thêm cột makhoa vào bảng users');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Cột makhoa đã tồn tại trong users, bỏ qua');
      } else throw e;
    }

    // ── 2. Mở rộng ENUM role ───────────────────────────────────────────────
    try {
      await conn.execute(
        "ALTER TABLE users MODIFY COLUMN role ENUM('admin','giangvien','ctsv','khoa') NOT NULL DEFAULT 'giangvien'"
      );
      console.log("✅ Mở rộng ENUM role (thêm 'khoa')");
    } catch (e) {
      console.log('⚠️  ENUM role:', e.message);
    }

    // ── 3. Thêm các cột khoa vào drl_tudanhgia ────────────────────────────
    const khoaCols = [
      ['diem_khoa',       'INT DEFAULT NULL'],
      ['nhan_xet_khoa',   'TEXT NULL'],
      ['nguoi_duyet_khoa','VARCHAR(50) NULL'],
      ['ngay_duyet_khoa', 'DATETIME NULL'],
    ];
    for (const [col, def] of khoaCols) {
      try {
        await conn.execute(`ALTER TABLE drl_tudanhgia ADD COLUMN ${col} ${def}`);
        console.log(`✅ Thêm cột ${col} vào drl_tudanhgia`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Cột ${col} đã tồn tại, bỏ qua`);
        } else throw e;
      }
    }

    // ── 4. Mở rộng ENUM trangthai ─────────────────────────────────────────
    try {
      await conn.execute(
        "ALTER TABLE drl_tudanhgia MODIFY COLUMN trangthai ENUM('choduyet','daduyet','bituchoi','chokhoaduyet') NOT NULL DEFAULT 'choduyet'"
      );
      console.log("✅ Mở rộng ENUM trangthai (thêm 'chokhoaduyet')");
    } catch (e) {
      console.log('⚠️  ENUM trangthai:', e.message);
    }

    // ── 5. Thêm cột diem_ctsv, nhan_xet_ctsv, nguoi_duyet_ctsv nếu chưa có
    const ctsvCols = [
      ['diem_ctsv',        'INT DEFAULT NULL'],
      ['nhan_xet_ctsv',    'TEXT NULL'],
      ['nguoi_duyet_ctsv', 'VARCHAR(50) NULL'],
      ['ngay_duyet_ctsv',  'DATETIME NULL'],
      ['nguoi_duyet_cvht', 'VARCHAR(50) NULL'],
      ['ngay_duyet_cvht',  'DATETIME NULL'],
    ];
    for (const [col, def] of ctsvCols) {
      try {
        await conn.execute(`ALTER TABLE drl_tudanhgia ADD COLUMN ${col} ${def}`);
        console.log(`✅ Thêm cột ${col} vào drl_tudanhgia`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Cột ${col} đã tồn tại, bỏ qua`);
        } else throw e;
      }
    }

    // ── 6. Lấy danh sách makhoa thực tế từ bảng sinhvien ─────────────────
    const [makhoaRows] = await conn.execute(
      'SELECT DISTINCT makhoa FROM sinhvien WHERE makhoa IS NOT NULL AND makhoa != "" ORDER BY makhoa'
    );
    const makhoaList = makhoaRows.map((r) => r.makhoa);
    console.log('📋 Các mã khoa trong hệ thống:', makhoaList.length ? makhoaList.join(', ') : '(chưa có)');

    // ── 7. Tạo tài khoản khoa cho từng makhoa thực tế ────────────────────
    if (makhoaList.length > 0) {
      for (const mk of makhoaList) {
        const username = 'khoa_' + mk.toLowerCase().replace(/[^a-z0-9]/g, '');
        const hoten = `Ban Quản Lý Khoa ${mk}`;
        const email = `khoa.${mk.toLowerCase()}@hva.edu.vn`;
        try {
          await conn.execute(
            `INSERT INTO users (username, password, hoten, email, role, makhoa, status)
             VALUES (?, '123456', ?, ?, 'khoa', ?, 'active')
             ON DUPLICATE KEY UPDATE makhoa = VALUES(makhoa), status = 'active'`,
            [username, hoten, email, mk]
          );
          console.log(`✅ Tài khoản: ${username} / 123456  (khoa: ${mk})`);
        } catch (e) {
          console.log(`⚠️  Tài khoản ${username}:`, e.message);
        }
      }
    } else {
      // Fallback: tạo tài khoản mặc định nếu chưa có sinh viên nào
      const defaults = [
        ['khoa_cntt', 'Ban Quản Lý Khoa CNTT', 'CNTT'],
        ['khoa_qtkd', 'Ban Quản Lý Khoa QTKD', 'QTKD'],
      ];
      for (const [username, hoten, mk] of defaults) {
        try {
          await conn.execute(
            `INSERT INTO users (username, password, hoten, email, role, makhoa, status)
             VALUES (?, '123456', ?, ?, 'khoa', ?, 'active')
             ON DUPLICATE KEY UPDATE makhoa = VALUES(makhoa), status = 'active'`,
            [username, hoten, `khoa.${mk.toLowerCase()}@hva.edu.vn`, mk]
          );
          console.log(`✅ Tài khoản mặc định: ${username} / 123456  (khoa: ${mk})`);
        } catch (e) {
          console.log(`⚠️  ${username}:`, e.message);
        }
      }
    }

    // ── 8. Hiển thị tổng kết ──────────────────────────────────────────────
    const [khoaUsers] = await conn.execute(
      "SELECT id, username, hoten, makhoa, status FROM users WHERE role = 'khoa' ORDER BY id"
    );
    console.log('\n📊 Danh sách tài khoản khoa hiện tại:');
    console.table(khoaUsers);

    console.log('\n🎉 Migration hoàn thành!');
  } finally {
    await conn.end();
  }
}

runMigration().catch((err) => {
  console.error('❌ Lỗi migration:', err.message);
  process.exit(1);
});
