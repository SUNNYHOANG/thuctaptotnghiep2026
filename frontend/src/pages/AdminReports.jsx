import React, { useState, useEffect } from 'react';
import { lookupAPI } from '../api/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const AdminReports = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalEnrollments: 0
  });
  const [advanced, setAdvanced] = useState(null);
  const [byLop, setByLop] = useState([]);
  const [byKhoa, setByKhoa] = useState([]);
  const [hockyList, setHockyList] = useState([]);
  const [mahocky, setMahocky] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lookupAPI.getHocKy().then((r) => setHockyList(r.data || []));
  }, []);

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
        setByLop(lopRes.data?.data || lopRes.data || []);
        setByKhoa(khoaRes.data?.data || khoaRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    lookupAPI.getReportAdvanced(mahocky || undefined)
      .then((r) => setAdvanced(r.data))
      .catch(() => setAdvanced(null));
  }, [mahocky]);

  const handleExport = async () => {
    try {
      const rows = [
        ['Chỉ số', 'Giá trị'],
        ['Tổng sinh viên', stats.totalStudents],
        ['Tổng giảng viên', stats.totalTeachers],
        ['Tổng môn học', stats.totalCourses],
        ['Đăng ký', stats.totalEnrollments],
        ['SV đạt học bổng', advanced?.hocbongDat ?? '-'],
        ['DRL - Đạt (%)', `${advanced?.drlDatPercent ?? 0}%`],
        ['DRL - Rớt (%)', `${advanced?.drlRotPercent ?? 0}%`],
        ['GPA cao nhất', advanced?.maxGPA ?? '-'],
      ];
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao_cao_thong_ke_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Xuất file thất bại.');
    }
  };

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

      <div style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>Học kỳ:</label>
        <select value={mahocky} onChange={(e) => setMahocky(e.target.value)} style={{ padding: 8 }}>
          <option value="">Tất cả</option>
          {hockyList.map((h) => (
            <option key={h.mahocky} value={h.mahocky}>{h.tenhocky}</option>
          ))}
        </select>
        <button onClick={handleExport} style={{ background: '#27ae60', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          📥 Xuất CSV
        </button>
      </div>

      {advanced && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 30 }}>
          <div style={{ background: '#e8f5e9', padding: 20, borderRadius: 8, borderLeft: '4px solid #4caf50' }}>
            <h4>🎓 SV đạt học bổng</h4>
            <p style={{ fontSize: 24, fontWeight: 'bold', margin: '10px 0' }}>{advanced.hocbongDat}</p>
          </div>
          <div style={{ background: '#e8f5e9', padding: 20, borderRadius: 8, borderLeft: '4px solid #4caf50' }}>
            <h4>✅ DRL Đạt</h4>
            <p style={{ fontSize: 24, fontWeight: 'bold', margin: '10px 0' }}>{advanced.drlDatPercent}%</p>
            <small>{advanced.drlDat} / {advanced.drlTotal}</small>
          </div>
          <div style={{ background: '#ffebee', padding: 20, borderRadius: 8, borderLeft: '4px solid #f44336' }}>
            <h4>❌ DRL Rớt</h4>
            <p style={{ fontSize: 24, fontWeight: 'bold', margin: '10px 0' }}>{advanced.drlRotPercent}%</p>
            <small>{advanced.drlRot} / {advanced.drlTotal}</small>
          </div>
          <div style={{ background: '#e3f2fd', padding: 20, borderRadius: 8, borderLeft: '4px solid #2196f3' }}>
            <h4>📊 GPA cao nhất</h4>
            <p style={{ fontSize: 24, fontWeight: 'bold', margin: '10px 0' }}>{advanced.maxGPA ?? '—'}</p>
          </div>
        </div>
      )}

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
