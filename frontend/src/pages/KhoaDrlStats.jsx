import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { lookupAPI, drlSelfAPI } from '../api/api';

const XEPLOAI = [
  { label: 'Xuất sắc', min: 90, color: '#27ae60' },
  { label: 'Tốt', min: 80, color: '#2980b9' },
  { label: 'Khá', min: 65, color: '#8e44ad' },
  { label: 'Trung bình', min: 50, color: '#f39c12' },
  { label: 'Yếu', min: 35, color: '#e67e22' },
  { label: 'Kém', min: 0, color: '#e74c3c' },
];

const getXepLoai = (diem) => {
  if (diem == null) return null;
  return XEPLOAI.find(x => diem >= x.min) || XEPLOAI[XEPLOAI.length - 1];
};

const KhoaDrlStats = () => {
  const { user } = useAuth();
  const [hockyList, setHockyList] = useState([]);
  const [mahocky, setMahocky] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lopFilter, setLopFilter] = useState('');
  const [lopList, setLopList] = useState([]);

  useEffect(() => {
    lookupAPI.getHocKy().then(r => setHockyList(r.data || [])).catch(() => {});
    lookupAPI.getLopByKhoa(user?.makhoa).then(r => setLopList(r.data?.data || [])).catch(() => {});
  }, [user?.makhoa]);

  useEffect(() => { if (mahocky) load(); }, [mahocky, lopFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await drlSelfAPI.getByClassAndSemester(lopFilter || '', mahocky);
      const data = (res.data || []).filter(r => !user?.makhoa || r.makhoa === user.makhoa);
      setRows(data);
    } catch { setRows([]); } finally { setLoading(false); }
  };

  // Tính thống kê
  const daDuyet = rows.filter(r => r.trangthai === 'daduyet' && r.nguoi_duyet_ctsv);
  const diemList = daDuyet.filter(r => r.diem_ctsv != null).map(r => Number(r.diem_ctsv));
  const avg = diemList.length ? (diemList.reduce((a, b) => a + b, 0) / diemList.length).toFixed(1) : '-';
  const max = diemList.length ? Math.max(...diemList) : '-';
  const min = diemList.length ? Math.min(...diemList) : '-';

  const xepLoaiCount = XEPLOAI.map(x => ({
    ...x,
    count: diemList.filter(d => {
      const idx = XEPLOAI.indexOf(x);
      const upper = idx === 0 ? 101 : XEPLOAI[idx - 1].min;
      return d >= x.min && d < upper;
    }).length
  }));

  const exportCSV = () => {
    const headers = ['MSSV', 'Họ tên', 'Lớp', 'Điểm SV', 'Điểm CVHT', 'Điểm Khoa', 'Điểm CTSV', 'Xếp loại', 'Trạng thái'];
    const csvRows = rows.map(r => {
      const xl = getXepLoai(r.diem_ctsv);
      return [r.mssv, r.hoten, r.malop, r.tong_diem, r.diem_cvht ?? '', r.diem_khoa ?? '', r.diem_ctsv ?? '', xl?.label || '', r.trangthai];
    });
    const csv = [headers, ...csvRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thong-ke-drl-khoa-${user?.makhoa}-hk${mahocky}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="card-title">📊 Thống kê DRL — Khoa {user?.makhoa}</h1>
          </div>
          {rows.length > 0 && (
            <button className="btn btn-success btn-sm" onClick={exportCSV}>📥 Xuất CSV</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Học kỳ *</label>
            <select className="form-control" style={{ width: 200 }} value={mahocky} onChange={e => setMahocky(e.target.value)}>
              <option value="">-- Chọn học kỳ --</option>
              {hockyList.map(h => <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} - {h.namhoc}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Lớp</label>
            <select className="form-control" style={{ width: 180 }} value={lopFilter} onChange={e => setLopFilter(e.target.value)}>
              <option value="">Tất cả lớp</option>
              {lopList.map(l => <option key={l.malop} value={l.malop}>{l.tenlop || l.malop}</option>)}
            </select>
          </div>
        </div>

        {!mahocky ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Chọn học kỳ để xem thống kê.</div>
        ) : loading ? <div className="spinner" /> : (
          <>
            {/* Thống kê tổng quan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Tổng phiếu', value: rows.length, color: '#3498db' },
                { label: 'Đã duyệt cuối', value: daDuyet.length, color: '#27ae60' },
                { label: 'Chờ duyệt', value: rows.filter(r => r.trangthai === 'choduyet').length, color: '#f39c12' },
                { label: 'Chờ Khoa', value: rows.filter(r => r.trangthai === 'chokhoaduyet').length, color: '#e67e22' },
                { label: 'Điểm TB', value: avg, color: '#9b59b6' },
                { label: 'Điểm cao nhất', value: max, color: '#27ae60' },
                { label: 'Điểm thấp nhất', value: min, color: '#e74c3c' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: `1px solid ${s.color}30`, borderLeft: `3px solid ${s.color}`,
                  borderRadius: 6, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Phân bố xếp loại */}
            {diemList.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 12 }}>Phân bố xếp loại</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {xepLoaiCount.map(x => (
                    <div key={x.label} style={{ background: x.color + '15', border: `1px solid ${x.color}40`,
                      borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: x.color }}>{x.count}</div>
                      <div style={{ fontSize: 12, color: '#555' }}>{x.label}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {diemList.length ? Math.round(x.count / diemList.length * 100) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bảng chi tiết */}
            <h3 style={{ marginBottom: 8 }}>Danh sách chi tiết ({rows.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>MSSV</th><th>Họ tên</th><th>Lớp</th>
                    <th>Điểm SV</th><th>Điểm CVHT</th><th>Điểm Khoa</th><th>Điểm CTSV</th>
                    <th>Xếp loại</th><th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const xl = getXepLoai(r.diem_ctsv);
                    return (
                      <tr key={r.id}>
                        <td>{r.mssv}</td>
                        <td>{r.hoten}</td>
                        <td>{r.malop}</td>
                        <td>{r.tong_diem ?? '-'}</td>
                        <td>{r.diem_cvht ?? '-'}</td>
                        <td>{r.diem_khoa ?? '-'}</td>
                        <td style={{ fontWeight: 600, color: xl?.color }}>{r.diem_ctsv ?? '-'}</td>
                        <td>
                          {xl && <span style={{ background: xl.color + '20', color: xl.color, padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{xl.label}</span>}
                        </td>
                        <td style={{ fontSize: 12 }}>{r.trangthai}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KhoaDrlStats;
