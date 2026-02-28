import React, { useState, useEffect } from 'react';
import { adminAPIEndpoints } from '../api/adminAPI';

const AdminRewards = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await adminAPIEndpoints.getRewards();
      setRewards(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h2>⭐ Quản Lý Khen Thưởng & Kỷ Luật</h2>
      {loading ? <div>Đang tải...</div> : (
        <div>
          <p>Tổng số bản ghi: {rewards.length}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Sinh Viên</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Loại</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nội Dung</th>
              </tr>
            </thead>
            <tbody>
              {rewards.slice(0, 10).map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{r.mssv || '-'}</td>
                  <td style={{ padding: '10px' }}>{r.loai || '-'}</td>
                  <td style={{ padding: '10px' }}>{r.noidung ? r.noidung.substring(0, 50) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRewards;
