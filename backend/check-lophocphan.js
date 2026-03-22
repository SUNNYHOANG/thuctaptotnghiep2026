/**
 * Kiểm tra dữ liệu lophocphan trong DB
 * Usage: node check-lophocphan.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dkhp1',
};

async function run() {
  const conn = await mysql.createConnection(config);
  console.log('✅ Kết nối DB:', config.database);

  // 1. Tổng số lớp học phần theo học kỳ
  console.log('\n📊 Số lớp học phần theo học kỳ:');
  const [byHK] = await conn.execute(`
    SELECT h.mahocky, h.tenhocky, h.namhoc, h.trangthai, COUNT(*) as solop
    FROM lophocphan lhp
    JOIN hocky h ON lhp.mahocky = h.mahocky
    GROUP BY h.mahocky
    ORDER BY h.mahocky
  `);
  console.table(byHK);

  // 2. Lớp học phần của từng giảng viên
  console.log('\n👨‍🏫 Lớp học phần theo giảng viên:');
  const [byGV] = await conn.execute(`
    SELECT gv.magiaovien, gv.hoten, h.tenhocky, h.namhoc,
           COUNT(*) as solop,
           GROUP_CONCAT(m.tenmonhoc ORDER BY m.tenmonhoc SEPARATOR ', ') as monhoc
    FROM lophocphan lhp
    JOIN giangvien gv ON lhp.magiaovien = gv.magiaovien
    JOIN monhoc m ON lhp.mamonhoc = m.mamonhoc
    JOIN hocky h ON lhp.mahocky = h.mahocky
    GROUP BY gv.magiaovien, h.mahocky
    ORDER BY gv.magiaovien, h.mahocky
  `);
  console.table(byGV);

  // 3. Kiểm tra duplicate: cùng môn + cùng giảng viên + cùng học kỳ
  console.log('\n⚠️  Kiểm tra duplicate (cùng môn + GV + học kỳ):');
  const [dups] = await conn.execute(`
    SELECT lhp.mamonhoc, m.tenmonhoc, lhp.magiaovien, gv.hoten,
           lhp.mahocky, h.tenhocky, COUNT(*) as soban
    FROM lophocphan lhp
    JOIN monhoc m ON lhp.mamonhoc = m.mamonhoc
    JOIN giangvien gv ON lhp.magiaovien = gv.magiaovien
    JOIN hocky h ON lhp.mahocky = h.mahocky
    GROUP BY lhp.mamonhoc, lhp.magiaovien, lhp.mahocky
    HAVING soban > 1
    ORDER BY soban DESC
  `);
  if (dups.length === 0) {
    console.log('✅ Không có duplicate');
  } else {
    console.log(`❌ Có ${dups.length} nhóm bị duplicate:`);
    console.table(dups);
  }

  // 4. Chi tiết tất cả lớp của giảng viên có nhiều lớp nhất
  console.log('\n📋 Chi tiết lớp học phần (tất cả):');
  const [all] = await conn.execute(`
    SELECT lhp.malophocphan, m.tenmonhoc, gv.hoten AS tengv,
           h.tenhocky, h.namhoc, h.trangthai AS trangthai_hk,
           lhp.trangthai, lhp.lichhoc
    FROM lophocphan lhp
    JOIN monhoc m ON lhp.mamonhoc = m.mamonhoc
    LEFT JOIN giangvien gv ON lhp.magiaovien = gv.magiaovien
    JOIN hocky h ON lhp.mahocky = h.mahocky
    ORDER BY gv.hoten, h.mahocky, m.tenmonhoc, lhp.malophocphan
  `);
  console.table(all);

  await conn.end();
}

run().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
