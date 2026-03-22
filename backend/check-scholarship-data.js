import pool from './config/database.js';

// Kiểm tra dữ liệu liên quan học bổng HK1 2023-2024 (mahocky=1)
const mahocky = 1;

console.log('=== bangdiem (dakhoa) ===');
const [bd] = await pool.execute(
  `SELECT b.mssv, b.gpa, b.trangthai, l.mahocky
   FROM bangdiem b JOIN lophocphan l ON b.malophocphan = l.malophocphan
   WHERE l.mahocky = ?`, [mahocky]
);
console.table(bd);

console.log('=== diemrenluyen ===');
const [drl] = await pool.execute(
  `SELECT mssv, diemtong, mahocky FROM diemrenluyen WHERE mahocky = ?`, [mahocky]
);
console.table(drl);

console.log('=== sinhvien_hocbong ===');
const [shb] = await pool.execute(
  `SELECT sh.mssv, sh.trangthai, sh.mucxeploai, hb.mahocky
   FROM sinhvien_hocbong sh JOIN hocbong hb ON sh.mahocbong = hb.mahocbong
   WHERE hb.mahocky = ?`, [mahocky]
);
console.table(shb);

console.log('=== sinhvien + lophanhchinh + khoa ===');
const [sv] = await pool.execute(
  `SELECT sv.mssv, sv.hoten, sv.malop, l.makhoa
   FROM sinhvien sv LEFT JOIN lophanhchinh l ON sv.malop = l.malop LIMIT 10`
);
console.table(sv);

process.exit(0);
