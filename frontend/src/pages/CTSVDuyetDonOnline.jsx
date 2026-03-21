import React, { useState, useEffect } from 'react';
import api from '../api/api';

const LOAI_DON_LABEL = {
  xin_nghi_phep: 'Xin nghỉ phép / nghỉ ốm',
  xin_hoc_lai: 'Xin học lại / thi lại',
  xin_chuyen_nganh: 'Xin chuyển ngành',
  xin_bao_luu: 'Xin bảo lưu kết quả',
  xin_tot_nghiep: 'Đăng ký tốt nghiệp',
  xin_xac_nhan_sv: 'Xin xác nhận sinh viên',
  xin_bang_diem: 'Xin bảng điểm',
  xin_ktx: 'Đăng ký ký túc xá',
  khac: 'Khác',
};

const TRANGTHAI_CONFIG = {
  cho:      { label: 'Chờ xử lý',  color: '#e67e22', bg: '#fff3cd' },
  dangxuly: { label: 'Đang xử lý', color: '#3498db', bg: '#d6eaf8' },
  daduyet:  { label: 'Đã duyệt',   color: '#27ae60', bg: '#d5f5e3' },
  tuchoi:   { label: 'Từ chối',    color: '#e74c3c', bg: '#fde8e8' },
};

const CTSVDuyetDonOnline = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('cho');
  const [searchMssv, setSearchMssv] = useState('');
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ketqua, setKetqua] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter && filter !== 'all') params.trangthai = filter;
      if (searchMssv) params.mssv = searchMssv;
      const res = await api.get('/don-online', { params });
      setList(res.data?.data || []);
    } catch { setList([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, searchMssv]);

  const handleAction = async (trangthai) => {
    if (!selected) return;
    try {
      setProcessing(true);
      setMessage('');
      await api.put(`/don-online/${selected.madon}/status`, { trangthai, ketqua });
      setMessage(`✅ Đã cập nhật trạng thái thành "${TRANGTHAI_CONFIG[trangthai]?.label}"`);
      setSelected(null);
      setKetqua('');
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi cập nhật'));
    } finally { setProcessing(false); }
  };

  const counts = list.reduce((acc, d) => { acc[d.trangthai] = (acc[d.trangthai] || 0) + 1; return acc; }, {});

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">📋 Duyệt đơn trực tuyến (Hành chính)</h1>
          <p style={{ color: '#666', marginTop: 4 }}>Xem và xử lý đơn hành chính từ sinh viên</p>
        </div>

        {message && (
          <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ margin: '8px 0' }}>
            {message}
          </div>
        )}

        {/* Thống kê nhanh */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { key: 'all', label: 'Tất cả', color: '#6c757d' },
            { key: 'cho', label: 'Chờ xử lý', color: '#e67e22' },
            { key: 'dangxuly', label: 'Đang xử lý', color: '#3498db' },
            { key: 'daduyet', label: 'Đã duyệt', color: '#27ae60' },
            { key: 'tuchoi', label: 'Từ chối', color: '#e74c3c' },
          ].map(f => (
            <button key={f.key}
              onClick={() => setFilter(f.key === 'all' ? '' : f.key)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: `2px solid ${f.color}`,
                background: (filter === f.key || (f.key === 'all' && !filter)) ? f.color : 'white',
                color: (filter === f.key || (f.key === 'all' && !filter)) ? 'white' : f.color,
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}>
              {f.label} ({f.key === 'all' ? list.length : (counts[f.key] || 0)})
            </button>
          ))}
          <input className="form-control" style={{ width: 180, marginLeft: 'auto' }}
            placeholder="🔍 Tìm MSSV..." value={searchMssv}
            onChange={e => setSearchMssv(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16 }}>
          {/* Danh sách */}
          <div>
            {loading ? <div className="spinner" /> : list.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Không có đơn nào.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>MSSV</th><th>Họ tên</th><th>Lớp</th><th>Loại đơn</th>
                    <th>Tiêu đề</th><th>Ngày nộp</th><th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(don => {
                    const cfg = TRANGTHAI_CONFIG[don.trangthai] || {};
                    return (
                      <tr key={don.madon} onClick={() => { setSelected(don); setKetqua(don.ketqua || ''); setMessage(''); }}
                        style={{ cursor: 'pointer', background: selected?.madon === don.madon ? '#eff6ff' : undefined }}>
                        <td>{don.mssv}</td>
                        <td>{don.hoten}</td>
                        <td>{don.malop}</td>
                        <td style={{ fontSize: 12 }}>{LOAI_DON_LABEL[don.loaidon] || don.loaidon}</td>
                        <td>{don.tieude}</td>
                        <td style={{ fontSize: 12 }}>{new Date(don.ngaygui).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
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

          {/* Panel chi tiết */}
          {selected && (
            <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 20, position: 'sticky', top: 16, alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Chi tiết đơn #{selected.madon}</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#999' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, marginBottom: 16 }}>
                <div><strong>MSSV:</strong> {selected.mssv} — {selected.hoten}</div>
                <div><strong>Lớp:</strong> {selected.malop} | <strong>Khoa:</strong> {selected.makhoa}</div>
                <div><strong>Loại đơn:</strong> {LOAI_DON_LABEL[selected.loaidon] || selected.loaidon}</div>
                <div><strong>Tiêu đề:</strong> {selected.tieude}</div>
                {selected.noidung && (
                  <div>
                    <strong>Nội dung:</strong>
                    <div style={{ background: '#fff', borderRadius: 6, padding: '8px 10px', marginTop: 4, whiteSpace: 'pre-wrap' }}>{selected.noidung}</div>
                  </div>
                )}
                {selected.ghichu && <div><strong>Ghi chú SV:</strong> {selected.ghichu}</div>}
                <div><strong>Ngày nộp:</strong> {new Date(selected.ngaygui).toLocaleString('vi-VN')}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Kết quả / Phản hồi cho sinh viên</label>
                <textarea className="form-control" rows={3} value={ketqua}
                  onChange={e => setKetqua(e.target.value)}
                  placeholder="Nhập kết quả xử lý hoặc lý do từ chối..." />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {selected.trangthai !== 'dangxuly' && (
                  <button className="btn btn-secondary btn-sm" disabled={processing}
                    onClick={() => handleAction('dangxuly')}>⏳ Đang xử lý</button>
                )}
                <button className="btn btn-success btn-sm" disabled={processing}
                  onClick={() => handleAction('daduyet')}
                  style={{ background: '#27ae60', borderColor: '#27ae60', color: 'white' }}>
                  ✅ Duyệt
                </button>
                <button className="btn btn-danger btn-sm" disabled={processing}
                  onClick={() => handleAction('tuchoi')}
                  style={{ background: '#e74c3c', borderColor: '#e74c3c', color: 'white' }}>
                  ❌ Từ chối
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CTSVDuyetDonOnline;
