import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { khenThuongKyLuatAPI, lookupAPI } from '../api/api';
import api from '../api/api';

const MUC_KHENTHUONG = ['Cấp lớp', 'Cấp khoa', 'Cấp trường', 'Cấp bộ', 'Xuất sắc'];
const MUC_KYLUAT = ['Khiển trách', 'Cảnh cáo', 'Đình chỉ học tập', 'Buộc thôi học'];

const StudentSelect = ({ value, onChange, makhoa }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.get('/users/students/all')
      .then(r => {
        const all = r.data?.data || [];
        setStudents(makhoa ? all.filter(s => s.makhoa === makhoa) : all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [makhoa]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !q || (s.mssv || '').toLowerCase().includes(q) || (s.hoten || '').toLowerCase().includes(q);
  });

  const selected = students.find(s => s.mssv === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4,
        cursor: 'pointer', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: selected ? '#000' : '#999' }}>
          {selected ? `${selected.mssv} — ${selected.hoten}` : '-- Chọn sinh viên --'}
        </span>
        <span style={{ fontSize: 10, color: '#666' }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          background: 'white', border: '1px solid #ccc', borderRadius: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 260, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid #eee' }}>
            <input autoFocus placeholder="Tìm MSSV hoặc tên..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? <div style={{ padding: 12, color: '#999', textAlign: 'center' }}>Đang tải...</div>
              : filtered.length === 0 ? <div style={{ padding: 12, color: '#999', textAlign: 'center' }}>Không tìm thấy</div>
              : filtered.slice(0, 100).map(s => (
                <div key={s.mssv} onClick={() => { onChange(s.mssv); setOpen(false); setSearch(''); }}
                  style={{
                    padding: '8px 12px', cursor: 'pointer',
                    background: s.mssv === value ? '#e8f4fd' : 'white',
                    borderBottom: '1px solid #f5f5f5',
                  }}
                  onMouseEnter={e => { if (s.mssv !== value) e.currentTarget.style.background = '#f5f5f5'; }}
                  onMouseLeave={e => { if (s.mssv !== value) e.currentTarget.style.background = 'white'; }}>
                  <span style={{ fontWeight: 600, marginRight: 8 }}>{s.mssv}</span>
                  <span style={{ color: '#555' }}>{s.hoten}</span>
                  {s.malop && <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>({s.malop})</span>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TRANGTHAI_CFG = {
  cho_duyet: { label: 'Chờ CTSV duyệt', color: '#f39c12', bg: '#fff3cd' },
  da_duyet:  { label: 'Đã duyệt',        color: '#27ae60', bg: '#d5f5e3' },
  tu_choi:   { label: 'Bị từ chối',      color: '#e74c3c', bg: '#fde8e8' },
};

const TeacherKhenThuong = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hockyList, setHockyList] = useState([]);
  const [mahocky, setMahocky] = useState('');
  const [loaiFilter, setLoaiFilter] = useState('');
  const [searchMssv, setSearchMssv] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    mssv: '', mahocky: '', loai: 'khenthuong', noidung: '', muc: '', soquyetdinh: '', ngayquyetdinh: '', ghichu: '',
  });

  useEffect(() => {
    lookupAPI.getHocKy().then(r => {
      const list = r.data || [];
      setHockyList(list);
      if (list.length > 0) setForm(f => ({ ...f, mahocky: list[0].mahocky }));
    }).catch(() => {});
    load();
  }, []);

  useEffect(() => { load(); }, [mahocky, loaiFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await khenThuongKyLuatAPI.getAll({ mahocky: mahocky || undefined, loai: loaiFilter || undefined });
      const data = Array.isArray(res.data) ? res.data : [];
      setRows(user?.makhoa ? data.filter(r => (r.makhoa || r.makhoa_sv) === user.makhoa) : data);
    } catch { setRows([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mssv || !form.noidung || !form.mahocky) {
      setMessage('⚠️ Vui lòng chọn sinh viên, học kỳ và nhập nội dung.');
      return;
    }
    try {
      setSaving(true);
      setMessage('');
      await khenThuongKyLuatAPI.create({ ...form, makhoa: user?.makhoa });
      setMessage('✅ Đã gửi đơn. CTSV sẽ xem xét và duyệt.');
      setForm(f => ({ ...f, mssv: '', noidung: '', muc: '', soquyetdinh: '', ngayquyetdinh: '', ghichu: '' }));
      setShowForm(false);
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi gửi.'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bản ghi này?')) return;
    try {
      await khenThuongKyLuatAPI.delete(id);
      load();
    } catch (err) { setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi xóa.')); }
  };

  const mucOptions = form.loai === 'khenthuong' ? MUC_KHENTHUONG : MUC_KYLUAT;
  const filtered = rows.filter(r => !searchMssv || (r.mssv || '').toLowerCase().includes(searchMssv.toLowerCase()));

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="card-title">⭐ Khen thưởng / Kỷ luật — Khoa {user?.makhoa}</h1>
            <p style={{ color: '#666', margin: '4px 0 0', fontSize: 13 }}>
              Đơn do Giảng viên tạo sẽ gửi đến CTSV xem xét và duyệt trước khi thông báo đến sinh viên.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setMessage(''); }}>
            {showForm ? 'Đóng' : '+ Tạo đơn mới'}
          </button>
        </div>

        {message && (
          <div className={`alert ${message.startsWith('✅') ? 'alert-success' : message.startsWith('⚠️') ? 'alert-warning' : 'alert-danger'}`}
            style={{ margin: '8px 0' }}>{message}</div>
        )}

        {showForm && (
          <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 20, marginBottom: 16, border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginBottom: 16, marginTop: 0 }}>Tạo đơn khen thưởng / kỷ luật</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Sinh viên *</label>
                  <StudentSelect value={form.mssv} onChange={mssv => setForm(f => ({ ...f, mssv }))} makhoa={user?.makhoa} />
                </div>
                <div className="form-group">
                  <label className="form-label">Học kỳ *</label>
                  <select className="form-control" value={form.mahocky} onChange={e => setForm(f => ({ ...f, mahocky: e.target.value }))} required>
                    <option value="">-- Chọn học kỳ --</option>
                    {hockyList.map(h => <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} — {h.namhoc}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Loại *</label>
                  <select className="form-control" value={form.loai}
                    onChange={e => setForm(f => ({ ...f, loai: e.target.value, muc: '' }))}>
                    <option value="khenthuong">⭐ Khen thưởng</option>
                    <option value="kyluat">⚠️ Kỷ luật</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mức *</label>
                  <select className="form-control" value={form.muc} onChange={e => setForm(f => ({ ...f, muc: e.target.value }))} required>
                    <option value="">-- Chọn mức --</option>
                    {mucOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Số quyết định</label>
                  <input className="form-control" value={form.soquyetdinh}
                    onChange={e => setForm(f => ({ ...f, soquyetdinh: e.target.value }))} placeholder="VD: 123/QĐ-CNTT" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nội dung *</label>
                  <textarea className="form-control" rows={3} value={form.noidung}
                    onChange={e => setForm(f => ({ ...f, noidung: e.target.value }))}
                    placeholder="Mô tả lý do khen thưởng / kỷ luật..." required />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày quyết định</label>
                  <input className="form-control" type="date" value={form.ngayquyetdinh}
                    onChange={e => setForm(f => ({ ...f, ngayquyetdinh: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ghi chú</label>
                  <input className="form-control" value={form.ghichu}
                    onChange={e => setForm(f => ({ ...f, ghichu: e.target.value }))} placeholder="Tùy chọn..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang gửi...' : '📤 Gửi lên CTSV'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <select className="form-control" style={{ width: 200 }} value={mahocky} onChange={e => setMahocky(e.target.value)}>
            <option value="">-- Tất cả học kỳ --</option>
            {hockyList.map(h => <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} — {h.namhoc}</option>)}
          </select>
          <select className="form-control" style={{ width: 160 }} value={loaiFilter} onChange={e => setLoaiFilter(e.target.value)}>
            <option value="">Tất cả loại</option>
            <option value="khenthuong">Khen thưởng</option>
            <option value="kyluat">Kỷ luật</option>
          </select>
          <input className="form-control" style={{ width: 180 }} placeholder="🔍 Tìm MSSV..."
            value={searchMssv} onChange={e => setSearchMssv(e.target.value)} />
        </div>

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Không có dữ liệu.</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>MSSV</th><th>Họ tên</th><th>Lớp</th><th>Loại</th><th>Mức</th><th>Nội dung</th><th>Học kỳ</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const cfg = TRANGTHAI_CFG[r.trangthai] || TRANGTHAI_CFG.cho_duyet;
                return (
                  <tr key={r.id}>
                    <td>{r.mssv}</td>
                    <td>{r.hoten}</td>
                    <td>{r.malop}</td>
                    <td>
                      <span style={{
                        background: r.loai === 'khenthuong' ? '#d5f5e3' : '#fde8e8',
                        color: r.loai === 'khenthuong' ? '#27ae60' : '#e74c3c',
                        padding: '2px 8px', borderRadius: 12, fontSize: 12
                      }}>
                        {r.loai === 'khenthuong' ? '⭐ Khen thưởng' : '⚠️ Kỷ luật'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{r.muc || '—'}</td>
                    <td style={{ maxWidth: 200, fontSize: 13 }}>{r.noidung}</td>
                    <td style={{ fontSize: 12 }}>{r.tenhocky || r.mahocky}</td>
                    <td>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td>
                      {r.trangthai === 'cho_duyet' && (
                        <button className="btn btn-sm" onClick={() => handleDelete(r.id)}
                          style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                          Hủy
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TeacherKhenThuong;
