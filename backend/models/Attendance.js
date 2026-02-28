import pool from '../config/database.js';

class Attendance {
  static async ensureTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        hoten VARCHAR(255),
        method VARCHAR(20) DEFAULT 'face',
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        note VARCHAR(255),
        INDEX idx_mssv (mssv),
        INDEX idx_time (time)
      )
    `);
  }

  static async mark({ mssv, hoten, method = 'face', note = null, time = null }) {
    await this.ensureTable();
    const [result] = await pool.execute(
      `INSERT INTO attendance (mssv, hoten, method, time, note)
       VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)`,
      [mssv, hoten || null, method, time, note]
    );
    const [rows] = await pool.execute(
      'SELECT * FROM attendance WHERE id = ?',
      [result.insertId]
    );
    return rows[0];
  }

  static async getByStudent(mssv) {
    await this.ensureTable();
    const [rows] = await pool.execute(
      `SELECT * FROM attendance
       WHERE mssv = ?
       ORDER BY time DESC`,
      [mssv]
    );
    return rows;
  }
}

export default Attendance;

