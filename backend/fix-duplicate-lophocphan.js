/**
 * Xóa lớp học phần bị duplicate (cùng môn + GV + học kỳ)
 * Giữ lại bản có malophocphan nhỏ nhất, xóa các bản còn lại
 * Usage: node fix-duplicate-lophocphan.js
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

  // Tìm các nhóm duplicate
  const [dups] = await conn.execute(`
    SELECT mamonhoc, magiaovien, mahocky,
           MIN(malophocphan) AS keep_id,
           COUNT(*) AS soban
    FROM lophocphan
    GROUP BY mamonhoc, magiaovien, mahocky
    HAVING soban > 1
  `);

  if (dups.length === 0) {
    console.log('✅ Không có duplicate, không cần xóa.');
    await conn.end();
    return;
  }

  console.log(`⚠️  Tìm thấy ${dups.length} nhóm duplicate:`);
  console.table(dups);

  let totalDeleted = 0;

  for (const dup of dups) {
    // Lấy danh sách các ID cần xóa (không phải keep_id)
    const [toDelete] = await conn.execute(
      `SELECT malophocphan FROM lophocphan
       WHERE mamonhoc = ? AND magiaovien = ? AND mahocky = ?
         AND malophocphan != ?`,
      [dup.mamonhoc, dup.magiaovien, dup.mahocky, dup.keep_id]
    );

    for (const row of toDelete) {
      // Kiểm tra có bangdiem nào không
      const [bd] = await conn.execute(
        'SELECT COUNT(*) as cnt FROM bangdiem WHERE malophocphan = ?',
        [row.malophocphan]
      );
      if (bd[0].cnt > 0) {
        // Chuyển bangdiem sang lớp giữ lại
        await conn.execute(
          'UPDATE bangdiem SET malophocphan = ? WHERE malophocphan = ?',
          [dup.keep_id, row.malophocphan]
        );
        console.log(`  ↪ Chuyển ${bd[0].cnt} bangdiem từ lớp ${row.malophocphan} → ${dup.keep_id}`);
      }

      // Xóa lớp duplicate
      await conn.execute('DELETE FROM lophocphan WHERE malophocphan = ?', [row.malophocphan]);
      console.log(`  🗑  Xóa lớp ${row.malophocphan}`);
      totalDeleted++;
    }
  }

  console.log(`\n✅ Đã xóa ${totalDeleted} lớp học phần duplicate.`);

  // Hiển thị kết quả sau khi dọn
  const [result] = await conn.execute(`
    SELECT lhp.malophocphan, m.tenmonhoc, gv.hoten AS tengv,
           h.tenhocky, h.namhoc, lhp.trangthai
    FROM lophocphan lhp
    JOIN monhoc m ON lhp.mamonhoc = m.mamonhoc
    LEFT JOIN giangvien gv ON lhp.magiaovien = gv.magiaovien
    JOIN hocky h ON lhp.mahocky = h.mahocky
    ORDER BY gv.hoten, h.mahocky, m.tenmonhoc
  `);
  console.log('\n📋 Lớp học phần sau khi dọn:');
  console.table(result);

  await conn.end();
}

run().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
