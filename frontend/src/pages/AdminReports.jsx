import React, { useState, useEffect } from 'react';
import { lookupAPI } from '../api/api';

const AdminReports = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalEnrollments: 0
  });
  const [byLop, setByLop] = useState([]);
  const [byKhoa, setByKhoa] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statsRes, lopRes, khoaRes] = await Promise.all([
          lookupAPI.getAdminStats(),
          lookupAPI.getReportStats('malop'),
          lookupAPI.getReportStats('makhoa')
        ]);
        setStats(statsRes.data || {});
        setByLop(lopRes.data?.data || []);
        setByKhoa(khoaRes.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="admin-page">Đang tải...</div>;

  return (
    <div className="admin-page">
      <h2>📈 Báo Cáo & Thống Kê</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
          <h4>👥 Tổng Sinh Viên</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>{stats.totalStudents}</p>
        </div>
        <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
          <h4>👨‍🏫 Tổng Giảng Viên</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>{stats.totalTeachers}</p>
        </div>
        <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #27ae60' }}>
          <h4>📚 Tổng Môn Học</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>{stats.totalCourses}</p>
        </div>
        <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f39c12' }}>
          <h4>📋 Đăng Ký</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>{stats.totalEnrollments}</p>
        </div>
        <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #8e44ad' }}>
          <h4>👤 Tài Khoản (Staff)</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>{stats.totalUsers}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <h3>📊 Thống kê theo lớp</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Lớp</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Số SV</th>
              </tr>
            </thead>
            <tbody>
              {byLop.map((r) => (
                <tr key={r.name} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{r.name}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3>📊 Thống kê theo khoa</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Khoa</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Số SV</th>
              </tr>
            </thead>
            <tbody>
              {byKhoa.map((r) => (
                <tr key={r.name} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{r.name}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
