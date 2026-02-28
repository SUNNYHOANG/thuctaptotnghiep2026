import pool from '../config/database.js';

class FeePayment {
  static async ensureTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS hocphi_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        malophoc INT NOT NULL,
        amount DECIMAL(12,0) NOT NULL,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_fee_enrollment (mssv, malophoc),
        INDEX idx_mssv (mssv),
        INDEX idx_malophoc (malophoc)
      )
    `);
  }

  static async getUnpaidEnrollments(mssv) {
    await this.ensureTable();
    const [rows] = await pool.execute(
      `SELECT 
         d.madangky,
         d.mssv,
         d.malophoc,
         l.mahocky,
         l.lichhoc,
         l.maphong,
         m.tenmonhoc,
         m.sotinchi,
         m.hocphi
       FROM dsdangky d
       JOIN lophoc l ON d.malophoc = l.malophoc
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       LEFT JOIN hocphi_payments p 
         ON p.mssv = d.mssv AND p.malophoc = d.malophoc
       WHERE d.mssv = ? 
         AND d.trangthai != 'huy'
         AND p.id IS NULL
       ORDER BY l.mahocky DESC, m.tenmonhoc`,
      [mssv]
    );
    return rows;
  }

  static async getDebtByStudent(mssv) {
    const unpaid = await this.getUnpaidEnrollments(mssv);
    const grouped = unpaid.reduce((acc, item) => {
      const key = item.mahocky || 'Khac';
      if (!acc[key]) {
        acc[key] = {
          mahocky: item.mahocky,
          title: `Học phí kỳ ${item.mahocky}`,
          amount: 0
        };
      }
      acc[key].amount += Number(item.hocphi) || 0;
      return acc;
    }, {});
    const items = Object.values(grouped).filter((d) => d.amount > 0);
    const total = items.reduce((sum, d) => sum + d.amount, 0);
    return { total, items };
  }

  static async payForEnrollments(mssv, malophocList) {
    if (!Array.isArray(malophocList) || malophocList.length === 0) {
      return { totalPaid: 0 };
    }
    await this.ensureTable();

    // Lấy thông tin học phí cho các lớp học phần cần thanh toán
    const placeholders = malophocList.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT d.mssv, d.malophoc, m.hocphi
       FROM dsdangky d
       JOIN lophoc l ON d.malophoc = l.malophoc
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE d.mssv = ?
         AND d.malophoc IN (${placeholders})
         AND d.trangthai != 'huy'`,
      [mssv, ...malophocList]
    );

    let totalPaid = 0;
    for (const row of rows) {
      const amount = Number(row.hocphi) || 0;
      totalPaid += amount;
      await pool.execute(
        `INSERT IGNORE INTO hocphi_payments (mssv, malophoc, amount)
         VALUES (?, ?, ?)`,
        [row.mssv, row.malophoc, amount]
      );
    }

    return { totalPaid };
  }

  static async getReceiptsByStudent(mssv) {
    await this.ensureTable();
    const [rows] = await pool.execute(
      `SELECT 
         p.id,
         p.mssv,
         p.malophoc,
         p.amount,
         p.paid_at,
         m.tenmonhoc,
         l.mahocky
       FROM hocphi_payments p
       JOIN lophoc l ON p.malophoc = l.malophoc
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE p.mssv = ?
       ORDER BY p.paid_at DESC`,
      [mssv]
    );
    return rows;
  }
}

export default FeePayment;

