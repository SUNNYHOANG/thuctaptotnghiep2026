import React, { useState } from 'react';
import './Dashboard.css';
import { attendanceAPIEndpoints } from '../api/attendanceAPI';

const AdminAttendance = () => {
  const [mssv, setMssv] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!mssv) {
      alert('Vui lòng nhập MSSV cần tra cứu.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setRecords([]);
      const resp = await attendanceAPIEndpoints.getByStudent(mssv.trim());
      setRecords(resp?.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Không thể tải lịch sử điểm danh.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📋 Lịch Sử Điểm Danh (Khuôn Mặt)</h1>
        <p className="welcome-text">
          Xem lịch sử điểm danh theo mã số sinh viên.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Mã sinh viên (MSSV):</span>
            <input
              type="text"
              value={mssv}
              onChange={(e) => setMssv(e.target.value)}
              placeholder="VD: 20123456"
              style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc', width: '100%' }}
            />
          </div>
        </div>
        <button
          className="action-btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Đang tải...' : 'Xem lịch sử điểm danh'}
        </button>
        {error && <div style={{ marginTop: 10, color: '#c62828' }}>Lỗi: {error}</div>}
      </div>

      <div className="card">
        <h2>Lịch sử điểm danh</h2>
        {records.length === 0 ? (
          <p>Chưa có bản ghi điểm danh nào cho MSSV này.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="courses-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>MSSV</th>
                  <th>Họ tên</th>
                  <th>Phương thức</th>
                  <th>Thời gian</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.mssv}</td>
                    <td>{r.hoten || '-'}</td>
                    <td>{r.method || '-'}</td>
                    <td>{new Date(r.time).toLocaleString('vi-VN')}</td>
                    <td>{r.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendance;

