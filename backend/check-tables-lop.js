import pool from './config/database.js';
const [tables] = await pool.execute('SHOW TABLES');
const names = tables.map(t => Object.values(t)[0]);
console.log('Tất cả bảng:', names);
console.log('Bảng liên quan lop/khoa:', names.filter(t => t.includes('lop') || t.includes('khoa')));
process.exit(0);
