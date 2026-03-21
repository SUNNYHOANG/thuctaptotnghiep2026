import React, { useState, useEffect } from 'react';
import { drlSelfAPI, lookupAPI } from '../api/api';

const XEPLOAI = [
  { label: 'Xuất sắc', min: 90, color: '#15803d', bg: '#dcfce7' },
  { label: 'Tốt', min: 80, color: '#2563eb', bg: '#dbeafe' },
  { label: 'Khá', min: 65, color: '#d97706', bg: '#fef3c7' },
  { label: 'Trung bình', min: 50, color: '#ea580c', bg: '#ffedd5' },
  { label: 'Yếu', min: 35, color: '#dc2626', bg: '#fee2e2' },
  { label: 'Kém', min: 0, color: '#7c3aed', bg: '#ede9fe' },
];

function xepLoai(diem) {
  if (diem == null) return null;
  const d = Number(diem);
  if (d >= 90) return 'Xuất sắc';
  if (d >= 80) return 'Tốt';
  if (d >= 65) return 'Khá';
  if (d >= 50) return 'Trung bình';
  if (d >= 35) return 'Yếu';
  return 'Kém';
}

const CTSVDrlStats = () => {
  const [hockyList, setHockyList] = useState([]);
  const [khoaList, setKhoaList] = useState([]);
  const [filterHocky, setFilterHocky] = useState('');
  const [filterKhoa, setFilterKhoa] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    lookupAPI.getHocKy().then((r) => setHockyList(r.data || [])).catch(() => {});
    drlSelfAPI.getKhoaList().then((r) => setKhoaList(r.data || [])).catch(() => {});
  }, []);

  const loadStats = async () => {
    if (!filterHocky) { setMessage('Vui lòng chọn học kỳ'); return; }
    setLoading(true);
    setMessage('');
    try {
      const params = { mahocky: filterHocky, trangthai: 'daduyet' };
      if (filterKhoa) params.makhoa = filterKhoa;
      const res = await drlSelfAPI.manage(params);
      setRows(res.data || []);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Tính thống kê theo xếp loại
  const stats = React.useMemo(() => {
    const total = rows.length;
    const counts = {};
    XEPLOAI.forEach((x) => { counts[x.label] = 0; });
    let sumDiem = 0;
    rows.forEach((r) => {
      const diem = r.diem_ctsv ?? r.tong_diem;
      const loai = xepLoai(diem);
      if (loai) counts[loai] = (counts[loai] || 0) + 1;
      if (diem != null) sumDiem += Number(diem);
    });
    const avg = total > 0 ? (sumDiem / total).toFixed(1) : '—';
    return { total, counts, avg };
  }, [rows]);

  // Thống kê theo khoa
  const byKhoa = React.useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const k = r.makhoa || 'Không rõ';
      if (!map[k]) map[k] = { makhoa: k, total: 0, sumDiem: 0, counts: {} };
      map[k].total++;
      const diem = r.diem_ctsv ?? r.tong_diem;
      if (diem != null) map[k].sumDiem += Number(diem);
      const loai = xepLoai(diem);
      if (loai) map[k].counts[loai] = (map[k].counts[loai] || 0) + 1;
    });
    return Object.values(map).sort((a, b) => a.makhoa.localeCompare(b.makhoa));
  }, [rows]);

  // Thống kê theo lớp
  const byLop = React.useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const k = r.malop || 'Không rõ';
      if (!map[k]) map[k] = { malop: k, makhoa: r.makhoa, total: 0, sumDiem: 0, counts: {} };
      map[k].total++;
      const diem = r.diem_ctsv ?? r.tong_diem;
      if (diem != null) map[k].sumDiem += Number(diem);
      const loai = xepLoai(diem);
      if (loai) map[k].counts[loai] = (map[k].counts[loai] || 0) + 1;
    });
    return Object.values(map).sort((a, b) => a.malop.localeCompare(b.malop));
  }, [rows]);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">📈 Thống Kê Tổng Hợp DRL</h1>
          <p style={{ color: '#666', marginTop: 4, marginBottom: 12 }}>
            Thống kê phân loại điểm rèn luyện đã chốt chính thức theo học kỳ
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Học kỳ *</label>
              <select className="form-control" style={{ width: 200 }} value={filterHocky} onChange={(e) => setFilterHocky(e.target.value)}>
                <option value="">-- Chọn học kỳ --</option>
                {hockyList.map((h) => (
                  <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} - {h.namhoc}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Khoa</label>
              <select className="form-control" style={{ width: 160 }} value={filterKhoa} onChange={(e) => setFilterKhoa(e.target.value)}>
                <option value="">Tất cả khoa</option>
                {khoaList.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={loadStats} disabled={loading}>
              {loading ? 'Đang tải...' : '📊 Xem thống kê'}
            </button>
          </div>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        {rows.length > 0 && (
          <>
            {/* Tổng quan */}
            <div style={{ padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ marginBottom: 12 }}>Tổng quan</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <StatCard label="Tổng sinh viên đã chốt" value={stats.total} color="#374151" />
                <StatCard label="Điểm trung bình" value={stats.avg} color="#2563eb" />
                {XEPLOAI.map((x) => (
                  <StatCard key={x.label} label={x.label} value={stats.counts[x.label] || 0} color={x.color} bg={x.bg} />
                ))}
              </div>
            </div>

            {/* Biểu đồ tỉ lệ */}
            <div style={{ padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ marginBottom: 12 }}>Tỉ lệ xếp loại</h3>
              <div style={{ display: 'flex', height: 32, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
                {XEPLOAI.map((x) => {
                  const count = stats.counts[x.label] || 0;
                  const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0;
                  if (pct == 0) return null;
                  return (
                    <div key={x.label} style={{ flex: count, background: x.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, minWidth: 30 }} title={`${x.label}: ${count} SV (${pct}%)`}>
                      {pct}%
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                {XEPLOAI.map((x) => (
                  <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: x.color }} />
                    <span>{x.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thống kê theo khoa */}
            <div style={{ padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ marginBottom: 12 }}>Theo khoa</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Khoa</th>
                      <th style={{ textAlign: 'center' }}>Tổng SV</th>
                      <th style={{ textAlign: 'center' }}>TB điểm</th>
                      {XEPLOAI.map((x) => <th key={x.label} style={{ textAlign: 'center', color: x.color }}>{x.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {byKhoa.map((k) => (
                      <tr key={k.makhoa}>
                        <td><strong>{k.makhoa}</strong></td>
                        <td style={{ textAlign: 'center' }}>{k.total}</td>
                        <td style={{ textAlign: 'center' }}>{k.total > 0 ? (k.sumDiem / k.total).toFixed(1) : '—'}</td>
                        {XEPLOAI.map((x) => (
                          <td key={x.label} style={{ textAlign: 'center' }}>
                            <span style={{ background: x.bg, color: x.color, padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>
                              {k.counts[x.label] || 0}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Thống kê theo lớp */}
            <div style={{ padding: '16px 0' }}>
              <h3 style={{ marginBottom: 12 }}>Theo lớp</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lớp</th>
                      <th>Khoa</th>
                      <th style={{ textAlign: 'center' }}>Tổng SV</th>
                      <th style={{ textAlign: 'center' }}>TB điểm</th>
                      {XEPLOAI.map((x) => <th key={x.label} style={{ textAlign: 'center', color: x.color }}>{x.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {byLop.map((l) => (
                      <tr key={l.malop}>
                        <td><strong>{l.malop}</strong></td>
                        <td>{l.makhoa}</td>
                        <td style={{ textAlign: 'center' }}>{l.total}</td>
                        <td style={{ textAlign: 'center' }}>{l.total > 0 ? (l.sumDiem / l.total).toFixed(1) : '—'}</td>
                        {XEPLOAI.map((x) => (
                          <td key={x.label} style={{ textAlign: 'center' }}>
                            <span style={{ background: x.bg, color: x.color, padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>
                              {l.counts[x.label] || 0}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {rows.length === 0 && !loading && filterHocky && (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
            Không có dữ liệu DRL đã chốt cho học kỳ này
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

export default CTSVDrlStats;
