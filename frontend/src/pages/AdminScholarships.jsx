import React, { useState, useEffect } from 'react';
import { adminAPIEndpoints } from '../api/adminAPI';

const AdminScholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      const response = await adminAPIEndpoints.getScholarships();
      setScholarships(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h2>🏆 Quản Lý Học Bổng</h2>
      {loading ? <div>Đang tải...</div> : (
        <div>
          <p>Tổng số học bổng: {scholarships.length}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tên Học Bổng</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Sinh Viên</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {scholarships.slice(0, 10).map((s, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{s.tenhocbong || '-'}</td>
                  <td style={{ padding: '10px' }}>{s.mssv || '-'}</td>
                  <td style={{ padding: '10px' }}>{s.trangthai || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminScholarships;
