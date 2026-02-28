import React, { useState, useEffect } from 'react';
import { adminAPIEndpoints } from '../api/adminAPI';

const AdminScores = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const response = await adminAPIEndpoints.getScores();
      setScores(response.data || []);
    } catch (err) {
      setError('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h2>📊 Quản Lý Điểm Rèn Luyện</h2>
      {loading ? <div>Đang tải...</div> : error ? <div style={{ color: 'red' }}>{error}</div> : (
        <div>
          <p>Tổng số điểm rèn luyện: {scores.length}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>MSSV</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Học Kỳ</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Điểm</th>
              </tr>
            </thead>
            <tbody>
              {scores.slice(0, 10).map((score, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{score.mssv}</td>
                  <td style={{ padding: '10px' }}>{score.mahocky || '-'}</td>
                  <td style={{ padding: '10px' }}>{score.diemrenluyen || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminScores;
