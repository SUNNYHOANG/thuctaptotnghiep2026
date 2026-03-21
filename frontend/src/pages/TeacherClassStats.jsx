import React, { useState, useEffect } from 'react';
import { lookupAPI } from '../api/api';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const XEPLOAI = [
  { label: 'Xuất sắc', min: 3.6, color: '#15803d', bg: '#dcfce7' },
  { label: 'Tốt', min: 3.2, color: '#2563eb', bg: '#dbeafe' },
  { label: 'Khá', min: 2.8, color: '#d97706', bg: '#fef3c7' },
  { label: 'Trung bình', min: 2.4, color: '#ea580c', bg: '#ffedd5' },
  { label: 'Yếu', min: 2.0, color: '#dc2626', bg: '#fee2e2' },
  { label: 'Kém', min: 0, color: '#7c3aed', bg: '#ede9fe' },
];

function getXepLoai(gpa) {
  if (gpa == null) return null;
  const g = Number(gpa);
  if (g >= 3.6) return 'Xuất sắc';
  if (g >= 3.2) return 'Tốt';
  if (g >= 2.8) return 'Khá';
  if (g >= 2.4) return 'Trung bình';
  if (g >= 2.0) return 'Yếu';
  return 'Kém';
}

const TeacherClassStats = () => {
  const { user } = useAuth();
  const [hockyList, setHockyList] = useState([]);
  const [lopList, setLopList] = useState([]);
  const [filterHocky, setFilterHocky] = useState('');
  const [filterLop, setFilterLop] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    lookupAPI.getHocKy().then((r) => setHockyList(r.data || [])).catch(() => {});
    const makhoa = user?.makhoa;
    lookupAPI.getLopByKhoa(makhoa).then((r) => setLopList(r.data?.data || r.data || [])).catch(() => {});
  }, [user]);

  const loadStats = async () => {
    if (!filterLop) { setMessage('Vui lòng chọn lớp'); return; }
    setLoading(true);
    setMessage('');
    try {
      // Lấy danh sách sinh viên trong lớp
      const svRes = await lookupAPI.getStudentsByClass(filterLop);
      const students = svRes.data?.data || svRes.data || [];

      // Lấy điểm từng sinh viên
      const gradePromises = students.map(async (sv) => {
        try {
          const params = filterHocky ? `?mahocky=${filterHocky}` : '';
          const res = await api.get(`/grades/student/${sv.mssv}${params}`);
          return { sv, grades: res.data || [] };
        } catch {
          return { sv, grades: [] };
        }
      });
      const results = await Promise.all(gradePromises);

      // Tổng hợp: mỗi SV lấy GPA trung bình
      const processed = results.map(({ sv, grades: g }) => {
        const validGrades = g.filter((x) => x.gpa != null);
        const avgGpa = validGrades.length > 0
          ? validGrades.reduce((s, x) => s + Number(x.gpa), 0) / validGrades.length
          : null;
        return {
          mssv: sv.mssv,
          hoten: sv.hoten,
          malop: sv.malop,
          soMonHoc: g.length,
          avgGpa: avgGpa != null ? avgGpa.toFixed(2) : null,
          xeploai: getXepLoai(avgGpa),
          grades: g,
        };
      });
      setGrades(processed);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Thống kê tổng hợp
  const stats = React.useMemo(() => {
    const total = grades.length;
    const withGpa = grades.filter((g) => g.avgGpa != null);
    const sumGpa = withGpa.reduce((s, g) => s + Number(g.avgGpa), 0);
    const avg = withGpa.length > 0 ? (sumGpa / withGpa.length).toFixed(2) : '—';
    const counts = {};
    XEPLOAI.forEach((x) => { counts[x.label] = 0; });
    grades.forEach((g) => { if (g.xeploai) counts[g.xeploai] = (counts[g.xeploai] || 0) + 1; });
    return { total, avg, counts };
  }, [grades]);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">📊 Thống Kê Điểm Theo Lớp</h1>
          <p style={{ color: '#666', marginTop: 4, marginBottom: 12 }}>
            Xem tổng hợp kết quả học tập của sinh viên trong lớp
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Học kỳ</label>
              <select className="form-control" style={{ width: 200 }} value={filterHocky} onChange={(e) => setFilterHocky(e.target.value)}>
                <option value="">Tất cả học kỳ</option>
                {hockyList.map((h) => (
                  <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} - {h.namhoc}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Lớp *</label>
              <select className="form-control" style={{ width: 160 }} value={filterLop} onChange={(e) => setFilterLop(e.target.value)}>
                <option value="">-- Chọn lớp --</option>
                {(Array.isArray(lopList) ? lopList : []).map((l) => {
                  const val = typeof l === 'object' ? l.malop : l;
                  const label = typeof l === 'object' ? (l.tenlop || l.malop) : l;
                  return <option key={val} value={val}>{label}</option>;
                })}
              </select>
            </div>
            <button className="btn btn-primary" onClick={loadStats} disabled={loading}>
              {loading ? 'Đang tải...' : '🔍 Xem thống kê'}
            </button>
          </div>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        {grades.length > 0 && (
          <>
            {/* Tổng quan */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 0', borderBottom: '1px solid #e5e7eb', marginBottom: 12 }}>
              <StatCard label="Tổng sinh viên" value={stats.total} color="#374151" />
              <StatCard label="GPA trung bình" value={stats.avg} color="#2563eb" />
              {XEPLOAI.map((x) => (
                <StatCard key={x.label} label={x.label} value={stats.counts[x.label] || 0} color={x.color} bg={x.bg} />
              ))}
            </div>

            {/* Biểu đồ tỉ lệ */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
                {XEPLOAI.map((x) => {
                  const count = stats.counts[x.label] || 0;
                  const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0;
                  if (pct == 0) return null;
                  return (
                    <div key={x.label} style={{ flex: count, background: x.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }} title={`${x.label}: ${count} SV (${pct}%)`}>
                      {pct}%
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bảng chi tiết */}
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>MSSV</th>
                    <th>Họ tên</th>
                    <th style={{ textAlign: 'center' }}>Số môn</th>
                    <th style={{ textAlign: 'center' }}>GPA TB</th>
                    <th style={{ textAlign: 'center' }}>Xếp loại</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.sort((a, b) => (b.avgGpa || 0) - (a.avgGpa || 0)).map((g) => {
                    const xl = XEPLOAI.find((x) => x.label === g.xeploai);
                    return (
                      <tr key={g.mssv}>
                        <td>{g.mssv}</td>
                        <td>{g.hoten}</td>
                        <td style={{ textAlign: 'center' }}>{g.soMonHoc}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{g.avgGpa ?? '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {xl ? (
                            <span style={{ background: xl.bg, color: xl.color, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                              {g.xeploai}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {grades.length === 0 && !loading && filterLop && (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
            Không có dữ liệu điểm cho lớp này
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, bg }) => (
  <div style={{ background: bg || '#f9fafb', border: `1px solid ${color}33`, borderRadius: 8, padding: '8px 16px', minWidth: 110, textAlign: 'center' }}>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
  </div>
);

export default TeacherClassStats;
