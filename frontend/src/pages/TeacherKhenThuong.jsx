import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { khenThuongKyLuatAPI, lookupAPI } from '../api/api';

const TeacherKhenThuong = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hockyList, setHockyList] = useState([]);
  const [mahocky, setMahocky] = useState('');
  const [loai, setLoai] = useState('');
  const [searchMssv, setSearchMssv] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ mssv: '', loai: 'khenthuong', noidung: '', muc: '', ngay: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    lookupAPI.getHocKy().then(r => setHockyList(r.data || [])).catch(() => {});
    load();
  }, []);

  useEffect(() => { load(); }, [mahocky, loai]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await khenThuongKyLuatAPI.getAll({ mahocky: mahocky || undefined, loai: loai || undefined });
      const data = Array.isArray(res.data) ? res.data : [];
      const filtered = user?.makhoa ? data.filter(r => r.makhoa === user.makhoa) : data;
      setRows(filtered);
    } catch { setRows([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mssv || !form.noidung) { setMessage('⚠️ Vui lòng điền đầy đủ thông tin.'); return; }
    try {
      setSaving(true);
      setMessage('');
      await khenThuongKyLuatAPI.create({ ...form, mahocky: mahocky || undefined });
      setMessage('✅ Đã thêm thành công.');
      setForm({ mssv: '', loai: 'khenthuong', noidung: '', muc: '', ngay: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi lưu.'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bản ghi này?')) return;
    try {
      await khenThuongKyLuatAPI.delete(id);
      load();
    } catch (err) { setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi xóa.')); }
  };

  const filtered = searchMssv ? rows.filter(r => r.mssv?.toLowerCase().includes(searchMssv.toLowerCase())) : rows;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="card-title">⭐ Khen thưởng / Kỷ luật — Khoa {user?.makhoa}</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Đóng' : '+ Thêm mới'}
          </button>
        </div>

        {message && (
          <div className={`alert ${message.startsWith('✅') ? 'alert-success' : message.startsWith('⚠️') ? 'alert-warning' : 'alert-danger'}`}
            style={{ margin: '8px 0' }}>{message}</div>
        )}

        {showForm && (
          <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12 }}>Thêm khen thưởng / kỷ luật</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">MSSV *</label>
                  <input className="form-control" value={form.mssv}
                    onChange={e => setForm({ ...form, mssv: e.target.value })} placeholder="Nhập MSSV..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Loại *</label>
                  <select className="form-control" value={form.loai} onChange={e => setForm({ ...form, loai: e.target.value })}>
                    <option value="khenthuong">⭐ Khen thưởng</option>
                    <option value="kyluat">⚠️ Kỷ luật</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nội dung *</label>
                  <input className="form-control" value={form.noidung}
                    onChange={e => setForm({ ...form, noidung: e.target.value })} placeholder="Mô tả..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Mức</label>
                  <input className="form-control" value={form.muc}
                    onChange={e => setForm({ ...form, muc: e.target.value })} placeholder="VD: Cấp trường, Cảnh cáo..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày</label>
                  <input className="form-control" type="date" value={form.ngay}
                    onChange={e => setForm({ ...form, ngay: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <select className="form-control" style={{ width: 200 }} value={mahocky} onChange={e => setMahocky(e.target.value)}>
            <option value="">-- Tất cả học kỳ --</option>
            {hockyList.map(h => <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} - {h.namhoc}</option>)}
          </select>
          <select className="form-control" style={{ width: 160 }} value={loai} onChange={e => setLoai(e.target.value)}>
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
              <tr><th>MSSV</th><th>Họ tên</th><th>Lớp</th><th>Loại</th><th>Nội dung</th><th>Mức</th><th>Ngày</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id || r.maktkt}>
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
                  <td>{r.noidung}</td>
                  <td>{r.muc || '-'}</td>
                  <td style={{ fontSize: 12 }}>{r.ngay ? new Date(r.ngay).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id || r.maktkt)}
                      style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TeacherKhenThuong;
