import pool from '../config/database.js';

class FeePayment {
  static async ensureTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS hocphi_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        malophocphan INT NOT NULL,
        amount DECIMAL(12,0) NOT NULL,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_fee_enrollment (mssv, malophocphan),
        INDEX idx_mssv (mssv),
        INDEX idx_malophocphan (malophocphan),
        FOREIGN KEY (mssv) REFERENCES sinhvien(mssv) ON DELETE CASCADE,
        FOREIGN KEY (malophocphan) REFERENCES lophocphan(malophocphan) ON DELETE CASCADE
      )
    `);
  }

  static async getUnpaidEnrollments(mssv) {
    await this.ensureTable();
    const [rows] = await pool.execute(
      `SELECT 
         d.madangky,
         d.mssv,
         d.malophocphan,
         l.mahocky,
         l.lichhoc,
         l.maphong,
         m.tenmonhoc,
         m.sotinchi,
         m.hocphi
       FROM dangkyhocphan d
       JOIN lophocphan l ON d.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       LEFT JOIN hocphi_payments p 
         ON p.mssv = d.mssv AND p.malophocphan = d.malophocphan
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

  static async payForEnrollments(mssv, malophocphanList) {
    if (!Array.isArray(malophocphanList) || malophocphanList.length === 0) {
      return { totalPaid: 0 };
    }
    await this.ensureTable();

    const placeholders = malophocphanList.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT d.mssv, d.malophocphan, m.hocphi
       FROM dangkyhocphan d
       JOIN lophocphan l ON d.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE d.mssv = ?
         AND d.malophocphan IN (${placeholders})
         AND d.trangthai != 'huy'`,
      [mssv, ...malophocphanList]
    );

    let totalPaid = 0;
    for (const row of rows) {
      const amount = Number(row.hocphi) || 0;
      await pool.execute(
        `INSERT IGNORE INTO hocphi_payments (mssv, malophocphan, amount)
         VALUES (?, ?, ?)`,
        [row.mssv, row.malophocphan, amount]
      );
      totalPaid += amount;
    }

    return { totalPaid };
  }

  static async getReceiptsByStudent(mssv) {
    await this.ensureTable();
    const [rows] = await pool.execute(
      `SELECT 
         p.id,
         p.mssv,
         p.malophocphan,
         p.amount,
         p.paid_at,
         m.tenmonhoc,
         l.mahocky
       FROM hocphi_payments p
       JOIN lophocphan l ON p.malophocphan = l.malophocphan
       JOIN monhoc m ON l.mamonhoc = m.mamonhoc
       WHERE p.mssv = ?
       ORDER BY p.paid_at DESC`,
      [mssv]
    );
    return rows;
  }
}

export default FeePayment;

