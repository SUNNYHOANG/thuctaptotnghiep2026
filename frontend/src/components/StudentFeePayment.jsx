import React, { useEffect, useState } from 'react';
import './StudentFeePayment.css';
import { useAuth } from '../context/AuthContext';
import { feeAPIEndpoints } from '../api/feeAPI';

const StudentFeePayment = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUnpaid = async () => {
      if (!user?.mssv) {
        setError('Không tìm thấy mã số sinh viên.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const resp = await feeAPIEndpoints.getUnpaidEnrollments(user.mssv);
        const list = resp?.data || [];
        setItems(list);
        setSelected(list.map((i) => i.malophocphan)); // mặc định chọn tất cả
      } catch (err) {
        console.error(err);
        setError(err.message || 'Không thể tải danh sách học phần chưa thanh toán.');
      } finally {
        setLoading(false);
      }
    };

    fetchUnpaid();
  }, [user]);

  const toggleSelect = (malophocphan) => {
    setSelected((prev) =>
      prev.includes(malophocphan) ? prev.filter((id) => id !== malophocphan) : [...prev, malophocphan]
    );
  };

  const totalSelected = items
    .filter((i) => selected.includes(i.malophocphan))
    .reduce((sum, i) => sum + (Number(i.hocphi) || 0), 0);

  const totalDebt = items.reduce((sum, i) => sum + (Number(i.hocphi) || 0), 0);

  const handlePay = async () => {
    if (!user?.mssv || selected.length === 0) return;
    try {
      setPaying(true);
      setMessage('');
      const resp = await feeAPIEndpoints.pay(user.mssv, selected);
      const remainingDebt = resp?.data?.debt?.total ?? null;
      setItems((prev) => prev.filter((i) => !selected.includes(i.malophocphan)));
      setSelected([]);
      setMessage(
        `Thanh toán thành công ${
          totalSelected.toLocaleString('vi-VN')
        } VNĐ. Công nợ còn lại: ${
          remainingDebt != null ? remainingDebt.toLocaleString('vi-VN') : '0'
        } VNĐ.`
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Thanh toán thất bại.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="fee-payment-container">Đang tải danh sách học phần chưa thanh toán...</div>;
  }

  if (error) {
    return <div className="fee-payment-container">Lỗi: {error}</div>;
  }

  return (
    <div className="fee-payment-container">
      <h2>Thanh toán học phí trực tuyến</h2>
      <div className="fee-summary">
        <div>
          <b>Tổng công nợ hiện tại:</b> {totalDebt.toLocaleString('vi-VN')} VNĐ
        </div>
        <div>
          <b>Số tiền đã chọn thanh toán:</b> {totalSelected.toLocaleString('vi-VN')} VNĐ
        </div>
      </div>
      <div className="fee-items">
        <b>Các môn/chứng từ chưa thanh toán:</b>
        {items.length === 0 ? (
          <div>Chúc mừng, bạn không còn công nợ học phí nào.</div>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.malophocphan}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(item.malophocphan)}
                    onChange={() => toggleSelect(item.malophocphan)}
                  />
                  {' '}
                  {item.tenmonhoc} (Kỳ {item.mahocky}) -{' '}
                  {Number(item.hocphi || 0).toLocaleString('vi-VN')} VNĐ
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        className="pay-btn"
        onClick={handlePay}
        disabled={paying || selected.length === 0}
      >
        {paying ? 'Đang thanh toán...' : 'Thanh toán các môn đã chọn'}
      </button>
      {message && <div className="fee-success-msg">{message}</div>}
    </div>
  );
};

export default StudentFeePayment;
