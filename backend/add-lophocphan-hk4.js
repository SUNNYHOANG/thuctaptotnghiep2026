/**
 * Script thêm lớp học phần cho học kỳ đang mở (mahocky = 4, HK2 2024-2025)
 * Usage: node add-lophocphan-hk4.js
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

  try {
    // Lấy học kỳ đang mở
    const [hkRows] = await conn.execute(
      "SELECT mahocky, tenhocky, namhoc FROM hocky WHERE trangthai = 'dangmo' ORDER BY mahocky DESC LIMIT 1"
    );
    if (!hkRows.length) {
      console.log('⚠️  Không có học kỳ nào đang mở. Hãy mở học kỳ trong Admin trước.');
      return;
    }
    const hk = hkRows[0];
    console.log(`📅 Học kỳ đang mở: ${hk.tenhocky} ${hk.namhoc} (mahocky=${hk.mahocky})`);

    // Lấy danh sách môn học
    const [monhocRows] = await conn.execute('SELECT mamonhoc, tenmonhoc, makhoa FROM monhoc ORDER BY mamonhoc');
    console.log(`📚 Tìm thấy ${monhocRows.length} môn học`);

    // Lấy danh sách giảng viên
    const [gvRows] = await conn.execute('SELECT magiaovien, hoten, makhoa FROM giangvien ORDER BY magiaovien');
    console.log(`👨‍🏫 Tìm thấy ${gvRows.length} giảng viên`);

    // Lấy phòng học
    const [phongRows] = await conn.execute('SELECT maphong FROM phonghoc LIMIT 3');

    // Kiểm tra lớp học phần đã tồn tại cho học kỳ này chưa
    const [existRows] = await conn.execute(
      'SELECT COUNT(*) as cnt FROM lophocphan WHERE mahocky = ?',
      [hk.mahocky]
    );
    if (existRows[0].cnt > 0) {
      console.log(`ℹ️  Đã có ${existRows[0].cnt} lớp học phần cho học kỳ này.`);
      const [existing] = await conn.execute(
        `SELECT lhp.malophocphan, m.tenmonhoc, gv.hoten AS tengv
         FROM lophocphan lhp
         JOIN monhoc m ON lhp.mamonhoc = m.mamonhoc
         LEFT JOIN giangvien gv ON lhp.magiaovien = gv.magiaovien
         WHERE lhp.mahocky = ?`,
        [hk.mahocky]
      );
      console.table(existing);
      console.log('Không cần thêm. Thoát.');
      return;
    }

    // Tạo lớp học phần: mỗi môn học 1 lớp, gán giảng viên cùng khoa
    const lichHoc = ['Thứ 2 - 7h30', 'Thứ 3 - 9h30', 'Thứ 4 - 13h30', 'Thứ 5 - 7h30', 'Thứ 6 - 9h30'];
    let created = 0;

    for (let i = 0; i < monhocRows.length; i++) {
      const mon = monhocRows[i];
      // Tìm giảng viên cùng khoa
      const gv = gvRows.find(g => g.makhoa === mon.makhoa) || gvRows[i % gvRows.length] || null;
      const phong = phongRows[i % phongRows.length]?.maphong || null;
      const lich = lichHoc[i % lichHoc.length];

      await conn.execute(
        `INSERT INTO lophocphan (mamonhoc, mahocky, magiaovien, maphong, lichhoc, sogiohoc, soluongtoida, trangthai)
         VALUES (?, ?, ?, ?, ?, 45, 60, 'dangmo')`,
        [mon.mamonhoc, hk.mahocky, gv?.magiaovien || null, phong, lich]
      );
      console.log(`✅ Tạo lớp: ${mon.tenmonhoc} | GV: ${gv?.hoten || 'Chưa phân công'} | ${lich}`);
      created++;
    }

    console.log(`\n🎉 Đã tạo ${created} lớp học phần cho ${hk.tenhocky} ${hk.namhoc}`);

    // Hiển thị kết quả
    const [result] = await conn.execute(
      `SELECT lhp.malophocphan, m.tenmonhoc, gv.hoten AS tengv, lhp.lichhoc
       FROM lophocphan lhp
       JOIN monhoc m ON lhp.mamonhoc = m.mamonhoc
       LEFT JOIN giangvien gv ON lhp.magiaovien = gv.magiaovien
       WHERE lhp.mahocky = ?`,
      [hk.mahocky]
    );
    console.table(result);

  } finally {
    await conn.end();
  }
}

run().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
