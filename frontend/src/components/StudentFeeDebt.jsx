import React, { useEffect, useState } from 'react';
import './StudentFeeDebt.css';
import { useAuth } from '../context/AuthContext';
import { feeAPIEndpoints } from '../api/feeAPI';

const StudentFeeDebt = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    const fetchDebt = async () => {
      if (!user?.mssv) {
        setError('Không tìm thấy mã số sinh viên.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const resp = await feeAPIEndpoints.getDebt(user.mssv);
        const data = resp?.data || { items: [], total: 0 };
        setDebts(data.items || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Không thể tải công nợ.');
      } finally {
        setLoading(false);
      }
    };

    fetchDebt();
  }, [user]);

  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);

  if (loading) {
    return <div className="fee-debt-container">Đang tải công nợ...</div>;
  }

  if (error) {
    return <div className="fee-debt-container">Lỗi: {error}</div>;
  }

  return (
    <div className="fee-debt-container">
      <h2>Tra cứu công nợ học phí</h2>
      <div className="fee-debt-summary">
        <div>
          <b>Tổng nợ (chưa đóng):</b> {totalDebt.toLocaleString('vi-VN')} VNĐ
        </div>
      </div>
      <div className="fee-debt-details">
        <b>Chi tiết công nợ theo học kỳ:</b>
        {debts.length === 0 ? (
          <div>Hiện tại bạn không có công nợ học phí nào.</div>
        ) : (
          <ul>
            {debts.map((item, idx) => (
              <li key={idx} className="debt-unpaid">
                {item.title}: {item.amount.toLocaleString('vi-VN')} VNĐ{' '}
                <span>Chưa đóng</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudentFeeDebt;
