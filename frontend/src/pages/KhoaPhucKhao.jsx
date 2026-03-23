import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { phucKhaoAPI } from '../api/api';

const TRANGTHAI_CONFIG = {
  cho:          { label: 'Chờ GV xem xét', color: '#f39c12', bg: '#fff3cd' },
  gv_duyet:     { label: 'GV đã chuyển',   color: '#3498db', bg: '#d6eaf8' },
  gv_tuchoi:    { label: 'GV từ chối',     color: '#e74c3c', bg: '#fde8e8' },
  khoa_duyet:   { label: 'Khoa đã duyệt',  color: '#8e44ad', bg: '#f5eef8' },
  khoa_tuchoi:  { label: 'Khoa từ chối',   color: '#c0392b', bg: '#fde8e8' },
  chapnhan:     { label: 'CTSV chấp nhận', color: '#27ae60', bg: '#d5f5e3' },
  tuchoi:       { label: 'CTSV từ chối',   color: '#e74c3c', bg: '#fde8e8' },
};

const KhoaPhucKhao = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('gv_duyet');
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
      setRows(data);
    } catch { setRows([]); } finally { setLoading(false); }
  };

  const handleAction = async (trangthai) => {
    if (!selected) return;
    try {
      setProcessing(true);
      setMessage('');
      await phucKhaoAPI.updateStatus(selected.maphuckhao, { trangthai, ketqua });
      setMessage('✅ Đã cập nhật trạng thái.');
      setSelected(null);
      setKetqua('');
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi cập nhật.'));
    } finally { setProcessing(false); }
  };

  const counts = rows.reduce((acc, r) => { acc[r.trangthai] = (acc[r.trangthai] || 0) + 1; return acc; }, {});

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">📋 Phúc khảo điểm — Khoa {user?.makhoa}</h1>
          <p style={{ color: '#666', marginTop: 4 }}>Duyệt đơn phúc khảo đã được giảng viên xem xét, chuyển lên CTSV</p>
        </div>

        {message && (
          <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ margin: '8px 0' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { key: 'gv_duyet',   label: 'Chờ Khoa duyệt' },
            { key: 'khoa_duyet', label: 'Đã chuyển CTSV' },
            { key: 'khoa_tuchoi', label: 'Khoa từ chối' },
            { key: '',           label: 'Tất cả' },
          ].map(f => (
            <button key={f.key}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16 }}>
          <div>
            {loading ? <div className="spinner" /> : rows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Không có đơn nào.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>MSSV</th><th>Họ tên</th><th>Lớp</th><th>Môn học</th><th>Nhận xét GV</th><th>Ngày gửi</th><th>Trạng thái</th></tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const cfg = TRANGTHAI_CONFIG[r.trangthai] || {};
                    return (
                      <tr key={r.maphuckhao}
                        onClick={() => { setSelected(r); setKetqua(r.ketqua || ''); setMessage(''); }}
                        style={{ cursor: 'pointer', background: selected?.maphuckhao === r.maphuckhao ? '#eff6ff' : undefined }}>
                        <td>{r.mssv}</td>
                        <td>{r.hoten}</td>
                        <td>{r.malop}</td>
                        <td>{r.tenmonhoc}</td>
                        <td style={{ fontSize: 12, color: '#555' }}>{r.ketqua || '—'}</td>
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
                <div><strong>Lý do SV:</strong> {selected.lydo}</div>
                <div><strong>Nhận xét GV:</strong> {selected.ketqua || '—'}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Ý kiến của Khoa</label>
                <textarea className="form-control" rows={3} value={ketqua}
                  onChange={e => setKetqua(e.target.value)}
                  placeholder="Nhập ý kiến hoặc lý do từ chối..." />
              </div>
              {selected.trangthai === 'gv_duyet' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-sm" disabled={processing}
                    onClick={() => handleAction('khoa_duyet')}
                    style={{ background: '#8e44ad', color: 'white', border: 'none' }}>
                    ✅ Chuyển lên CTSV
                  </button>
                  <button className="btn btn-sm" disabled={processing}
                    onClick={() => handleAction('khoa_tuchoi')}
                    style={{ background: '#e74c3c', color: 'white', border: 'none' }}>
                    ❌ Từ chối
                  </button>
                </div>
              )}
              {selected.trangthai !== 'gv_duyet' && (
                <div style={{ padding: '8px 12px', background: '#f0f0f0', borderRadius: 6, fontSize: 13, color: '#666' }}>
                  Đơn này đã được xử lý ({TRANGTHAI_CONFIG[selected.trangthai]?.label})
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KhoaPhucKhao;
