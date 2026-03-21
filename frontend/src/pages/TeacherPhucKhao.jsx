import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { phucKhaoAPI, lookupAPI } from '../api/api';

const TRANGTHAI_CONFIG = {
  cho:      { label: 'Chờ xử lý',  color: '#f39c12', bg: '#fff3cd' },
  dangxuly: { label: 'Đang xử lý', color: '#3498db', bg: '#d6eaf8' },
  chapnhan: { label: 'Chấp nhận',  color: '#27ae60', bg: '#d5f5e3' },
  tuchoi:   { label: 'Từ chối',    color: '#e74c3c', bg: '#fde8e8' },
};

const TeacherPhucKhao = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchMssv, setSearchMssv] = useState('');
  const [selected, setSelected] = useState(null);
  const [ketqua, setKetqua] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.trangthai = filter;
      const res = await phucKhaoAPI.getAll(params);
      const data = Array.isArray(res.data) ? res.data : [];
      // GV chỉ xem phúc khảo của SV trong khoa mình
      const filtered = user?.makhoa ? data.filter(r => r.makhoa === user.makhoa) : data;
      setRows(filtered);
    } catch { setRows([]); } finally { setLoading(false); }
  };

  const handleAction = async (trangthai) => {
    if (!selected) return;
    try {
      setProcessing(true);
      setMessage('');
      await phucKhaoAPI.updateStatus(selected.maphuckhao, { trangthai, ketqua });
      setMessage(`✅ Đã cập nhật trạng thái.`);
      setSelected(null);
      setKetqua('');
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi cập nhật.'));
    } finally { setProcessing(false); }
  };

  const filtered = searchMssv ? rows.filter(r => r.mssv?.toLowerCase().includes(searchMssv.toLowerCase())) : rows;
  const counts = rows.reduce((acc, r) => { acc[r.trangthai] = (acc[r.trangthai] || 0) + 1; return acc; }, {});

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">🔄 Phúc khảo điểm — Khoa {user?.makhoa}</h1>
          <p style={{ color: '#666', marginTop: 4 }}>Xem và xử lý đơn phúc khảo của sinh viên trong khoa</p>
        </div>

        {message && (
          <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ margin: '8px 0' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { key: '', label: 'Tất cả', count: rows.length },
            { key: 'cho', label: 'Chờ xử lý', count: counts.cho || 0 },
            { key: 'dangxuly', label: 'Đang xử lý', count: counts.dangxuly || 0 },
            { key: 'chapnhan', label: 'Chấp nhận', count: counts.chapnhan || 0 },
            { key: 'tuchoi', label: 'Từ chối', count: counts.tuchoi || 0 },
          ].map(f => (
            <button key={f.key}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f.key)}>
              {f.label} ({f.count})
            </button>
          ))}
          <input className="form-control" style={{ width: 180, marginLeft: 'auto' }}
            placeholder="🔍 Tìm MSSV..." value={searchMssv}
            onChange={e => setSearchMssv(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16 }}>
          <div>
            {loading ? <div className="spinner" /> : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Không có đơn phúc khảo nào.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>MSSV</th><th>Họ tên</th><th>Lớp</th><th>Môn học</th><th>Ngày gửi</th><th>Trạng thái</th></tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const cfg = TRANGTHAI_CONFIG[r.trangthai] || {};
                    return (
                      <tr key={r.maphuckhao} onClick={() => { setSelected(r); setKetqua(r.ketqua || ''); setMessage(''); }}
                        style={{ cursor: 'pointer', background: selected?.maphuckhao === r.maphuckhao ? '#eff6ff' : undefined }}>
                        <td>{r.mssv}</td>
                        <td>{r.hoten}</td>
                        <td>{r.malop}</td>
                        <td>{r.tenmonhoc}</td>
                        <td style={{ fontSize: 12 }}>{new Date(r.ngaygui).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {selected && (
            <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, position: 'sticky', top: 16, alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Chi tiết đơn</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#999' }}>×</button>
              </div>
              <div style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <div><strong>MSSV:</strong> {selected.mssv} — {selected.hoten}</div>
                <div><strong>Lớp:</strong> {selected.malop}</div>
                <div><strong>Môn học:</strong> {selected.tenmonhoc}</div>
                <div><strong>Lý do:</strong> {selected.lydo}</div>
                <div><strong>Ngày gửi:</strong> {new Date(selected.ngaygui).toLocaleDateString('vi-VN')}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Kết quả xử lý</label>
                <textarea className="form-control" rows={3} value={ketqua}
                  onChange={e => setKetqua(e.target.value)}
                  placeholder="Nhập kết quả hoặc lý do từ chối..." />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <button className="btn btn-sm" disabled={processing}
                  onClick={() => handleAction('dangxuly')}
                  style={{ background: '#3498db', color: 'white', border: 'none' }}>⏳ Đang xử lý</button>
                <button className="btn btn-sm" disabled={processing}
                  onClick={() => handleAction('chapnhan')}
                  style={{ background: '#27ae60', color: 'white', border: 'none' }}>✅ Chấp nhận</button>
                <button className="btn btn-sm" disabled={processing}
                  onClick={() => handleAction('tuchoi')}
                  style={{ background: '#e74c3c', color: 'white', border: 'none' }}>❌ Từ chối</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherPhucKhao;
