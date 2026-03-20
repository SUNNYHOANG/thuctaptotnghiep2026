import React, { useEffect, useState, useMemo } from 'react';
import { drlSelfAPI, lookupAPI } from '../api/api';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'choduyet', label: 'Chờ GV duyệt' },
  { value: 'chokhoaduyet', label: 'Chờ Khoa duyệt' },
  { value: 'daduyet', label: 'Chờ CTSV chốt' },
  { value: 'bituchoi', label: 'Bị từ chối' },
];

const statusBadge = (row) => {
  if (row.trangthai === 'bituchoi') return { text: 'Bị từ chối', bg: '#fee2e2', color: '#dc2626' };
  if (row.trangthai === 'choduyet') return { text: 'Chờ GV duyệt', bg: '#f3f4f6', color: '#6b7280' };
  if (row.trangthai === 'chokhoaduyet') return { text: 'Chờ Khoa duyệt', bg: '#fef3c7', color: '#d97706' };
  if (row.trangthai === 'daduyet' && !row.nguoi_duyet_ctsv) return { text: 'Chờ CTSV chốt', bg: '#dbeafe', color: '#2563eb' };
  if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv) return { text: '✅ Đã chốt', bg: '#dcfce7', color: '#15803d' };
  return { text: row.trangthai, bg: '#f3f4f6', color: '#374151' };
};

const CTSVDrlManager = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hockyList, setHockyList] = useState([]);
  const [khoaList, setKhoaList] = useState([]);
  const [lopList, setLopList] = useState([]);

  const [filterHocky, setFilterHocky] = useState('');
  const [filterKhoa, setFilterKhoa] = useState('');
  const [filterLop, setFilterLop] = useState('');
  const [filterTrangthai, setFilterTrangthai] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    lookupAPI.getHocKy().then((r) => setHockyList(r.data || [])).catch(() => {});
    drlSelfAPI.getKhoaList().then((r) => setKhoaList(r.data || [])).catch(() => {});
    lookupAPI.getLop().then((r) => setLopList(r.data?.data || r.data || [])).catch(() => {});
  }, []);

  const loadData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const params = {};
      if (filterHocky) params.mahocky = filterHocky;
      if (filterKhoa) params.makhoa = filterKhoa;
      if (filterLop) params.malop = filterLop;
      if (filterTrangthai) params.trangthai = filterTrangthai;
      const res = await drlSelfAPI.manage(params);
      setRows(res.data || []);
      if ((res.data || []).length === 0) setMessage('Không có phiếu nào phù hợp với bộ lọc.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  // Thống kê tổng hợp
  const stats = useMemo(() => {
    const total = rows.length;
    const choduyet = rows.filter((r) => r.trangthai === 'choduyet').length;
    const chokhoa = rows.filter((r) => r.trangthai === 'chokhoaduyet').length;
    const choctsv = rows.filter((r) => r.trangthai === 'daduyet' && !r.nguoi_duyet_ctsv).length;
    const dachoт = rows.filter((r) => r.trangthai === 'daduyet' && r.nguoi_duyet_ctsv).length;
    const bituchoi = rows.filter((r) => r.trangthai === 'bituchoi').length;
    return { total, choduyet, chokhoa, choctsv, dachoт, bituchoi };
  }, [rows]);

  // Lọc lớp theo khoa đã chọn
  const filteredLopList = useMemo(() => {
    if (!filterKhoa) return Array.isArray(lopList) ? lopList : [];
    return (Array.isArray(lopList) ? lopList : []).filter((l) => {
      const lop = typeof l === 'object' ? l : { malop: l };
      return !lop.makhoa || lop.makhoa === filterKhoa;
    });
  }, [lopList, filterKhoa]);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">📊 Quản Lý Điểm Rèn Luyện</h1>
          <p style={{ color: '#666', marginTop: 4, marginBottom: 12 }}>
            Tổng hợp tất cả phiếu tự đánh giá DRL của sinh viên toàn trường
          </p>

          {/* Bộ lọc */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Học kỳ</label>
              <select className="form-control" style={{ width: 180 }} value={filterHocky} onChange={(e) => setFilterHocky(e.target.value)}>
                <option value="">Tất cả học kỳ</option>
                {hockyList.map((h) => (
                  <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} - {h.namhoc}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Khoa</label>
              <select className="form-control" style={{ width: 160 }} value={filterKhoa}
                onChange={(e) => { setFilterKhoa(e.target.value); setFilterLop(''); }}>
                <option value="">Tất cả khoa</option>
                {khoaList.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Lớp</label>
              <select className="form-control" style={{ width: 160 }} value={filterLop} onChange={(e) => setFilterLop(e.target.value)}>
                <option value="">Tất cả lớp</option>
                {filteredLopList.map((l) => {
                  const val = typeof l === 'object' ? l.malop : l;
                  const label = typeof l === 'object' ? (l.tenlop || l.malop) : l;
                  return <option key={val} value={val}>{label}</option>;
                })}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Trạng thái</label>
              <select className="form-control" style={{ width: 180 }} value={filterTrangthai} onChange={(e) => setFilterTrangthai(e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="button" onClick={loadData} disabled={loading}>
              {loading ? 'Đang tải...' : '🔍 Tìm kiếm'}
            </button>
          </div>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        {/* Thống kê nhanh */}
        {rows.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 0', borderBottom: '1px solid #e5e7eb', marginBottom: 12 }}>
            <StatCard label="Tổng phiếu" value={stats.total} color="#374151" />
            <StatCard label="Chờ GV duyệt" value={stats.choduyet} color="#6b7280" />
            <StatCard label="Chờ Khoa duyệt" value={stats.chokhoa} color="#d97706" />
            <StatCard label="Chờ CTSV chốt" value={stats.choctsv} color="#2563eb" />
            <StatCard label="Đã chốt" value={stats.dachoт} color="#15803d" />
            <StatCard label="Bị từ chối" value={stats.bituchoi} color="#dc2626" />
          </div>
        )}

        {/* Bảng dữ liệu */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>MSSV</th>
                <th>Họ tên</th>
                <th>Lớp</th>
                <th>Khoa</th>
                <th>Học kỳ</th>
                <th style={{ textAlign: 'center' }}>Điểm SV</th>
                <th style={{ textAlign: 'center' }}>Điểm CVHT</th>
                <th style={{ textAlign: 'center' }}>Điểm Khoa</th>
                <th style={{ textAlign: 'center' }}>Điểm CTSV</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const badge = statusBadge(row);
                return (
                  <tr key={row.id}>
                    <td>{row.mssv}</td>
                    <td>{row.hoten}</td>
                    <td>{row.malop}</td>
                    <td>{row.makhoa}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{row.tenhocky || row.mahocky}</td>
                    <td style={{ textAlign: 'center' }}>{row.tong_diem ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{row.diem_cvht ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{row.diem_khoa ?? '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: row.diem_ctsv != null ? 700 : 400, color: row.diem_ctsv != null ? '#15803d' : undefined }}>
                      {row.diem_ctsv ?? '—'}
                    </td>
                    <td>
                      <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 4, fontSize: 12, whiteSpace: 'nowrap' }}>
                        {badge.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>
                    Chọn bộ lọc và nhấn "Tìm kiếm" để xem danh sách phiếu DRL
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div style={{ background: '#f9fafb', border: `1px solid ${color}22`, borderRadius: 8, padding: '8px 16px', minWidth: 110, textAlign: 'center' }}>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
  </div>
);

export default CTSVDrlManager;
