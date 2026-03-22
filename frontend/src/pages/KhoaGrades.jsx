import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { gradeAPI, lookupAPI } from '../api/api';

const XEP_LOAI_COLOR = {
  'Xuất sắc': '#8e44ad',
  'Giỏi':     '#27ae60',
  'Khá':      '#2980b9',
  'Trung bình': '#e67e22',
  'Yếu':      '#e74c3c',
  'Chưa xếp loại': '#95a5a6',
};

const xepLoai = (diem) => {
  if (diem === null || diem === undefined) return 'Chưa xếp loại';
  if (diem >= 9) return 'Xuất sắc';
  if (diem >= 8) return 'Giỏi';
  if (diem >= 7) return 'Khá';
  if (diem >= 5) return 'Trung bình';
  return 'Yếu';
};

const Badge = ({ label, color }) => (
  <span style={{
    background: color + '20', color, border: `1px solid ${color}50`,
    borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600,
  }}>{label}</span>
);

const KhoaGrades = () => {
  const { user } = useAuth();
  const [hockyList, setHockyList] = useState([]);
  const [lopList, setLopList] = useState([]);
  const [grades, setGrades] = useState([]);
  const [mahocky, setMahocky] = useState('');
  const [malophocphan, setMalophocphan] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLop, setLoadingLop] = useState(false);
  const [error, setError] = useState('');

  // Load học kỳ
  useEffect(() => {
    lookupAPI.getHocKy().then(r => {
      const list = r.data || [];
      setHockyList(list);
      if (list.length) setMahocky(String(list[0].mahocky));
    }).catch(() => {});
  }, []);

  // Load lớp học phần theo khoa + học kỳ
  useEffect(() => {
    if (!mahocky) return;
    setLoadingLop(true);
    setMalophocphan('');
    setGrades([]);
    gradeAPI.getLopHocPhanByKhoa({ mahocky }).then(r => {
      setLopList(r.data || []);
    }).catch(() => setLopList([])).finally(() => setLoadingLop(false));
  }, [mahocky]);

  // Load điểm khi chọn lớp
  useEffect(() => {
    if (!malophocphan) { setGrades([]); return; }
    setLoading(true);
    setError('');
    gradeAPI.getByKhoa({ mahocky, malophocphan }).then(r => {
      setGrades(r.data || []);
    }).catch(e => {
      setError(e.response?.data?.error || 'Không thể tải dữ liệu điểm');
      setGrades([]);
    }).finally(() => setLoading(false));
  }, [malophocphan, mahocky]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grades;
    const q = search.toLowerCase();
    return grades.filter(g =>
      String(g.mssv).toLowerCase().includes(q) ||
      (g.hoten || '').toLowerCase().includes(q)
    );
  }, [grades, search]);

  // Thống kê tóm tắt
  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const withGpa = filtered.filter(g => g.gpa !== null && g.gpa !== undefined);
    const avgGpa = withGpa.length
      ? (withGpa.reduce((s, g) => s + Number(g.gpa), 0) / withGpa.length).toFixed(2)
      : null;
    const dist = {};
    filtered.forEach(g => {
      const xl = xepLoai(g.diemtongket);
      dist[xl] = (dist[xl] || 0) + 1;
    });
    return { total: filtered.length, avgGpa, dist };
  }, [filtered]);

  const selectedLop = lopList.find(l => String(l.malophocphan) === String(malophocphan));

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">📊 Xem Điểm Sinh Viên</h1>
          <p style={{ color: '#666', marginTop: 4, fontSize: 14 }}>
            Khoa: <strong>{user?.makhoa}</strong> — Chỉ xem, không chỉnh sửa
          </p>
        </div>

        {/* Bộ lọc */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Học kỳ</label>
            <select
              value={mahocky}
              onChange={e => setMahocky(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
            >
              <option value="">-- Chọn học kỳ --</option>
              {hockyList.map(hk => (
                <option key={hk.mahocky} value={hk.mahocky}>
                  {hk.tenhocky} ({hk.namhoc})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '2 1 280px' }}>
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>
              Lớp học phần {loadingLop && <span style={{ color: '#999' }}>đang tải...</span>}
            </label>
            <select
              value={malophocphan}
              onChange={e => setMalophocphan(e.target.value)}
              disabled={!mahocky || loadingLop}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
            >
              <option value="">-- Chọn lớp học phần --</option>
              {lopList.map(l => (
                <option key={l.malophocphan} value={l.malophocphan}>
                  {l.tenmonhoc} — {l.tengiaovien || 'Chưa phân công'} ({l.sosinhvien} SV)
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Tìm kiếm</label>
            <input
              type="text"
              placeholder="MSSV hoặc họ tên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Thông tin lớp đã chọn */}
        {selectedLop && (
          <div style={{ background: '#f0f7ff', border: '1px solid #bee3f8', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            <strong>{selectedLop.tenmonhoc}</strong> &nbsp;|&nbsp;
            {selectedLop.sotinchi} tín chỉ &nbsp;|&nbsp;
            GV: {selectedLop.tengiaovien || 'Chưa phân công'} &nbsp;|&nbsp;
            {selectedLop.tenhocky} ({selectedLop.namhoc}) &nbsp;|&nbsp;
            <span style={{ color: selectedLop.sodakhoa > 0 ? '#27ae60' : '#e67e22' }}>
              {selectedLop.sodakhoa}/{selectedLop.sosinhvien} đã khóa
            </span>
          </div>
        )}

        {/* Thống kê tóm tắt */}
        {stats && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 6, padding: '8px 16px', fontSize: 13 }}>
              Tổng SV: <strong>{stats.total}</strong>
            </div>
            {stats.avgGpa && (
              <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 6, padding: '8px 16px', fontSize: 13 }}>
                GPA TB: <strong style={{ color: '#2980b9' }}>{stats.avgGpa}</strong>
              </div>
            )}
            {Object.entries(stats.dist).map(([xl, count]) => (
              <div key={xl} style={{
                background: (XEP_LOAI_COLOR[xl] || '#95a5a6') + '15',
                border: `1px solid ${(XEP_LOAI_COLOR[xl] || '#95a5a6')}40`,
                borderRadius: 6, padding: '8px 16px', fontSize: 13,
                color: XEP_LOAI_COLOR[xl] || '#95a5a6',
              }}>
                {xl}: <strong>{count}</strong>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: 6, padding: '10px 14px', color: '#c0392b', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!malophocphan && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            Chọn học kỳ và lớp học phần để xem điểm
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>Đang tải...</div>
        )}

        {/* Bảng điểm */}
        {!loading && malophocphan && filtered.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['#', 'MSSV', 'Họ tên', 'Lớp', 'CC', 'GK', 'CK', 'Tổng kết', 'GPA', 'Xếp loại', 'Trạng thái', 'Cảnh báo'].map(h => (
                    <th key={h} style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap', fontWeight: 600, color: '#444' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => {
                  const xl = xepLoai(g.diemtongket);
                  const xlColor = XEP_LOAI_COLOR[xl] || '#95a5a6';
                  return (
                    <tr key={g.mabangdiem} style={{ borderBottom: '1px solid #f0f0f0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '8px', color: '#999' }}>{i + 1}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 600 }}>{g.mssv}</td>
                      <td style={{ padding: '8px' }}>{g.hoten}</td>
                      <td style={{ padding: '8px', color: '#666' }}>{g.malop || '—'}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{g.diemchuyencan ?? '—'}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{g.diemgiuaky ?? '—'}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{g.diemcuoiky ?? '—'}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>{g.diemtongket ?? '—'}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#2980b9' }}>{g.gpa ?? '—'}</td>
                      <td style={{ padding: '8px' }}><Badge label={xl} color={xlColor} /></td>
                      <td style={{ padding: '8px' }}>
                        <Badge
                          label={g.trangthai === 'dakhoa' ? '🔒 Đã khóa' : '✏️ Đang nhập'}
                          color={g.trangthai === 'dakhoa' ? '#27ae60' : '#e67e22'}
                        />
                      </td>
                      <td style={{ padding: '8px', color: '#e74c3c', fontSize: 12 }}>{g.canhbao || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && malophocphan && filtered.length === 0 && grades.length > 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#999' }}>
            Không tìm thấy sinh viên phù hợp
          </div>
        )}

        {!loading && malophocphan && grades.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#999' }}>
            Lớp học phần này chưa có dữ liệu điểm
          </div>
        )}
      </div>
    </div>
  );
};

export default KhoaGrades;
