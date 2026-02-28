import React, { useEffect, useState } from 'react';
import './StudentFeeReceipt.css';
import { useAuth } from '../context/AuthContext';
import { feeAPIEndpoints } from '../api/feeAPI';

const StudentFeeReceipt = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    const fetchReceipts = async () => {
      if (!user?.mssv) {
        setError('Không tìm thấy mã số sinh viên.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const resp = await feeAPIEndpoints.getReceipts(user.mssv);
        setReceipts(resp?.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Không thể tải phiếu thu.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [user]);

  if (loading) {
    return <div className="fee-receipt-container">Đang tải phiếu thu...</div>;
  }

  if (error) {
    return <div className="fee-receipt-container">Lỗi: {error}</div>;
  }

  // Gộp các dòng theo thời điểm thanh toán để thành 1 phiếu thu (nhiều môn)
  const grouped = receipts.reduce((acc, r) => {
    const key = r.paid_at;
    if (!acc[key]) {
      acc[key] = {
        id: r.id,
        paid_at: r.paid_at,
        total: 0,
        items: [],
      };
    }
    const amount = Number(r.amount || 0);
    acc[key].total += amount;
    acc[key].items.push({
      tenmonhoc: r.tenmonhoc,
      mahocky: r.mahocky,
      amount,
    });
    return acc;
  }, {});

  const groupedReceipts = Object.values(grouped);

  return (
    <div className="fee-receipt-container">
      <h2>Phiếu thu học phí trực tuyến</h2>
      {groupedReceipts.length === 0 ? (
        <div>Chưa có phiếu thu nào.</div>
      ) : (
        groupedReceipts.map((g) => (
          <div className="fee-receipt-card" key={g.paid_at}>
            <div><b>Mã phiếu:</b> PT{String(g.id).padStart(6, '0')}</div>
            <div><b>Ngày:</b> {new Date(g.paid_at).toLocaleString('vi-VN')}</div>
            <div><b>Số tiền:</b> {g.total.toLocaleString('vi-VN')} VNĐ</div>
            <div><b>Phương thức:</b> Online</div>
            <div>
              <b>Trạng thái:</b>{' '}
              <span className="receipt-paid">Đã thanh toán</span>
            </div>
            <div className="fee-receipt-details">
              <b>Chi tiết các môn đã thanh toán:</b>
              <ul>
                {g.items.map((item, idx) => (
                  <li key={idx}>
                    {item.tenmonhoc} (Kỳ {item.mahocky}) -{' '}
                    {item.amount.toLocaleString('vi-VN')} VNĐ
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default StudentFeeReceipt;
