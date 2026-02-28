import express from 'express';
import FeePayment from '../models/FeePayment.js';

const router = express.Router();

// GET /api/fees/unpaid/:mssv - danh sách học phần chưa thanh toán
router.get('/unpaid/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const rows = await FeePayment.getUnpaidEnrollments(mssv);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fees/debt/:mssv - tổng công nợ theo học kỳ
router.get('/debt/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const debt = await FeePayment.getDebtByStudent(mssv);
    res.json(debt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees/pay - thanh toán danh sách lớp học phần
router.post('/pay', async (req, res) => {
  try {
    const { mssv, malophocList } = req.body;
    if (!mssv || !Array.isArray(malophocList) || malophocList.length === 0) {
      return res.status(400).json({ error: 'Thiếu dữ liệu thanh toán' });
    }
    const result = await FeePayment.payForEnrollments(mssv, malophocList);
    const debt = await FeePayment.getDebtByStudent(mssv);
    res.json({ ...result, debt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fees/receipts/:mssv - danh sách phiếu thu học phí
router.get('/receipts/:mssv', async (req, res) => {
  try {
    const { mssv } = req.params;
    const rows = await FeePayment.getReceiptsByStudent(mssv);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

