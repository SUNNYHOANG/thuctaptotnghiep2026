
import React, { useState, useEffect } from 'react';
import { adminAPIEndpoints } from '../api/adminAPI';

const statusLabels = {
  'cho': '🕒 Chờ duyệt',
  'dangxuly': '⏳ Đang xử lý',
  'duyet': '✅ Đã duyệt',
  'tuchoi': '❌ Từ chối',
};

const AdminServices = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPIEndpoints.getServices();
      // Nếu bị lỗi phân quyền hoặc không phải mảng
      if (response && response.error) {
        setError(response.error);
        setRequests([]);
        return;
      }
      const data = Array.isArray(response) ? response : (response.data || response || []);
      if (!Array.isArray(data)) {
        setError('Không lấy được dữ liệu hoặc chưa đăng nhập bằng tài khoản admin.');
        setRequests([]);
      } else {
        setRequests(data);
      }
    } catch (err) {
      setError('Lỗi kết nối hoặc không có quyền truy cập.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý duyệt/từ chối đơn
  const handleUpdateStatus = async (madon, newStatus) => {
    const ketqua = window.prompt('Nhập ghi chú/kết quả (có thể để trống):') || '';
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/dich-vu/${madon}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ trangthai: newStatus, ketqua })
      });
      fetchRequests();
    } catch (err) {
      alert('Lỗi khi cập nhật trạng thái!');
    }
  };

  // Hiển thị chi tiết đơn (modal đơn giản)
  const [detail, setDetail] = useState(null);

  return (
    <div className="admin-page">
      <h2>🛠️ Quản Lý Đơn Dịch Vụ Sinh Viên</h2>
      {loading ? <div>Đang tải...</div> : error ? (
        <div style={{ color: 'red', margin: 24, fontWeight: 'bold' }}>{error}</div>
      ) : (
        <div>
          <p>Tổng số đơn: {requests.length}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Mã Đơn</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>MSSV</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Họ Tên</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tên Dịch Vụ</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nội Dung</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Trạng Thái</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Ngày Gửi</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>Không có đơn nào</td></tr>
              ) : (
                requests.map((r, idx) => (
                  <tr key={r.madon || idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', cursor: 'pointer', color: '#007bff' }} onClick={() => setDetail(r)}>{r.madon}</td>
                    <td style={{ padding: '10px' }}>{r.mssv}</td>
                    <td style={{ padding: '10px' }}>{r.hoten || '-'}</td>
                    <td style={{ padding: '10px' }}>{r.tendichvu || '-'}</td>
                    <td style={{ padding: '10px' }}>{r.noidung_yeucau ? r.noidung_yeucau.substring(0, 50) : '-'}</td>
                    <td style={{ padding: '10px' }}>{statusLabels[r.trangthai] || r.trangthai}</td>
                    <td style={{ padding: '10px' }}>{r.ngaygui ? new Date(r.ngaygui).toLocaleString() : '-'}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {r.trangthai === 'cho' || r.trangthai === 'dangxuly' ? (
                        <>
                          <button style={{ marginRight: 8, background: '#4caf50', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4 }} onClick={() => handleUpdateStatus(r.madon, 'duyet')}>Đã xử lý</button>
                          <button style={{ background: '#f44336', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4 }} onClick={() => handleUpdateStatus(r.madon, 'tuchoi')}>Từ chối</button>
                        </>
                      ) : (
                        <span style={{ color: '#888' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Modal chi tiết đơn */}
          {detail && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000 }} onClick={() => setDetail(null)}>
              <div style={{ background: '#fff', maxWidth: 500, margin: '60px auto', padding: 24, borderRadius: 8, position: 'relative' }} onClick={e => e.stopPropagation()}>
                <h3>Chi Tiết Đơn #{detail.madon}</h3>
                <p><b>MSSV:</b> {detail.mssv}</p>
                <p><b>Họ tên:</b> {detail.hoten}</p>
                <p><b>Tên dịch vụ:</b> {detail.tendichvu}</p>
                <p><b>Nội dung yêu cầu:</b> {detail.noidung_yeucau}</p>
                <p><b>Trạng thái:</b> {statusLabels[detail.trangthai] || detail.trangthai}</p>
                <p><b>Kết quả:</b> {detail.ketqua || '-'}</p>
                <p><b>Ngày gửi:</b> {detail.ngaygui ? new Date(detail.ngaygui).toLocaleString() : '-'}</p>
                <p><b>Ngày duyệt:</b> {detail.ngayduyet ? new Date(detail.ngayduyet).toLocaleString() : '-'}</p>
                <button onClick={() => setDetail(null)} style={{ marginTop: 16 }}>Đóng</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminServices;
